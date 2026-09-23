import React from 'react';
import { AppRoutes } from './routes/AppRoutes';
import { useInitAuth } from './hooks/useInitAuth';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isLoading } = useInitAuth();

  if (isLoading) {
    return(
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2 text-primary">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm font-medium text-neutral-500">Memuat sesi...</p>
        </div>
      </div>
    )
  }
  return <AppRoutes />;
};
export default App;
