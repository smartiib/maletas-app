
import React from 'react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ViewMode } from '@/hooks/useViewMode';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onToggle: () => void;
  className?: string;
}

const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  viewMode,
  onToggle,
  className
}) => {
  return (
    <div className={`flex border rounded-md overflow-hidden ${className || ''}`}>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => viewMode !== 'list' && onToggle()}
        className="rounded-none border-r-0"
      >
        <LayoutList className="w-4 h-4" />
        <span className="ml-2 hidden sm:inline">Lista</span>
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => viewMode !== 'grid' && onToggle()}
        className="rounded-none"
      >
        <LayoutGrid className="w-4 h-4" />
        <span className="ml-2 hidden sm:inline">Grade</span>
      </Button>
    </div>
  );
};

export default ViewModeToggle;
