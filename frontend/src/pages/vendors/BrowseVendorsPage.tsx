/** Browse Vendors page — grid of vendor services. */

import { MapPin, Search } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks';
import { useInviteVendorToNeed } from '@/features/needs/hooks';
import { useVendorServices } from '@/features/vendors/hooks';
import type { VendorService } from '@/types/vendors';

export default function BrowseVendorsPage() {
    const { isAuthenticated } = useAuth();
    const [search, setSearch] = useState('');
    const [invitingVendorId, setInvitingVendorId] = useState<number | null>(null);
    const [invitedVendorIds, setInvitedVendorIds] = useState<Set<number>>(new Set());
    const [searchParams] = useSearchParams();
    const inviteNeedId = Number(searchParams.get('needId') || 0);
    const inviteEventId = Number(searchParams.get('eventId') || 0);
    const inviteCategory = searchParams.get('category') || '';
    const inviteNeedTitle = searchParams.get('needTitle') || '';
    const inviteFlowEnabled = isAuthenticated && inviteNeedId > 0 && inviteEventId > 0;
    const inviteVendorMutation = useInviteVendorToNeed();

    const { data: response, isLoading } = useVendorServices({
        category: inviteCategory || undefined,
        page_size: 100,
    });

    const services: VendorService[] = response?.data || [];
    const filtered = search
        ? services.filter(
            (s) =>
                s.title.toLowerCase().includes(search.toLowerCase()) ||
                s.category.toLowerCase().includes(search.toLowerCase())
        )
        : services;

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h1 className="text-2xl font-bold text-foreground">Browse Vendors</h1>
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search services..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full rounded-lg border bg-background pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                </div>
            </div>
            {inviteFlowEnabled && (
                <div className="mb-6 rounded-xl border bg-primary/5 px-4 py-3 text-sm">
                    <span className="font-medium">Invite mode:</span>{' '}
                    Sending invites for <span className="font-medium">{inviteNeedTitle || 'selected need'}</span>.
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-pulse">
                            <div className="aspect-[4/3] bg-muted" />
                            <div className="p-4 space-y-3">
                                <div className="h-5 w-3/4 rounded bg-muted" />
                                <div className="h-3 w-1/2 rounded bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="text-5xl mb-4">🔧</div>
                    <h3 className="text-lg font-semibold">No vendor services yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                        Vendors will appear here once they list their services.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filtered.map((service) => (
                        <div
                            key={service.id}
                            className="group rounded-xl border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                        >
                            {/* Portfolio image */}
                            <div className="aspect-[4/3] overflow-hidden bg-muted">
                                {service.portfolio_image ? (
                                    <img
                                        src={service.portfolio_image}
                                        alt={service.title}
                                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                        <span className="text-4xl">🎯</span>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 space-y-2">
                                <span className="inline-block rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                                    {service.category}
                                </span>
                                <h3 className="font-semibold text-foreground line-clamp-1">{service.title}</h3>
                                <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>

                                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                    <div className="flex items-center gap-1.5">
                                        {service.vendor_avatar ? (
                                            <img
                                                src={service.vendor_avatar}
                                                alt=""
                                                className="h-5 w-5 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                {service.vendor_name[0].toUpperCase()}
                                            </div>
                                        )}
                                        <span className="text-xs text-muted-foreground">{service.vendor_name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        {service.location_city && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {service.location_city}
                                            </span>
                                        )}
                                        {service.base_price && (
                                            <span className="font-medium text-foreground">
                                                From ${parseFloat(service.base_price).toFixed(0)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-2">
                                    <Button variant="outline" size="sm" asChild className="flex-1">
                                        <Link to={`/vendors/portfolio/${service.vendor_id}`}>View Portfolio</Link>
                                    </Button>
                                    {inviteFlowEnabled && (
                                        <Button
                                            size="sm"
                                            className="flex-1"
                                            onClick={async () => {
                                                try {
                                                    setInvitingVendorId(service.vendor_id);
                                                    await inviteVendorMutation.mutateAsync({
                                                        needId: inviteNeedId,
                                                        payload: { vendor_id: service.vendor_id },
                                                    });
                                                    setInvitedVendorIds((prev) => new Set(prev).add(service.vendor_id));
                                                    toast.success('Vendor invited');
                                                } catch (err: any) {
                                                    toast.error(
                                                        err?.response?.data?.message || 'Failed to invite vendor'
                                                    );
                                                } finally {
                                                    setInvitingVendorId(null);
                                                }
                                            }}
                                            disabled={
                                                inviteVendorMutation.isPending ||
                                                invitedVendorIds.has(service.vendor_id)
                                            }
                                        >
                                            {invitedVendorIds.has(service.vendor_id)
                                                ? 'Invited'
                                                : invitingVendorId === service.vendor_id
                                                  ? 'Inviting...'
                                                  : 'Invite to Apply'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
