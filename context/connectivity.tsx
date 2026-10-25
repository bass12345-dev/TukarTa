import NetInfo from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface ConnectivityContextType {
  isOnline: boolean;
}

const ConnectivityContext = createContext<ConnectivityContextType>({ isOnline: true });

/** Tracks real device connectivity (NetInfo) and keeps React Query's online state in sync with it. */
export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // isInternetReachable is null while unknown; only treat an explicit false as offline
      const online = state.isConnected !== false && state.isInternetReachable !== false;
      setIsOnline(online);
      onlineManager.setOnline(online);
    });
    return unsubscribe;
  }, []);

  return <ConnectivityContext.Provider value={{ isOnline }}>{children}</ConnectivityContext.Provider>;
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}
