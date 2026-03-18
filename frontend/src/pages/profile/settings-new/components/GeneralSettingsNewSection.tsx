import { ArrowUpRight, ChevronRight, LogOut, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAuth } from '@/features/auth/hooks';

const subscriptions = [
  {
    title: 'Current plan',
    value: 'Pro Plan',
    badge: 'Active',
    helper: 'Your next billing cycle starts in 12 days.',
  },
  {
    title: 'Billing profile',
    value: 'Visa •••• 4242',
    badge: null,
    helper: 'Automatic payments are enabled.',
  },
];

const accountActions = [
  {
    title: 'Change password',
    description: 'Refresh your password to keep your account secure.',
  },
  {
    title: 'Enable 2-step verification',
    description: 'Add an extra login layer with phone or authenticator app.',
  },
  {
    title: 'Connected sessions',
    description: 'Review active devices and revoke old sessions.',
  },
];

export function GeneralSettingsNewSection() {
  const { logout } = useAuth();

  return (
    <section className="space-y-4">
      {/* ── Subscription ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Subscription
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {subscriptions.map((item) => (
            <article
              key={item.title}
              className="flex flex-col justify-between rounded-xl border border-border/60 bg-background/60 p-4"
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
                  {item.title}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">{item.value}</p>
                  {item.badge && (
                    <span className="rounded-full bg-[#E05C2A]/10 px-2 py-0.5 text-[0.65rem] font-bold text-[#E05C2A]">
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                  {item.helper}
                </p>
              </div>
              <button
                onClick={() => toast.info('This action will be available soon.')}
                className="mt-4 inline-flex items-center justify-center gap-1 self-start rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted active:scale-[0.98]"
              >
                Manage
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </article>
          ))}
        </div>
      </div>

      {/* ── Security & Access ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Security &amp; Access
        </p>
        <div className="flex flex-col gap-2">
          {accountActions.map((action) => (
            <button
              key={action.title}
              onClick={() => toast.info('This action will be available soon.')}
              className="group flex items-start justify-between gap-4 rounded-xl border border-border/60 bg-background/60 p-4 text-left transition-all hover:border-border hover:bg-background active:scale-[0.99]"
            >
              <div>
                <p className="text-sm font-semibold text-foreground">{action.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {action.description}
                </p>
              </div>
              <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      </div>

      {/* ── Account actions — progressive disclosure, visually muted ── */}
      <div className="rounded-2xl border border-border/40 bg-muted/20 p-5">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Account actions
        </p>
        <p className="mb-4 text-xs text-muted-foreground/60">
          Irreversible. These cannot be undone — proceed carefully.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={logout}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/50 bg-background px-4 text-xs font-medium text-foreground/70 transition-all hover:border-border hover:text-foreground active:scale-[0.97]"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>

          {/* Delete: muted by default, red only on hover */}
          <button
            onClick={() => toast.error('Account deletion is not enabled yet.')}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-border/30 px-4 text-xs font-medium text-muted-foreground/40 transition-all hover:border-red-200 hover:bg-red-50/40 hover:text-red-600 active:scale-[0.97]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete account
          </button>
        </div>
      </div>
    </section>
  );
}
