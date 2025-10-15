import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { syncService, SyncStatus } from '../services/syncService';
import { databaseService } from '../services/databaseService';

interface SyncContextType {
  syncStatus: SyncStatus;
  initializeSync: () => Promise<void>;
  forceSync: () => Promise<boolean>;
  checkUnsyncedCount: () => Promise<number>;
}

const SyncContext = createContext<SyncContextType | undefined>(undefined);

interface SyncProviderProps {
  children: ReactNode;
}

export const SyncProvider: React.FC<SyncProviderProps> = ({ children }) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncService.getStatus());

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = syncService.subscribe(setSyncStatus);

    // Initialize database and sync service
    initializeSync();

    // Handle app state changes for auto-sync
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      syncService.handleAppStateChange(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      unsubscribe();
      subscription?.remove();
    };
  }, []);

  const initializeSync = async () => {
    try {
      // Initialize local database
      await databaseService.init();
      
      // Initialize sync service
      await syncService.initialize();
      
      console.log('Sync context initialized successfully');
    } catch (error) {
      console.error('Failed to initialize sync context:', error);
    }
  };

  const forceSync = async (): Promise<boolean> => {
    return await syncService.forceSync();
  };

  const checkUnsyncedCount = async (): Promise<number> => {
    return await syncService.checkUnsyncedCount();
  };

  const value: SyncContextType = {
    syncStatus,
    initializeSync,
    forceSync,
    checkUnsyncedCount,
  };

  return (
    <SyncContext.Provider value={value}>
      {children}
    </SyncContext.Provider>
  );
};

export const useSync = (): SyncContextType => {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error('useSync must be used within a SyncProvider');
  }
  return context;
};
