import {
    BellRing,
    Calendar,
    DollarSign,
    MapPin,
    Search,
    Send,
    Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { ApplyToNeedModal } from '@/components/events/ApplyToNeedModal';
import { Button } from '@/components/ui/button';
import { useMyVendorOpportunities } from '@/features/needs/hooks';
import { useMyServices } from '@/features/vendors/hooks';
import { getCategoryLabel } from '@/constants/categories';
import type { VendorOpportunity } from '@/types/needs';

const CRITICALITY_STYLES: Record<string, string> = {
    essential: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    non_substitutable: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
    replaceable: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
};

const CRITICALITY_LABELS: Record<string, string> = {
    essential: 'Essential',
    non_substitutable: 'Non-Substitutable',
    replaceable: 'Replaceable',
};

function formatBudget(min: string | null, max: string | null) {
    if (!min && !max) return 'Budget not specified';
    const left = min ? `$${Number(min).toLocaleString()}` : '$0';
    const right = max ? `$${Number(max).toLocaleString()}` : 'Flexible';
    return `${left} - ${right}`;
}

function formatStartsIn(start: string) {
    const ms = new Date(start).getTime() - Date.now();
    const hours = Math.ceil(ms / (1000 * 60 * 60));
    if (hours <= 0) return 'Starting soon';
    if (hours < 24) return `Starts in ${hours}h`;
    const days = Math.ceil(hours / 24);
    return `Starts in ${days} day${days === 1 ? '' : 's'}`;
}

export default function VendorOpportunitiesPage() {
    const { data: opportunitiesResponse, isLoading } = useMyVendorOpportunities();
    const { data: myServicesResponse, isLoading: isLoadingServices } = useMyServices();
    const opportunities = opportunitiesResponse?.data || [];
    const myServices = myServicesResponse?.data || [];
    const [selectedNeed, setSelectedNeed] = useState<VendorOpportunity | null>(null);
    const [query, setQuery] = useState('');
    const filtered = query
        ? opportunities.filter((opportunity) => {
            const normalized = query.toLowerCase();
            return (
                opportunity.need_title.toLowerCase().includes(normalized) ||
                opportunity.event_title.toLowerCase().includes(normalized) ||
                opportunity.category.toLowerCase().includes(normalized) ||
                opportunity.event_location_name.toLowerCase().includes(normalized)
            );
        })
        : opportunities;
    const serviceCategories = Array.from(
        new Set(myServices.map((service) => getCategoryLabel(service.category)))
    );
    const invitedCount = filtered.filter((opportunity) => opportunity.is_invited).length;

    return (
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
            <section className="mb-6 overflow-hidden rounded-2xl border bg-gradient-to-r from-primary/10 via-background to-emerald-100/40 dark:to-emerald-900/10">
                <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                                Vendor Match Feed
                            </p>
                            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Opportunities for You</h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Curated event needs based on your active service categories.
                            </p>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/vendors/create">+ Create New Service</Link>
                        </Button>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium">
                            {filtered.length} open matches
                        </span>
                        <span className="rounded-full border bg-background/80 px-3 py-1 text-xs font-medium">
                            {invitedCount} host invites
                        </span>
                        {serviceCategories.slice(0, 4).map((category) => (
                            <span
                                key={category}
                                className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                            >
                                {category}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            <section className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by need, event, location..."
                        className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm"
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    Apply early to improve selection chances.
                </p>
            </section>

            {!isLoadingServices && myServices.length === 0 && (
                <div className="mb-4 rounded-xl border bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                    Add at least one vendor service category to see matching opportunities.
                </div>
            )}

            {isLoading ? (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-60 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center">
                    <BellRing className="h-10 w-10 mx-auto text-primary/60 mb-3" />
                    <h2 className="text-lg font-semibold">No matching opportunities right now</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Check back soon or expand your service categories.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    {filtered.map((opportunity) => (
                        <article
                            key={opportunity.need_id}
                            className={`group rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md ${opportunity.is_invited ? 'ring-1 ring-emerald-300/60 dark:ring-emerald-700/60' : ''
                                }`}
                        >
                            <div className="flex flex-col justify-between gap-4">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h2 className="font-semibold text-base">{opportunity.need_title}</h2>
                                        <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium">
                                            {getCategoryLabel(opportunity.category)}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${CRITICALITY_STYLES[opportunity.criticality] ||
                                                CRITICALITY_STYLES.replaceable
                                                }`}
                                        >
                                            {CRITICALITY_LABELS[opportunity.criticality] || 'Replaceable'}
                                        </span>
                                        {opportunity.is_invited && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-xs font-medium dark:bg-green-900/30 dark:text-green-300">
                                                <Sparkles className="h-3 w-3" />
                                                Invited by Host
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-1 text-sm font-medium text-foreground">
                                        For event:{' '}
                                        <Link
                                            to={`/events/${opportunity.event_id}`}
                                            className="text-primary hover:underline"
                                        >
                                            {opportunity.event_title}
                                        </Link>
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-2 line-clamp-3">
                                        {opportunity.need_description || 'No additional brief provided.'}
                                    </p>
                                </div>

                                <div className="rounded-lg border bg-muted/30 p-3 text-xs">
                                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(opportunity.event_start_time).toLocaleString()}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {opportunity.event_location_name}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                                            <DollarSign className="h-3 w-3" />
                                            {formatBudget(opportunity.budget_min, opportunity.budget_max)}
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {formatStartsIn(opportunity.event_start_time)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" asChild className="flex-1 sm:flex-none">
                                        <Link to={`/events/${opportunity.event_id}`}>View Event</Link>
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setSelectedNeed(opportunity)}
                                        className="gap-1.5 flex-1 sm:flex-none"
                                    >
                                        <Send className="h-3.5 w-3.5" />
                                        Apply Now
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {selectedNeed && (
                <ApplyToNeedModal
                    isOpen={!!selectedNeed}
                    onClose={() => setSelectedNeed(null)}
                    needId={selectedNeed.need_id}
                    needTitle={selectedNeed.need_title}
                />
            )}
        </div>
    );
}
