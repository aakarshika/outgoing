import { ArrowLeft } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { AccountInfoNewSection } from './components/AccountInfoNewSection';
import { GeneralSettingsNewSection } from './components/GeneralSettingsNewSection';
import { PrivacySettingsNewSection } from './components/PrivacySettingsNewSection';
import { SettingsNewTab, SettingsTabNav } from './components/SettingsTabNav';

const sectionItems: Array<{
  id: SettingsNewTab;
  label: string;
  description: string;
}> = [
  {
    id: 'account-info',
    label: 'Account Info',
    description: 'Photo, contact info and profile basics',
  },
  {
    id: 'general',
    label: 'General',
    description: 'Subscription, billing and account controls',
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Visibility, activity and message permissions',
  },
];

const sectionSet = new Set<SettingsNewTab>(['account-info', 'general', 'privacy']);

function isSettingsTab(value: string | null): value is SettingsNewTab {
  if (!value) return false;
  return sectionSet.has(value as SettingsNewTab);
}

function SectionContent({ activeTab }: { activeTab: SettingsNewTab }) {
  if (activeTab === 'account-info') return <AccountInfoNewSection />;
  if (activeTab === 'general') return <GeneralSettingsNewSection />;
  if (activeTab === 'privacy') return <PrivacySettingsNewSection />;
  return null;
}

export default function SettingsNewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const activeTab = useMemo<SettingsNewTab | null>(() => {
    const section = searchParams.get('section');
    return isSettingsTab(section) ? section : null;
  }, [searchParams]);

  const handleTabChange = (tab: SettingsNewTab) => {
    navigate(`/profile/settings-new?section=${tab}`);
  };

  const handleBack = () => {
    navigate('/profile/settings-new');
  };

  return (
    <div className="relative min-h-screen overflow-hidden px-3 pb-24 pt-4 sm:px-6 sm:pt-8">
      <div
        className="pointer-events-none absolute pt-8 -left-20 -top-32 h-96 w-96 rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, rgba(224,92,42,0.06) 0%, rgba(224,92,42,0) 70%)',
        }}
      />

      <div className="relative mx-auto w-full max-w-4xl">
        <header className="mb-8 pt-12">
          <div className="flex items-center gap-3">
            {activeTab && (
              <button
                onClick={handleBack}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-background transition-colors hover:bg-muted md:hidden"
                aria-label="Back to settings list"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            )}
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
                Your account
              </p>
              <h1 className="mt-0.5 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {activeTab ? sectionItems.find((i) => i.id === activeTab)?.label : 'Settings'}
              </h1>
            </div>
          </div>
        </header>

        {/* Mobile: drill-down (nav list OR section content) */}
        <div className="md:hidden">
          {!activeTab ? (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <SettingsTabNav
                items={sectionItems}
                onChange={handleTabChange}
                activeTab={activeTab}
              />
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <SectionContent activeTab={activeTab} />
            </div>
          )}
        </div>

        {/* Desktop: persistent two-column layout */}
        <div className="hidden md:grid md:grid-cols-[200px_1fr] md:gap-10">
          <aside className="sticky top-6 self-start">
            <SettingsTabNav
              items={sectionItems}
              onChange={handleTabChange}
              activeTab={activeTab ?? 'account-info'}
            />
          </aside>
          <main className="min-w-0">
            <div className="animate-in fade-in duration-200">
              <SectionContent activeTab={activeTab ?? 'account-info'} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
