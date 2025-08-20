
import { useState, useCallback } from 'react';

export interface SyncProgressState {
  isOpen: boolean;
  syncType: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress: number;
  currentStep: string;
  itemsProcessed: number;
  totalItems: number;
  errorMessage?: string;
}

export const useSyncProgress = () => {
  const [progressState, setProgressState] = useState<SyncProgressState>({
    isOpen: false,
    syncType: '',
    status: 'idle',
    progress: 0,
    currentStep: '',
    itemsProcessed: 0,
    totalItems: 0,
    errorMessage: undefined
  });

  const startSync = useCallback((syncType: string) => {
    setProgressState({
      isOpen: true,
      syncType,
      status: 'syncing',
      progress: 0,
      currentStep: 'Iniciando sincronização...',
      itemsProcessed: 0,
      totalItems: 0,
      errorMessage: undefined
    });
  }, []);

  const updateProgress = useCallback((updates: Partial<SyncProgressState>) => {
    setProgressState(prev => ({ ...prev, ...updates }));
  }, []);

  const completeSync = useCallback((success: boolean, message?: string) => {
    setProgressState(prev => ({
      ...prev,
      status: success ? 'success' : 'error',
      progress: success ? 100 : prev.progress,
      currentStep: success ? 'Sincronização concluída!' : 'Erro na sincronização',
      errorMessage: success ? undefined : message
    }));
  }, []);

  const closeProgress = useCallback(() => {
    setProgressState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const resetProgress = useCallback(() => {
    setProgressState({
      isOpen: false,
      syncType: '',
      status: 'idle',
      progress: 0,
      currentStep: '',
      itemsProcessed: 0,
      totalItems: 0,
      errorMessage: undefined
    });
  }, []);

  return {
    progressState,
    startSync,
    updateProgress,
    completeSync,
    closeProgress,
    resetProgress
  };
};
