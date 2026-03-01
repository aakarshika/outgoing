/** Alerts page — actionable reminders derived from DB state. */

import { Bell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAlerts } from '@/features/alerts/hooks';

const PRIORITY_STYLES: Record<string, string> = {
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
};

export default function AlertsPage() {
    const { data: response, isLoading } = useAlerts();
    const alerts = response?.data || [];

    return (
        <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8">
            <div className="mb-6 flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                    <Bell className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold">Alerts</h1>
                    <p className="text-sm text-muted-foreground">
                        Cute, actionable reminders from live DB state.
                    </p>
                </div>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 rounded-xl border bg-card animate-pulse" />
                    ))}
                </div>
            ) : alerts.length === 0 ? (
                <div className="rounded-xl border bg-card p-10 text-center">
                    <Sparkles className="h-10 w-10 mx-auto text-primary/60 mb-3" />
                    <h2 className="text-lg font-semibold">All caught up</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        No actions pending right now.
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {alerts.map((alert) => (
                        <div key={alert.id} className="rounded-xl border bg-card p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="font-semibold">{alert.title}</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {alert.message}
                                    </p>
                                </div>
                                <span
                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                                        PRIORITY_STYLES[alert.priority] || PRIORITY_STYLES.low
                                    }`}
                                >
                                    {alert.priority}
                                </span>
                            </div>
                            <div className="mt-4">
                                <Button asChild size="sm">
                                    <Link to={alert.cta_route}>{alert.cta_label}</Link>
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
