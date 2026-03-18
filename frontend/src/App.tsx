import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { scan } from 'react-scan';

import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/features/auth/hooks';

import { Footer } from './components/Footer';
import { AppBottomNav } from './components/navigation/AppBottomNav';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './features/auth/hooks';
import { SimpleNavbar } from './pages/search/components/SimpleNavbar';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './theme/ThemeProvider';

const queryClient = new QueryClient();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  scan({
    enabled: true,
  });
}

import { ChatDrawerProvider, useChatDrawer } from '@/features/events/ChatDrawerContext';
import { ChatDrawer } from '@/pages/events/components/ChatDrawer';
import { BackgroundProvider, useBackground } from '@/theme/BackgroundProvider';
import { Box } from '@mui/material';

function GlobalChatDrawer() {
  const { isOpen, closeChat, params } = useChatDrawer();
  return (
    <ChatDrawer
      isOpen={isOpen}
      onClose={closeChat}
      title={params?.title || 'Chat'}
      mode={params?.mode || 'group'}
      eventId={params?.eventId}
      conversationId={params?.conversationId}
      targetUsername={params?.targetUsername}
    />
  );
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { backgroundComponent } = useBackground();
  const isGallery = location.pathname.includes('/gallery/');
  const isSearchRoute = location.pathname.startsWith('/search');
  const isChatListRoute =
    location.pathname.startsWith('/chats');
  const isChatThreadRoute =
    location.pathname.startsWith('/chats/group/') ||
    location.pathname.startsWith('/chats/private/') ||
    location.pathname.startsWith('/chats/direct/');
  const isSignedOutRoot = !isAuthenticated;

  return (
    <div className="relative flex min-h-screen flex-col pb-24 text-foreground transition-colors duration-300">
      {backgroundComponent}
      {/* {!isSearchRoute && <SimpleNavbar />} */}
      {!isSearchRoute && !isChatThreadRoute && !isChatListRoute && (

          <SimpleNavbar />
      )}
      
      <Toaster />
      <main className="flex-1 bg-transparent">
        <AppRoutes />
      </main>
      <GlobalChatDrawer />
      {!isChatThreadRoute && <AppBottomNav />}
      {!isGallery && !isSignedOutRoot && (
        <div className="mt-50">
          <Footer />
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <BackgroundProvider>
              <ChatDrawerProvider>
                <ScrollToTop />
                <AppContent />
              </ChatDrawerProvider>
            </BackgroundProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
