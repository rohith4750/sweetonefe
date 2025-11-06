import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppRoutes } from './routes/AppRoutes';
import { useAuthStore } from './store/authStore';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './styles/global.css';

// Conditionally import React Query Devtools if available
const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import('@tanstack/react-query-devtools')
        .then((module) => ({ default: module.ReactQueryDevtools }))
        .catch(() => ({ default: () => null }))
    )
  : null;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Initialize auth state
const initializeAuth = () => {
  const { checkAuth } = useAuthStore.getState();
  checkAuth();
};

initializeAuth();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
        {import.meta.env.DEV && ReactQueryDevtools && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

