import { Camera, CheckCircle2, Loader2, PencilLine, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import client from '@/api/client';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuth } from '@/features/auth/hooks';
import { cn } from '@/lib/utils';

type ProfileFormData = {
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
};

export function AccountInfoNewSection() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<ProfileFormData>({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
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

    const syncFromDb = async () => {
      setLoading(true);
      const baseData: ProfileFormData = {
        username: user.username ?? '',
        email: user.email ?? '',
        first_name: user.first_name ?? '',
        last_name: user.last_name ?? '',
        phone: user.phone_number ?? '',
      };

      try {
        const res = await client.get<{
          success: boolean;
          data: { phone_number?: string; avatar?: string };
        }>('/profiles/me/');

        const profile = res.data?.data;
        setFormData({
          ...baseData,
          phone: profile?.phone_number ?? baseData.phone,
        });
        setAvatar(profile?.avatar ?? null);
      } catch {
        setFormData(baseData);
      } finally {
        setLoading(false);
      }
    };

    syncFromDb();
  }, [user]);

  const onSave = async () => {
    if (saving) return;

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('phone_number', formData.phone);
      if (pendingAvatarFile) {
        payload.append('avatar', pendingAvatarFile);
      }

      const res = await client.patch('/profiles/me/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.success) {
        setPendingAvatarFile(null);
        if (res.data.data?.avatar) {
          setAvatar(res.data.data.avatar);
        }
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setLastSaved(null), 4000);
        toast.success('Account info updated');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update account info');
    } finally {
      setSaving(false);
    }
  };

  const hasNoPhoto = !avatar && !pendingAvatarFile;

  return (
    <section className="space-y-4">
      {/* ── Profile photo ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Profile photo
        </p>
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ImageUpload
            onImageSelected={setPendingAvatarFile}
            currentImage={avatar}
            compressionOptions={{ maxWidth: 800, maxHeight: 800, quality: 0.8 }}
          >
            {({ previewUrl, openSelector, removeImage, isCompressing }) => (
              <div className="relative">
                <button
                  onClick={openSelector}
                  className="group relative rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E05C2A]/30"
                  aria-label="Change profile photo"
                >
                  <UserAvatar src={previewUrl} username={formData.username} size="xl" />
                  <span className="absolute -bottom-1 -right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors group-hover:bg-muted">
                    {isCompressing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </span>
                </button>
                {previewUrl && (
                  <button
                    onClick={removeImage}
                    className="absolute -right-2 -top-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background shadow"
                    aria-label="Remove selected image"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            )}
          </ImageUpload>

          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-foreground">
              {hasNoPhoto ? 'No photo yet' : 'Your profile photo'}
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Tap your avatar to upload. PNG or JPG, up to 10 MB.
              {hasNoPhoto && (
                <>
                  <br />
                  A photo helps people recognise you at events.
                </>
              )}
            </p>
            {pendingAvatarFile && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[0.7rem] font-medium text-emerald-700">
                <PencilLine className="h-3 w-3" />
                New photo ready — save to apply
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Identity — read-only ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
              Identity
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Managed by your auth provider — contact support to update.
            </p>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-muted-foreground/60">
            Read-only
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <ReadOnlyField
            label="Username"
            hint="your @handle on Outgoing"
            value={formData.username}
            loading={loading}
          />
          <ReadOnlyField
            label="Email"
            hint="used for login and notifications"
            value={formData.email}
            loading={loading}
          />
          <ReadOnlyField
            label="First name"
            hint="shown on your public profile"
            value={formData.first_name}
            loading={loading}
          />
          <ReadOnlyField
            label="Last name"
            hint="shown on your public profile"
            value={formData.last_name}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Contact — editable ── */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.5px] text-[#8A8480]">
          Contact
        </p>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-foreground">
            Phone number{' '}
            <span className="font-normal text-muted-foreground">
              — for account recovery and 2-step verification
            </span>
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 (555) 000-0000"
            disabled={loading}
            className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-[#E05C2A]/50 focus:ring-4 focus:ring-[#E05C2A]/8 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-xs"
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border/40 pt-5">
          {/* Inline success badge */}
          {lastSaved && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] font-medium text-emerald-700">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Saved at {lastSaved}
            </span>
          )}

          {saving && (
            <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving…
            </span>
          )}

          <button
            onClick={onSave}
            disabled={saving || loading}
            className="ml-auto inline-flex h-10 items-center justify-center rounded-xl bg-[#E05C2A] px-6 text-sm font-semibold text-white transition-all hover:bg-[#C94E22] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Save changes
          </button>
        </div>
      </div>
    </section>
  );
}

function ReadOnlyField({
  label,
  hint,
  value,
  loading,
}: {
  label: string;
  hint: string;
  value: string;
  loading: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-foreground">
        {label} <span className="font-normal text-muted-foreground">— {hint}</span>
      </label>
      <div
        className={cn(
          'flex h-10 items-center rounded-xl border border-border/50 bg-muted/30 px-3.5 text-sm text-muted-foreground',
          loading && 'animate-pulse',
        )}
      >
        {!loading && (value || <span className="italic opacity-40">Not set</span>)}
      </div>
    </div>
  );
}
