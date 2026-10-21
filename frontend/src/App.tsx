import React, { useEffect, useRef } from 'react';
import { AppRoutes } from './routes/index';
import { useAuthStore } from './store/authStore';
import { authApi } from './api/auth';

export const App: React.FC = () => {
  const { setAuth, setAccessToken, logout, setInitialized } = useAuthStore();
  const initializingRef = useRef(false);

  useEffect(()=> {
    if(initializingRef.current) return;
    initializingRef.current = true;
    
    const bootstrapSession = async() => {
      try {
        const res = await authApi.refresh();
        const payload = res.data;
        if(payload.accessToken && payload.user) {
          setAuth(payload.accessToken, payload.user)
        } else if (payload.accessToken) {
          setAccessToken(payload.accessToken);
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
