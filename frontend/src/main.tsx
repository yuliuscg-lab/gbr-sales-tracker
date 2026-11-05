import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000*60*5, //5 minutes
      gcTime: 1000*60*10, //Cache disimpan 10 minutes
      retry: 1,
      refetchOnWindowFocus:false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <App />  
    </QueryClientProvider>
  </React.StrictMode>
);
