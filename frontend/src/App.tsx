import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { scan } from 'react-scan';

import { Toaster } from '@/components/ui/sonner';
import { useAuth } from '@/features/auth/hooks';

import { Footer } from './components/Footer';
import { AppBottomNav } from './components/navigation/AppBottomNav';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './features/auth/hooks';
import { ServicesProvider } from './features/vendors/ServicesContext';
import { SimpleNavbarMobile } from './pages/search/components/SimpleNavbarMobile';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './theme/ThemeProvider';

const queryClient = new QueryClient();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  scan({
    enabled: true,
  });
}

import { Box } from '@mui/material';

import {
  GlobalThreadChatDrawer,
} from '@/features/chat/GlobalThreadChatDrawer';
import {
  GlobalThreadChatDrawerProvider,
} from '@/features/chat/GlobalThreadChatDrawerContext';
import { ChatDrawerProvider, useChatDrawer } from '@/features/events/ChatDrawerContext';
import { ChatDrawer } from '@/pages/events/components/ChatDrawer';
import { BackgroundProvider, useBackground } from '@/theme/BackgroundProvider';

function GlobalChatDrawer() {
  const { isOpen, closeChat, params } = useChatDrawer();
  return (
    <ChatDrawer
      isOpen={isOpen}
      onClose={closeChat}
      title={params?.title}
      subtitle={params?.subtitle}
      badgeLabel={params?.badgeLabel}
      mode={params?.mode || 'group'}
      eventId={params?.eventId}
      conversationId={params?.conversationId}
      targetUsername={params?.targetUsername}
      otherUsername={params?.otherUsername}
      otherAvatar={params?.otherAvatar}
    />
  );
}

function AppContent() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { backgroundComponent } = useBackground();
  const isGallery = location.pathname.includes('/gallery/');
  const isEventDetailRoute = location.pathname.startsWith('/events');
  const isSearchRoute = location.pathname.startsWith('/search');
  const isChatListRoute = location.pathname.startsWith('/chats');
  const isHighlightRoute = location.pathname.startsWith('/highlights');
  const isSignedOutRoot = !isAuthenticated;

  return (
    <div className="relative flex min-h-screen flex-col pb-40 text-foreground transition-colors duration-300">
      {backgroundComponent}
      {/* {!isSearchRoute && <SimpleNavbarMobile />} */}
      {!isSearchRoute && !isChatListRoute && !isHighlightRoute && !isEventDetailRoute && <SimpleNavbarMobile />}

      <Toaster />
      <main className="flex-1 bg-transparent pb-32">
        <AppRoutes />
      </main>
      <GlobalChatDrawer />
      <GlobalThreadChatDrawer />
      {!isEventDetailRoute && <AppBottomNav />}
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
              <ServicesProvider>
                <GlobalThreadChatDrawerProvider>
                  <ChatDrawerProvider>
                    <ScrollToTop />
                    <AppContent />
                  </ChatDrawerProvider>
                </GlobalThreadChatDrawerProvider>
              </ServicesProvider>
            </BackgroundProvider>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
