import { useState, useEffect } from 'react';

export type ViewMode = 'list' | 'grid';

export const useViewMode = (key: string, defaultMode: ViewMode = 'list') => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem(`viewMode_${key}`);
    return (saved as ViewMode) || defaultMode;
  });

  useEffect(() => {
    localStorage.setItem(`viewMode_${key}`, viewMode);
  }, [key, viewMode]);

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'grid' : 'list');
  };

  return {
    viewMode,
    setViewMode,
    toggleViewMode,
    isListMode: viewMode === 'list',
    isGridMode: viewMode === 'grid'
  };
};