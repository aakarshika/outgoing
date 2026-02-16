import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter } from 'react-router-dom';
import { scan } from 'react-scan';

import { Toaster } from '@/components/ui/sonner';

import { Navbar } from './components/Navbar';
import { AuthProvider } from './features/auth/hooks';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './theme/ThemeProvider';

const queryClient = new QueryClient();

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  scan({
    enabled: true,
  });
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Navbar />
            <Toaster />
            <main className="flex-1 bg-background">
              <AppRoutes />
            </main>
          </div>
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
