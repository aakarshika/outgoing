import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/features/auth/hooks';
import { Check, Camera, X } from 'lucide-react';
import client from '@/api/client';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';

export const UserInfoSection = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
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
    const initialFormDataRef = useRef<typeof formData | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!user) hasSyncedFromDb.current = false;
    }, [user]);

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
                const res = await client.get<{ success: boolean; data: { phone_number?: string; avatar?: string } }>('/profiles/me/');
                const profile = res.data?.data;
                const data = {
                    ...base,
                    phone: profile?.phone_number ?? base.phone,
                };
                setAvatar(profile?.avatar ?? null);
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

        const hasFormChanged = JSON.stringify(formData) !== JSON.stringify(initialFormDataRef.current);
        if (hasFormChanged || pendingAvatarFile) {
            const timer = setTimeout(() => {
                handleSave();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [formData, pendingAvatarFile, loading]);

    const handleSave = async () => {
        if (saving) return;
        setSaving(true);

        try {
            const data = new FormData();
            data.append('phone_number', formData.phone);

            if (pendingAvatarFile) {
                data.append('avatar', pendingAvatarFile);
            }

            const res = await client.patch('/profiles/me/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data?.success) {
                setLastSaved(new Date().toLocaleTimeString());
                initialFormDataRef.current = { ...formData };
                setPendingAvatarFile(null);
                if (res.data.data?.avatar) {
                    setAvatar(res.data.data.avatar);
                }
                setTimeout(() => setLastSaved(null), 3000);
            }
        } catch (err) {
            toast.error('Failed to save profile changes');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'w-full border-2 border-gray-800 bg-white px-4 py-2.5 outline-none shadow-[2px_3px_0px_#333] transition-all focus:translate-x-[1px] focus:translate-y-[1px] focus:shadow-[1px_1px_0px_#333] focus:ring-0 placeholder:text-gray-400';

    if (loading && !formData.username) {
        return (
            <div className="max-w-2xl space-y-6">
                <header>
                    <h2
                        className="text-2xl text-gray-900"
                        style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                    >
                        User Information
                    </h2>
                    <p
                        className="mt-1 text-gray-500"
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                    >
                        update your personal deets ✏️
                    </p>
                </header>
                <div
                    className="border-2 border-gray-800 bg-white p-6 shadow-[3px_4px_0px_#333] flex items-center justify-center min-h-[200px]"
                    style={{
                        backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
                        backgroundSize: '100% 32px',
                    }}
                >
                    <span
                        className="text-gray-400 animate-pulse"
                        style={{ fontFamily: '"Caveat", cursive', fontSize: '1.2rem' }}
                    >
                        Loading your information…
                    </span>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6">
            <header className="relative">
                {/* Washi tape on header */}
                <div
                    className="absolute -top-2 left-0 w-24 h-5 pointer-events-none"
                    style={{
                        background: 'rgba(96, 165, 250, 0.4)',
                        transform: 'rotate(-3deg)',
                        border: '1px solid rgba(0,0,0,0.05)',
                    }}
                />
                <h2
                    className="text-2xl text-gray-900"
                    style={{ fontFamily: '"Permanent Marker", cursive', transform: 'rotate(-1deg)' }}
                >
                    User Information
                </h2>
                <p
                    className="mt-1 text-gray-500"
                    style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                >
                    update your personal deets ✏️
                </p>
            </header>

            <div
                className="border-2 border-gray-800 bg-white p-6 shadow-[3px_4px_0px_#333] relative"
                style={{
                    backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
                    backgroundSize: '100% 32px',
                }}
            >
                <div className="mb-8 flex flex-col items-center sm:flex-row sm:gap-6">
                    <ImageUpload
                        onImageSelected={setPendingAvatarFile}
                        currentImage={avatar}
                        compressionOptions={{ maxWidth: 800, maxHeight: 800, quality: 0.8 }}
                    >
                        {({ previewUrl, openSelector, removeImage }) => (
                            <div className="group relative">
                                <div className="border-4 border-white shadow-[3px_3px_0px_#333] transform -rotate-2">
                                    <UserAvatar
                                        src={previewUrl}
                                        username={formData.username}
                                        size="xl"
                                        borderGradient
                                    />
                                </div>
                                <button
                                    onClick={openSelector}
                                    className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                                >
                                    <Camera className="text-white h-6 w-6" />
                                </button>
                                {previewUrl && (
                                    <button
                                        onClick={removeImage}
                                        className="absolute -top-1 -right-1 rounded-full bg-red-500 p-1 text-white shadow-sm hover:scale-110 transition-transform"
                                        title="Remove photo"
                                    >
                                        <X size={14} />
                                    </button>
                                )}
                            </div>
                        )}
                    </ImageUpload>
                    <div className="mt-4 text-center sm:mt-0 sm:text-left">
                        <h3
                            className="text-lg text-gray-800"
                            style={{ fontFamily: '"Permanent Marker", cursive' }}
                        >
                            Profile Picture
                        </h3>
                        <p
                            className="text-gray-500 mb-3"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
                        >
                            Click the image to upload a new one. PNG or JPG, max 2MB.
                        </p>
                        <button
                            onClick={() => (document.querySelector('.group button') as HTMLButtonElement)?.click()}
                            className="font-bold text-blue-500 underline decoration-dashed underline-offset-4 hover:text-blue-600 transition-colors"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        >
                            Change photo
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <div className="space-y-1.5">
                        <label
                            className="block font-bold text-gray-700"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            Username
                        </label>
                        <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="johndoe"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            className="block font-bold text-gray-700"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            Email Address
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="john@example.com"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            className="block font-bold text-gray-700"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            First Name
                        </label>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="John"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label
                            className="block font-bold text-gray-700"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            Last Name
                        </label>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="Doe"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        />
                    </div>
                    <div className="space-y-1.5 sm:col-span-2">
                        <label
                            className="block font-bold text-gray-700"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
                        >
                            Phone Number
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className={inputClass}
                            placeholder="+1 (555) 000-0000"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                        />
                    </div>
                </div>

                <div className="mt-6 flex h-6 items-center justify-end gap-2">
                    {saving && (
                        <span
                            className="text-gray-500 animate-pulse"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
                        >
                            Saving changes...
                        </span>
                    )}
                    {lastSaved && !saving && (
                        <span
                            className="text-green-600 flex items-center gap-1"
                            style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
                        >
                            <Check size={14} /> Saved at {lastSaved} ✓
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};
