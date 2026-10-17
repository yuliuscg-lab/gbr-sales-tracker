import React, { useEffect } from 'react';
import { AppRoutes } from './routes/index';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

export const App: React.FC = () => {
  const { setAuth, setAccessToken, logout, setInitialized } = useAuthStore();
  
  useEffect(()=> {
    const bootstrapSession = async() => {
      try {
        const res = await authApi.refresh();
        if(res.data?.accessToken && res.data?.user) {
          setAuth(res.data.accessToken, res.data.user)
        } else if (res.data.accessToken) {
          setAccessToken(res.data.accessToken);
        } else {
          logout();
        }
      } catch {
        logout();
      } finally {
        setInitialized(true);
      }
    };

    bootstrapSession();
  }, [setAuth, setAccessToken, logout, setInitialized]);

  return <AppRoutes />;
};

export default App;
