import { Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks';
import { ProfileSidebar } from './ProfileSidebar';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="flex min-h-screen w-full bg-background">
      <ProfileSidebar />
      <main className="flex-1 overflow-auto bg-background p-6">
        <Outlet />
      </main>
    </div>
  );
}
