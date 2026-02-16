import { CreditCard, ShieldCheck, LogOut, Trash2, Zap, ExternalLink } from 'lucide-react';
import { useAuth } from '@/features/auth/AuthContext';

const cardClass = 'rounded-lg border border-border bg-card p-6 shadow-sm';
const sectionTitle = 'text-xl font-semibold';
const sectionDescription = 'mt-1 text-sm text-muted-foreground';

export const AccountSettingsSection = () => {
    const { logout } = useAuth();

    return (
        <div className="max-w-2xl space-y-8">
            <header>
                <h2 className={sectionTitle}>Account Settings</h2>
                <p className={sectionDescription}>Manage your subscription, security, and account status.</p>
            </header>

            <div className={cardClass}>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Zap className="text-yellow-500" /> Subscription Plan
                    </h3>
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">Pro Plan</span>
                </div>
                <p className="text-sm text-muted-foreground mb-6">Your next billing date is March 12, 2026 for $29.00.</p>
                <div className="flex gap-3">
                    <button className="text-sm font-semibold bg-primary text-primary-foreground px-4 py-2 rounded-md hover:opacity-90 transition-opacity">
                        Upgrade Plan
                    </button>
                    <button className="text-sm font-semibold bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/80 transition-colors">
                        Manage Billing
                    </button>
                </div>
            </div>

            <div className={cardClass}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <CreditCard className="text-blue-500" /> Payment Methods
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border py-3 px-4">
                        <div className="flex items-center gap-3">
                            <div className="flex h-6 w-10 items-center justify-center rounded bg-muted text-[10px] font-bold">VISA</div>
                            <div>
                                <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                                <p className="text-xs text-muted-foreground">Expires 12/28</p>
                            </div>
                        </div>
                        <button className="text-xs text-primary hover:underline">Edit</button>
                    </div>
                </div>
                <button className="mt-4 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                    <ExternalLink size={14} /> Add new payment method
                </button>
            </div>

            <div className={cardClass}>
                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                    <ShieldCheck className="text-green-500" /> Security
                </h3>
                <div className="space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-border py-3 px-4">
                        <div>
                            <p className="text-sm font-medium">Change Password</p>
                            <p className="text-xs text-muted-foreground">Regularly update your password for better security.</p>
                        </div>
                        <button className="rounded px-3 py-1 text-xs bg-muted hover:bg-muted/80">Update</button>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-border py-3 px-4">
                        <div>
                            <p className="text-sm font-medium">Two-Factor Authentication</p>
                            <p className="text-xs text-muted-foreground">Add an extra layer of security to your account.</p>
                        </div>
                        <button className="text-xs bg-primary text-background px-3 py-1 rounded hover:opacity-90">Enable</button>
                    </div>
                </div>
            </div>

            <div className={`${cardClass} border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20`}>
                <h3 className="mb-4 text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
                <p className="text-sm text-muted-foreground mb-6">These actions are permanent and cannot be undone. Please be certain.</p>
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold">Sign Out</p>
                            <p className="text-xs text-muted-foreground">Log out of your current session on this device.</p>
                        </div>
                        <button
                            onClick={logout}
                            className="flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>

                    <div className="flex items-center justify-between border-t border-red-100 pt-4 dark:border-red-900/60">
                        <div>
                            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
                            <p className="text-xs text-muted-foreground text-red-400">Permanently delete your account and all associated data.</p>
                        </div>
                        <button className="flex items-center gap-2 text-sm font-medium bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                            <Trash2 size={16} /> Delete Account
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
