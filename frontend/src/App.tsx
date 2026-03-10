import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { scan } from 'react-scan';

import { Toaster } from '@/components/ui/sonner';

import { Footer } from './components/Footer';
import { Navbar } from './components/Navbar';
import { ScrollToTop } from './components/ScrollToTop';
import { AuthProvider } from './features/auth/hooks';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './theme/ThemeProvider';

const queryClient = new QueryClient();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  scan({
    enabled: true,
  });
}

import { BackgroundProvider, useBackground } from '@/theme/BackgroundProvider';

function AppContent() {
  const location = useLocation();
  const { backgroundComponent } = useBackground();
  const isGallery = location.pathname.includes('/gallery/');

  return (
    <div className="relative flex flex-col min-h-screen text-foreground transition-colors duration-300">
      {backgroundComponent}
      <Navbar />
      <Toaster />
      <main className="flex-1 bg-transparent">
        <AppRoutes />
      </main>
      {!isGallery && (
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
              <ScrollToTop />
              <AppContent />
            </BackgroundProvider>
          </BrowserRouter>
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools initialIsOpen={false} />
          )}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
