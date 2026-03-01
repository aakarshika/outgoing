/** Event Requests page — community-driven request board. */

import { ArrowBigUp, Plus } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { CategoryChips } from '@/features/events/CategoryChips';
import { useRequests } from '@/features/requests/hooks';
import type { EventRequest } from '@/types/requests';
import client from '@/api/client';

export default function RequestsPage() {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [category, setCategory] = useState<string | undefined>();
    const [showForm, setShowForm] = useState(false);

    const { data: response, isLoading } = useRequests({ category, sort: 'trending' });

    const upvoteMutation = useMutation({
        mutationFn: async ({ id, hasUpvoted }: { id: number; hasUpvoted: boolean }) => {
            if (hasUpvoted) {
                return client.delete(`/requests/${id}/upvote/`);
            }
            return client.post(`/requests/${id}/upvote/`);
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
    });

    const createMutation = useMutation({
        mutationFn: async (formData: Record<string, string>) => {
            const { data } = await client.post('/requests/', formData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['requests'] });
            setShowForm(false);
            toast.success('Request posted!');
        },
    });
    const wishlistMutation = useMutation({
        mutationFn: async ({
            id,
            wishlistAs,
        }: {
            id: number;
            wishlistAs: 'goer' | 'host' | 'vendor';
        }) => {
            const { data } = await client.post(`/requests/${id}/wishlist/`, {
                wishlist_as: wishlistAs,
            });
            return data;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
    });
    const removeWishlistMutation = useMutation({
        mutationFn: async (id: number) => client.delete(`/requests/${id}/wishlist/`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['requests'] }),
    });

    const requests: EventRequest[] = response?.data || [];

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        createMutation.mutate({
            title: form.get('title') as string,
            description: form.get('description') as string,
            location_city: form.get('location_city') as string,
        });
    };

    return (
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-foreground">Event Requests</h1>
                {isAuthenticated && (
                    <Button size="sm" onClick={() => setShowForm(!showForm)} className="gap-1.5">
                        <Plus className="h-4 w-4" /> Request
                    </Button>
                )}
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreate} className="rounded-xl border bg-card p-4 space-y-3 mb-6">
                    <input
                        name="title"
                        required
                        placeholder="What event do you want to see?"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <textarea
                        name="description"
                        required
                        rows={3}
                        placeholder="Describe what would make this event great..."
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                    <input
                        name="location_city"
                        placeholder="City (optional)"
                        className="w-full rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <div className="flex gap-2">
                        <Button type="submit" size="sm" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Posting...' : 'Post Request'}
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            <CategoryChips selected={category} onSelect={setCategory} />

            <div className="mt-4 space-y-3">
                {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
                    ))
                ) : requests.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="text-5xl mb-4">💡</div>
                        <h3 className="text-lg font-semibold">No requests yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                            Be the first to request an event!
                        </p>
                    </div>
                ) : (
                    requests.map((req) => (
                        <div
                            key={req.id}
                            className="flex gap-4 rounded-xl border bg-card p-4 transition-all hover:shadow-sm"
                        >
                            {/* Upvote */}
                            <button
                                onClick={() => {
                                    if (!isAuthenticated) return;
                                    upvoteMutation.mutate({
                                        id: req.id,
                                        hasUpvoted: req.user_has_upvoted,
                                    });
                                }}
                                className={`flex flex-col items-center gap-0.5 min-w-[48px] rounded-lg py-2 px-1 transition-colors
                  ${req.user_has_upvoted ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}
                `}
                            >
                                <ArrowBigUp
                                    className={`h-5 w-5 ${req.user_has_upvoted ? 'fill-primary' : ''}`}
                                />
                                <span className="text-sm font-semibold">{req.upvote_count}</span>
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-foreground">{req.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                                    {req.description}
                                </p>
                                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                                    <span>by {req.requester_name}</span>
                                    {req.category && (
                                        <span className="rounded-full bg-muted px-2 py-0.5">
                                            {req.category.name}
                                        </span>
                                    )}
                                    {req.location_city && <span>📍 {req.location_city}</span>}
                                </div>
                                {isAuthenticated && (
                                    <div className="mt-3 flex flex-wrap items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            Add to wishlist as:
                                        </span>
                                        {(['goer', 'host', 'vendor'] as const).map((option) => (
                                            <Button
                                                key={option}
                                                type="button"
                                                size="sm"
                                                variant={
                                                    req.user_wishlist_as === option
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                onClick={() =>
                                                    wishlistMutation.mutate({
                                                        id: req.id,
                                                        wishlistAs: option,
                                                    })
                                                }
                                                disabled={
                                                    wishlistMutation.isPending ||
                                                    removeWishlistMutation.isPending
                                                }
                                            >
                                                {option === 'goer'
                                                    ? 'Goer'
                                                    : option === 'host'
                                                      ? 'Host'
                                                      : 'Vendor'}
                                            </Button>
                                        ))}
                                        {req.user_wishlist_as && (
                                            <Button
                                                type="button"
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => removeWishlistMutation.mutate(req.id)}
                                                disabled={
                                                    wishlistMutation.isPending ||
                                                    removeWishlistMutation.isPending
                                                }
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
