import { Eye, EyeOff, Lock, Mail, MessageSquare, Shield, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import client from '@/api/client';
import { useAuth } from '@/features/auth/hooks';

export const PrivacySettingsSection = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const hasSyncedFromDb = useRef(false);

  const [settings, setSettings] = useState({
    privacy_name: true,
    privacy_email: false,
    privacy_hosted_events: true,
    privacy_serviced_events: true,
    privacy_events_attending: true,
    privacy_events_attended: true,
    allow_private_messages: true,
  });

  useEffect(() => {
    if (!user) hasSyncedFromDb.current = false;
  }, [user]);

  useEffect(() => {
    if (!user || hasSyncedFromDb.current) return;
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
        console.error('Failed to fetch privacy settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(() => {
      saveSettings();
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings, loading]);

  const saveSettings = async () => {
    if (saving) return;
    setSaving(true);

    try {
      const res = await client.patch('/profiles/me/', settings);
      if (res.data?.success) {
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setLastSaved(null), 3000);
      }
    } catch (err) {
      toast.error('Failed to save privacy settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const cardClass =
    'border-2 border-gray-800 bg-white p-6 shadow-[3px_4px_0px_#333] relative';
  const cardBg = {
    backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
    backgroundSize: '100% 32px',
  };

  const Toggle = ({ active, onToggle, label, icon: Icon, description }: any) => (
    <div className="flex items-center justify-between border-2 border-dashed border-gray-300 py-3 px-4 mb-4">
      <div className="flex items-center gap-4">
        <div
          className={`p-2 border-2 border-gray-800 ${active ? 'bg-green-100' : 'bg-gray-100'} shadow-[1px_1px_0px_#333]`}
        >
          <Icon size={18} className={active ? 'text-green-600' : 'text-gray-400'} />
        </div>
        <div>
          <p
            className="font-bold text-gray-800"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            {label}
          </p>
          <p
            className="text-gray-500 text-sm"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
          >
            {description}
          </p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-gray-800 transition-colors duration-200 ease-in-out focus:outline-none ${
          active ? 'bg-green-400' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white border-2 border-gray-800 shadow-[1px_1px_0px_#333] transition duration-200 ease-in-out ${
            active ? 'translate-x-5' : 'translate-x-0'
          }`}
          style={{ marginTop: '1px', marginLeft: '1px' }}
        />
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="max-w-2xl space-y-6">
        <header>
          <h2
            className="text-2xl text-gray-900"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Privacy Settings
          </h2>
          <p
            className="mt-1 text-gray-500"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
          >
            loading your secrets... 🤫
          </p>
        </header>
        <div
          className={`${cardClass} flex items-center justify-center min-h-[200px]`}
          style={cardBg}
        >
          <span
            className="text-gray-400 animate-pulse"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
          >
            Fetching settings...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-8 pb-12">
      <header className="relative">
        <div
          className="absolute -top-2 left-0 w-24 h-5 pointer-events-none"
          style={{
            background: 'rgba(252, 165, 165, 0.5)',
            transform: 'rotate(-4deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        <h2
          className="text-2xl text-gray-900"
          style={{
            fontFamily: '"Permanent Marker", cursive',
            transform: 'rotate(-1deg)',
          }}
        >
          Privacy Settings
        </h2>
        <p
          className="mt-1 text-gray-500"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
        >
          decide who gets to see what 🕵️‍♂️
        </p>
      </header>

      {/* Visibility Section */}
      <div className={cardClass} style={cardBg}>
        <div
          className="absolute -top-2 left-[30%] w-24 h-5 pointer-events-none"
          style={{
            background: 'rgba(147, 197, 253, 0.5)',
            transform: 'rotate(2deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        <h3
          className="mb-6 flex items-center gap-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
        >
          <Eye className="text-blue-500" /> Public Visibility
        </h3>

        <Toggle
          active={settings.privacy_name}
          onToggle={() => handleToggle('privacy_name')}
          label="Show Real Name"
          description="Let others see your first and last name on your profile."
          icon={User}
        />

        <Toggle
          active={settings.privacy_email}
          onToggle={() => handleToggle('privacy_email')}
          label="Show Email Address"
          description="Display your email on your public showcase page."
          icon={Mail}
        />
      </div>

      {/* Activity Section */}
      <div className={cardClass} style={cardBg}>
        <h3
          className="mb-6 flex items-center gap-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
        >
          <Shield className="text-purple-500" /> Activity History
        </h3>

        <Toggle
          active={settings.privacy_hosted_events}
          onToggle={() => handleToggle('privacy_hosted_events')}
          label="Show Hosted Events"
          description="List events you've organized on your profile."
          icon={Lock}
        />

        <Toggle
          active={settings.privacy_serviced_events}
          onToggle={() => handleToggle('privacy_serviced_events')}
          label="Show Serviced Events"
          description="List events where you provided services as a vendor."
          icon={Lock}
        />

        <Toggle
          active={settings.privacy_events_attending}
          onToggle={() => handleToggle('privacy_events_attending')}
          label="Show Upcoming Events"
          description="Show events you are currently attending in the 'attending' list."
          icon={Eye}
        />

        <Toggle
          active={settings.privacy_events_attended}
          onToggle={() => handleToggle('privacy_events_attended')}
          label="Show Attended Events"
          description="Show events you've attended in the past on your profile."
          icon={EyeOff}
        />
      </div>

      {/* Interaction Section */}
      <div className={cardClass} style={cardBg}>
        <h3
          className="mb-6 flex items-center gap-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
        >
          <MessageSquare className="text-green-500" /> Interactions
        </h3>

        <Toggle
          active={settings.allow_private_messages}
          onToggle={() => handleToggle('allow_private_messages')}
          label="Allow Private Messages"
          description="Let other users send you messages in your inbox."
          icon={MessageSquare}
        />
      </div>

      <div className="flex h-6 items-center justify-end gap-2 px-2">
        {saving && (
          <span
            className="text-gray-500 animate-pulse"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
          >
            Saving settings...
          </span>
        )}
        {lastSaved && !saving && (
          <span
            className="text-green-600 flex items-center gap-1"
            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
          >
            <Shield size={14} /> Settings synced at {lastSaved} ✓
          </span>
        )}
      </div>
    </div>
  );
};
