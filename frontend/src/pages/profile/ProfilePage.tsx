import { Outlet } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks';

import { ProfileSidebar } from './ProfileSidebar';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div
      className="flex min-h-screen w-full"
      style={{
        background: '#f4f1ea',
        backgroundImage: 'radial-gradient(#d1d5db 0.5px, transparent 0.5px)',
        backgroundSize: '15px 15px',
      }}
    >
      <ProfileSidebar />
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
