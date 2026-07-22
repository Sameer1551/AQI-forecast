import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AppShell from '@/components/layout/AppShell';
import SkeletonLoader from '@/components/ui/SkeletonLoader';

const LiveMap = lazy(() => import('@/pages/LiveMap/LiveMap'));
const ForecastPage = lazy(() => import('@/pages/Forecast/ForecastPage'));
const GraphExplorer = lazy(() => import('@/pages/GraphExplorer/GraphExplorer'));
const ScenarioPage = lazy(() => import('@/pages/Scenario/ScenarioPage'));
const InsightsPage = lazy(() => import('@/pages/Insights/InsightsPage'));
const MonitoringPage = lazy(() => import('@/pages/Monitoring/MonitoringPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <SkeletonLoader width="200px" height="30px" />
      <SkeletonLoader width="100%" height="200px" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/" element={<Suspense fallback={<PageLoader />}><LiveMap /></Suspense>} />
            <Route path="/forecast" element={<Suspense fallback={<PageLoader />}><ForecastPage /></Suspense>} />
            <Route path="/graph" element={<Suspense fallback={<PageLoader />}><GraphExplorer /></Suspense>} />
            <Route path="/scenario" element={<Suspense fallback={<PageLoader />}><ScenarioPage /></Suspense>} />
            <Route path="/insights" element={<Suspense fallback={<PageLoader />}><InsightsPage /></Suspense>} />
            <Route path="/monitoring" element={<Suspense fallback={<PageLoader />}><MonitoringPage /></Suspense>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
