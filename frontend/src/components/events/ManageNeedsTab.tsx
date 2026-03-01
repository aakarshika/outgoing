import { useState } from 'react';
import { Briefcase, CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useEventNeeds, useCreateEventNeed, useReviewNeedApplication } from '@/features/needs/hooks';
import { VENDOR_CATEGORIES, getCategoryLabel } from '@/constants/categories';
import type { EventNeed, NeedApplication } from '@/types/needs';

export function ManageNeedsTab({ eventId }: { eventId: number }) {
    const { data: needsResponse, isLoading } = useEventNeeds(eventId);
    const needs = needsResponse?.data || [];

    const createNeedMutation = useCreateEventNeed();
    const reviewApplicationMutation = useReviewNeedApplication();

    const [isCreating, setIsCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [criticality, setCriticality] = useState<'essential' | 'replaceable' | 'non_substitutable'>('replaceable');
    const [budgetMin, setBudgetMin] = useState('');
    const [budgetMax, setBudgetMax] = useState('');

    const handleCreateNeed = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createNeedMutation.mutateAsync({
                eventId,
                payload: {
                    title,
                    description,
                    category,
                    criticality,
                    budget_min: budgetMin || null,
                    budget_max: budgetMax || null,
                },
            });
            toast.success('Need created successfully!');
            setIsCreating(false);
            setTitle('');
            setDescription('');
            setCategory('');
            setBudgetMin('');
            setBudgetMax('');
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to create need');
        }
    };

    const handleReview = async (applicationId: number, status: 'accepted' | 'rejected') => {
        try {
            await reviewApplicationMutation.mutateAsync({ applicationId, status });
            toast.success(`Application ${status}!`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Failed to review application');
        }
    };

    if (isLoading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading needs...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card rounded-xl border p-4">
                <div>
                    <h2 className="text-lg font-bold flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-primary" /> Vendor Needs
                    </h2>
                    <p className="text-sm text-muted-foreground">Manage service requests and vendor applications</p>
                </div>
                {!isCreating && (
                    <Button onClick={() => setIsCreating(true)}>Add New Need</Button>
                )}
            </div>

            {isCreating && (
                <div className="bg-card rounded-xl border p-6">
                    <h3 className="text-md font-semibold mb-4">Create New Need</h3>
                    <form onSubmit={handleCreateNeed} className="space-y-4">
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Title (e.g., DJ Required)</label>
                                <input required value={title} onChange={e => setTitle(e.target.value)} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category *</label>
                                <select required value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border bg-background px-4 py-2 text-sm">
                                    <option value="">Select a category</option>
                                    {VENDOR_CATEGORIES.map(group => (
                                        <optgroup key={group.group} label={group.group}>
                                            {group.items.map(item => (
                                                <option key={item.id} value={item.id}>{item.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Criticality</label>
                                <select value={criticality} onChange={e => setCriticality(e.target.value as any)} className="w-full rounded-lg border bg-background px-4 py-2 text-sm">
                                    <option value="essential">Essential</option>
                                    <option value="replaceable">Replaceable</option>
                                    <option value="non_substitutable">Non-Substitutable</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Min Budget ($)</label>
                                    <input type="number" step="0.01" value={budgetMin} onChange={e => setBudgetMin(e.target.value)} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Max Budget ($)</label>
                                    <input type="number" step="0.01" value={budgetMax} onChange={e => setBudgetMax(e.target.value)} className="w-full rounded-lg border bg-background px-4 py-2 text-sm" />
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
                            <Button type="submit" disabled={createNeedMutation.isPending}>
                                {createNeedMutation.isPending ? 'Creating...' : 'Create Need'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="space-y-4">
                {needs.length === 0 ? (
                    <div className="text-center p-8 bg-card border rounded-xl text-muted-foreground">
                        No needs have been created for this event yet.
                    </div>
                ) : (
                    needs.map((need: EventNeed) => (
                        <div key={need.id} className="bg-card rounded-xl border p-5 space-y-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-lg font-bold">{need.title}</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${need.status === 'open' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-secondary text-secondary-foreground'}`}>
                                            {need.status.toUpperCase()}
                                        </span>
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">{getCategoryLabel(need.category)}</span>
                                        <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs capitalize">{need.criticality.replace('_', '-')}</span>
                                        {(need.budget_min || need.budget_max) && (
                                            <span className="bg-muted text-muted-foreground px-2 py-0.5 rounded text-xs">
                                                Budget: ${need.budget_min || '0'} - ${need.budget_max || 'Any'}
                                            </span>
                                        )}
                                    </div>
                                    {need.description && <p className="text-sm text-muted-foreground mt-2">{need.description}</p>}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-sm font-medium text-muted-foreground text-center bg-muted/50 px-3 py-1.5 rounded-lg border">
                                        <span className="block text-xl text-foreground">{need.application_count}</span>
                                        <span>Applicants</span>
                                    </div>
                                    {need.status === 'open' && (
                                        <Button variant="outline" size="sm" asChild>
                                            <Link
                                                to={`/vendors?eventId=${eventId}&needId=${need.id}&category=${encodeURIComponent(
                                                    need.category
                                                )}&needTitle=${encodeURIComponent(need.title)}`}
                                            >
                                                Invite Vendors
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {/* Applications List */}
                            {need.applications && need.applications.length > 0 && (
                                <div className="border-t pt-4">
                                    <h4 className="text-sm font-semibold mb-3">Applications</h4>
                                    <div className="space-y-3">
                                        {need.applications.map((app: NeedApplication) => (
                                            <div key={app.id} className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-muted/30 p-3 rounded-lg border">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{app.vendor_name}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${app.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                            : app.status === 'accepted' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                                            }`}>
                                                            {app.status}
                                                        </span>
                                                    </div>
                                                    {app.proposed_price && <p className="text-xs text-muted-foreground mt-1">Proposed: ${app.proposed_price}</p>}
                                                    {app.message && <p className="text-sm text-muted-foreground mt-2 bg-background p-2 rounded-md border text-xs">{app.message}</p>}
                                                </div>

                                                {app.status === 'pending' && need.status === 'open' && (
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                            onClick={() => handleReview(app.id, 'rejected')}
                                                            disabled={reviewApplicationMutation.isPending}
                                                        >
                                                            <XCircle className="h-4 w-4 mr-1" /> Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-600 hover:bg-green-700 text-white"
                                                            onClick={() => handleReview(app.id, 'accepted')}
                                                            disabled={reviewApplicationMutation.isPending}
                                                        >
                                                            <CheckCircle className="h-4 w-4 mr-1" /> Accept
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
