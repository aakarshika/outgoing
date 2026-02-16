import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { Check } from 'lucide-react';
import client from '@/api/client';

export const UserInfoSection = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        phone: '',
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);
    const hasSyncedFromDb = useRef(false);
    const initialFormDataRef = useRef<typeof formData | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Reset sync when user logs out
    useEffect(() => {
        if (!user) hasSyncedFromDb.current = false;
    }, [user]);

    // Fetch logged-in user from auth context (already loaded) and profile (phone) from API
    useEffect(() => {
        if (!user || hasSyncedFromDb.current) return;
        hasSyncedFromDb.current = true;

        const syncFromDb = async () => {
            setLoading(true);
            const base = {
                username: user.username ?? '',
                email: user.email ?? '',
                first_name: user.first_name ?? '',
                last_name: user.last_name ?? '',
                phone: user.phone_number ?? '',
            };
            try {
                const res = await client.get<{ success: boolean; data: { phone_number?: string } }>('/profiles/me/');
                const profile = res.data?.data;
                const data = {
                    ...base,
                    phone: profile?.phone_number ?? base.phone,
                };
                initialFormDataRef.current = data;
                setFormData(data);
            } catch {
                initialFormDataRef.current = base;
                setFormData(base);
            } finally {
                setLoading(false);
            }
        };
        syncFromDb();
    }, [user]);

    useEffect(() => {
        if (loading || !initialFormDataRef.current) return;
        const timer = setTimeout(() => {
            if (JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current)) {
                handleSave();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [formData, loading]);

    const handleSave = async () => {
        setSaving(true);
        // Mock API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setSaving(false);
        setLastSaved(new Date().toLocaleTimeString());
        setTimeout(() => setLastSaved(null), 3000);
    };

    const inputClass =
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

    if (loading && !formData.username) {
        return (
            <div className="max-w-2xl space-y-6">
                <header>
                    <h2 className="text-xl font-semibold">User Information</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Update your personal details and how others see you.</p>
                </header>
                <div className="rounded-lg border border-border bg-card p-6 shadow-sm flex items-center justify-center min-h-[200px]">
                    <span className="text-sm text-muted-foreground">Loading your information…</span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <header>
                <h2 className="text-xl font-semibold">User Information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Update your personal details and how others see you.</p>
            </header>

            <div className="rounded-lg border border-border bg-card p-6 shadow-sm">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Username</label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="johndoe"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">First Name</label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="John"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Last Name</label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Doe"
                        />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="+1 (555) 000-0000"
                        />
                    </div>
                </div>

                <div className="mt-6 flex h-6 items-center justify-end gap-2">
                    {saving && <span className="text-xs text-muted-foreground animate-pulse">Saving changes...</span>}
                    {lastSaved && !saving && (
                        <span className="text-xs text-primary flex items-center gap-1">
                            <Check size={12} /> Saved at {lastSaved}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
