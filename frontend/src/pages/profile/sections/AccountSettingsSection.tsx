import {
  CreditCard,
  ExternalLink,
  LogOut,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';

import { useAuth } from '@/features/auth/AuthContext';

export const AccountSettingsSection = () => {
  const { logout } = useAuth();

  const cardClass =
    'border-2 border-gray-800 bg-white p-6 shadow-[3px_4px_0px_#333] relative';
  const cardBg = {
    backgroundImage: 'linear-gradient(transparent 95%, #e5e7eb 100%)',
    backgroundSize: '100% 32px',
  };

  return (
    <div className="max-w-2xl space-y-8">
      <header className="relative">
        <div
          className="absolute -top-2 left-0 w-24 h-5 pointer-events-none"
          style={{
            background: 'rgba(167, 243, 208, 0.5)',
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
          Account Settings
        </h2>
        <p
          className="mt-1 text-gray-500"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.15rem' }}
        >
          manage your subscription, security & stuff 🔒
        </p>
      </header>

      {/* Subscription */}
      <div className={cardClass} style={cardBg}>
        {/* Washi tape */}
        <div
          className="absolute -top-2 left-[25%] w-20 h-5 pointer-events-none"
          style={{
            background: 'rgba(251, 191, 36, 0.5)',
            transform: 'rotate(3deg)',
            border: '1px solid rgba(0,0,0,0.05)',
          }}
        />
        <div className="flex items-center justify-between mb-4">
          <h3
            className="flex items-center gap-2 text-gray-900"
            style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}
          >
            <Zap className="text-yellow-500" /> Subscription Plan
          </h3>
          <span
            className="px-3 py-1 border-2 border-gray-800 bg-yellow-300 text-gray-900 text-xs font-bold uppercase tracking-wider shadow-[1px_2px_0px_#333]"
            style={{ fontFamily: '"Permanent Marker", cursive' }}
          >
            Pro Plan
          </span>
        </div>
        <p
          className="text-gray-500 mb-6"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
        >
          Your next billing date is March 12, 2026 for $29.00.
        </p>
        <div className="flex gap-3">
          <button
            className="border-2 border-gray-800 bg-blue-400 px-4 py-2 text-white shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-blue-500"
            style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
          >
            Upgrade Plan
          </button>
          <button
            className="border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_3px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-gray-100"
            style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.85rem' }}
          >
            Manage Billing
          </button>
        </div>
      </div>

      {/* Payment Methods */}
      <div className={cardClass} style={cardBg}>
        <h3
          className="mb-4 flex items-center gap-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}
        >
          <CreditCard className="text-blue-500" /> Payment Methods
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between border-2 border-dashed border-gray-300 py-3 px-4">
            <div className="flex items-center gap-3">
              <div
                className="flex h-7 w-12 items-center justify-center border-2 border-gray-800 bg-blue-100 text-xs font-bold shadow-[1px_1px_0px_#333]"
                style={{ fontFamily: '"Permanent Marker", cursive' }}
              >
                VISA
              </div>
              <div>
                <p
                  className="font-medium text-gray-800"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
                >
                  •••• •••• •••• 4242
                </p>
                <p
                  className="text-gray-500"
                  style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}
                >
                  Expires 12/28
                </p>
              </div>
            </div>
            <button
              className="text-blue-500 font-bold underline decoration-dashed underline-offset-4 hover:text-blue-600 transition-colors"
              style={{ fontFamily: '"Caveat", cursive', fontSize: '1rem' }}
            >
              Edit
            </button>
          </div>
        </div>
        <button
          className="mt-4 flex items-center gap-1 font-bold text-pink-500 underline decoration-dashed underline-offset-4 hover:text-pink-600 transition-colors"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.05rem' }}
        >
          <ExternalLink size={14} /> Add new payment method
        </button>
      </div>

      {/* Security */}
      <div className={cardClass} style={cardBg}>
        <h3
          className="mb-4 flex items-center gap-2 text-gray-900"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.1rem' }}
        >
          <ShieldCheck className="text-green-500" /> Security
        </h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between border-2 border-dashed border-gray-300 py-3 px-4">
            <div>
              <p
                className="font-bold text-gray-800"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                Change Password
              </p>
              <p
                className="text-gray-500"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}
              >
                Regularly update your password for better security.
              </p>
            </div>
            <button
              className="border-2 border-gray-800 bg-white px-3 py-1 text-gray-800 text-sm shadow-[2px_2px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-gray-100"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.75rem' }}
            >
              Update
            </button>
          </div>
          <div className="flex items-center justify-between border-2 border-dashed border-gray-300 py-3 px-4">
            <div>
              <p
                className="font-bold text-gray-800"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                Two-Factor Authentication
              </p>
              <p
                className="text-gray-500"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}
              >
                Add an extra layer of security to your account.
              </p>
            </div>
            <button
              className="border-2 border-gray-800 bg-green-400 px-3 py-1 text-white text-sm shadow-[2px_2px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-green-500"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.75rem' }}
            >
              Enable
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-2 border-dashed border-red-400 bg-red-50 p-6 shadow-[3px_4px_0px_rgba(239,68,68,0.4)] relative">
        {/* "DANGER" tape */}
        <div
          className="absolute -top-3 left-[20%] w-24 h-6 flex items-center justify-center pointer-events-none z-10"
          style={{
            background: 'rgba(239, 68, 68, 0.7)',
            transform: 'rotate(-3deg)',
            border: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <span
            className="text-white text-xs font-bold tracking-widest"
            style={{ fontFamily: '"Permanent Marker"' }}
          >
            DANGER
          </span>
        </div>

        <h3
          className="mb-4 text-red-600"
          style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '1.2rem' }}
        >
          Danger Zone
        </h3>
        <p
          className="text-red-400 mb-6"
          style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
        >
          These actions are permanent and cannot be undone. Please be certain.
        </p>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                className="font-bold text-gray-800"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                Sign Out
              </p>
              <p
                className="text-gray-500"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}
              >
                Log out of your current session on this device.
              </p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 border-2 border-gray-800 bg-white px-4 py-2 text-gray-800 shadow-[2px_2px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-gray-100"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.8rem' }}
            >
              <LogOut size={16} /> Sign Out
            </button>
          </div>

          <div className="flex items-center justify-between border-t-2 border-dashed border-red-300 pt-4">
            <div>
              <p
                className="font-bold text-red-600"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '1.1rem' }}
              >
                Delete Account
              </p>
              <p
                className="text-red-400"
                style={{ fontFamily: '"Caveat", cursive', fontSize: '0.95rem' }}
              >
                Permanently delete your account and all associated data.
              </p>
            </div>
            <button
              className="flex items-center gap-2 border-2 border-gray-800 bg-red-500 px-4 py-2 text-white shadow-[2px_2px_0px_#333] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#333] hover:bg-red-600"
              style={{ fontFamily: '"Permanent Marker", cursive', fontSize: '0.8rem' }}
            >
              <Trash2 size={16} /> Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
