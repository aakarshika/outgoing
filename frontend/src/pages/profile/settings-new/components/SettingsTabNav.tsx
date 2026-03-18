import { ChevronRight, LockKeyhole, SlidersHorizontal, UserRound } from 'lucide-react';

import { cn } from '@/lib/utils';

export type SettingsNewTab = 'account-info' | 'general' | 'privacy';

type TabItem = {
  id: SettingsNewTab;
  label: string;
  description: string;
};

const TAB_ICON: Record<SettingsNewTab, React.ComponentType<{ className?: string }>> = {
  'account-info': UserRound,
  general: SlidersHorizontal,
  privacy: LockKeyhole,
};

interface SettingsTabNavProps {
  items: TabItem[];
  onChange: (tab: SettingsNewTab) => void;
  activeTab?: SettingsNewTab | null;
}

export function SettingsTabNav({ items, onChange, activeTab }: SettingsTabNavProps) {
  return (
    <nav>
      {/* Desktop: section label above the nav */}
      <p className="mb-2 hidden px-1 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480] md:block">
        Menu
      </p>

      <div className="flex flex-col gap-2.5 md:gap-0.5">
        {items.map((item) => {
          const Icon = TAB_ICON[item.id];
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onChange(item.id)}
              className={cn(
                // Mobile base: card style
                'group flex w-full items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/50 p-4 text-left transition-all duration-200',
                'hover:border-border hover:bg-card hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/20 active:scale-[0.98]',
                isActive && 'border-[#E05C2A]/30 bg-[#E05C2A]/5',

                // Desktop overrides: sidebar style
                'md:rounded-lg md:border-0 md:border-l-2 md:border-transparent md:bg-transparent md:px-3 md:py-2.5 md:hover:bg-muted/60 md:hover:shadow-none md:active:scale-100',
                isActive && 'md:border-[#E05C2A] md:bg-[#E05C2A]/5 md:hover:bg-[#E05C2A]/5',
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'inline-flex items-center justify-center rounded-xl bg-muted text-muted-foreground transition-colors',
                    'h-10 w-10 md:h-7 md:w-7 md:rounded-lg',
                    isActive && 'md:bg-[#E05C2A]/10 md:text-[#E05C2A]',
                  )}
                >
                  <Icon className="h-4 w-4 md:h-3.5 md:w-3.5" />
                </span>

                <div>
                  <span
                    className={cn(
                      'block text-[0.95rem] font-semibold leading-none text-foreground md:text-sm',
                      isActive && 'md:text-foreground',
                    )}
                  >
                    {item.label}
                  </span>
                  {/* Description: mobile only */}
                  <p className="mt-1.5 text-[0.82rem] leading-snug text-muted-foreground md:hidden">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Chevron: mobile only */}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 md:hidden" />
            </button>
          );
        })}
      </div>
    </nav>
  );
}
