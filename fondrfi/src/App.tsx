import { useEffect, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ThemeProvider } from '@/components/theme-provider';
import { WalletProvider } from '@/contexts/wallet-context';
import NotFound from '@/pages/not-found';
import { Home } from '@/pages/Home';
import { Portfolio } from '@/pages/Portfolio';
import { Explore } from '@/pages/Explore';
import { Earn } from '@/pages/Earn';
import { Docs } from '@/pages/Docs';
import { Whitepaper } from '@/pages/Whitepaper';
import { Navbar } from '@/components/layout/Navbar';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

const queryClient = new QueryClient();

function Router() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <main className="flex-1 flex flex-col">
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/portfolio" component={Portfolio} />
            <Route path="/explore" component={Explore} />
            <Route path="/earn" component={Earn} />
            <Route path="/docs" component={Docs} />
            <Route path="/whitepaper" component={Whitepaper} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </main>
    </div>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  useEffect(() => {
    if (!location.includes("#")) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <QueryClientProvider client={queryClient}>
          <WalletProvider>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
                <Router />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </WalletProvider>
        </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
