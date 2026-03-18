import { CheckCircle2, Eye, EyeOff, Loader2, MessageSquare, UserRound } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

type PrivacySettings = {
  privacy_name: boolean;
  privacy_email: boolean;
  privacy_hosted_events: boolean;
  privacy_serviced_events: boolean;
  privacy_events_attending: boolean;
  privacy_events_attended: boolean;
  allow_private_messages: boolean;
};

const defaultSettings: PrivacySettings = {
  privacy_name: true,
  privacy_email: false,
  privacy_hosted_events: true,
  privacy_serviced_events: true,
  privacy_events_attending: true,
  privacy_events_attended: true,
  allow_private_messages: true,
};

type ToggleItem = {
  key: keyof PrivacySettings;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
};

const PROFILE_TOGGLES: ToggleItem[] = [
  {
    key: 'privacy_name',
    label: 'Show real name',
    hint: 'Others see your first and last name on your profile page',
    icon: UserRound,
  },
  {
    key: 'privacy_email',
    label: 'Show email address',
    hint: 'Lets organisers and connections contact you directly',
    icon: Eye,
  },
];

const ACTIVITY_TOGGLES: ToggleItem[] = [
  {
    key: 'privacy_hosted_events',
    label: 'Hosted events',
    hint: 'Shows events you created on your public profile',
    icon: Eye,
  },
  {
    key: 'privacy_serviced_events',
    label: 'Vendor activity',
    hint: 'Shows your service history to event planners',
    icon: Eye,
  },
  {
    key: 'privacy_events_attending',
    label: 'Upcoming attendance',
    hint: 'Lets others see which upcoming events you plan to attend',
    icon: Eye,
  },
  {
    key: 'privacy_events_attended',
    label: 'Past attendance',
    hint: 'Shares the events you have attended on your profile',
    icon: EyeOff,
  },
];

const INTERACTION_TOGGLES: ToggleItem[] = [
  {
    key: 'allow_private_messages',
    label: 'Direct messages',
    hint: 'Allows any user to start a private conversation with you',
    icon: MessageSquare,
  },
];

export function PrivacySettingsNewSection() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const hasSyncedFromDb = useRef(false);

  useEffect(() => {
    if (!user) {
      hasSyncedFromDb.current = false;
      return;
    }

    if (hasSyncedFromDb.current) return;
    hasSyncedFromDb.current = true;

    const fetchSettings = async () => {
      setLoading(true);
      try {
        const res = await client.get('/profiles/me/');
        const profile = res.data?.data;
        if (profile) {
          setSettings({
            privacy_name: profile.privacy_name ?? true,
            privacy_email: profile.privacy_email ?? false,
            privacy_hosted_events: profile.privacy_hosted_events ?? true,
            privacy_serviced_events: profile.privacy_serviced_events ?? true,
            privacy_events_attending: profile.privacy_events_attending ?? true,
            privacy_events_attended: profile.privacy_events_attended ?? true,
            allow_private_messages: profile.allow_private_messages ?? true,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load privacy settings');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      if (saving) return;

      setSaving(true);
      try {
        const res = await client.patch('/profiles/me/', settings);
        if (res.data?.success) {
          setLastSaved(new Date().toLocaleTimeString());
          setTimeout(() => setLastSaved(null), 3000);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to save privacy settings');
      } finally {
        setSaving(false);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [loading, settings, saving]);

  const onToggle = (key: keyof PrivacySettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="space-y-4">
      {/* ── Profile visibility ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Profile visibility
        </p>
        <div className="flex flex-col gap-2.5">
          {PROFILE_TOGGLES.map((item) => (
            <ToggleRow
              key={item.key}
              loading={loading}
              active={settings[item.key]}
              label={item.label}
              hint={item.hint}
              icon={item.icon}
              onToggle={() => onToggle(item.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Activity sharing ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Activity sharing
        </p>
        <div className="flex flex-col gap-2.5">
          {ACTIVITY_TOGGLES.map((item) => (
            <ToggleRow
              key={item.key}
              loading={loading}
              active={settings[item.key]}
              label={item.label}
              hint={item.hint}
              icon={item.icon}
              onToggle={() => onToggle(item.key)}
            />
          ))}
        </div>
      </div>

      {/* ── Interactions ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Interactions
        </p>
        <div className="flex flex-col gap-2.5">
          {INTERACTION_TOGGLES.map((item) => (
            <ToggleRow
              key={item.key}
              loading={loading}
              active={settings[item.key]}
              label={item.label}
              hint={item.hint}
              icon={item.icon}
              onToggle={() => onToggle(item.key)}
            />
          ))}
        </div>

        {/* Auto-save status */}
        <div className="mt-5 flex items-center justify-between border-t border-border/40 pt-4">
          <p className="text-[0.7rem] text-muted-foreground/60">
            {loading ? 'Loading preferences…' : 'Changes are saved automatically.'}
          </p>

          <div className="flex items-center gap-2">
            {saving && (
              <span className="flex items-center gap-1.5 text-[0.7rem] font-medium text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Syncing…
              </span>
            )}
            {lastSaved && !saving && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[0.7rem] font-medium text-emerald-700">
                <CheckCircle2 className="h-3 w-3" />
                Saved {lastSaved}
              </span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ToggleRow({
  active,
  label,
  hint,
  icon: Icon,
  onToggle,
  loading,
}: {
  active: boolean;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
  onToggle: () => void;
  loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/50 p-3.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
            active ? 'bg-[#E05C2A]/10 text-[#E05C2A]' : 'bg-muted text-muted-foreground',
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{hint}</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={loading}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 rounded-full border transition-colors',
          active ? 'border-[#E05C2A] bg-[#E05C2A]' : 'border-border bg-muted',
          loading && 'cursor-not-allowed opacity-60',
        )}
        aria-pressed={active}
        aria-label={`Toggle ${label}`}
      >
        <span
          className={cn(
            'absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white shadow-sm transition-all',
            active ? 'left-6' : 'left-1',
          )}
        />
      </button>
    </div>
  );
}
