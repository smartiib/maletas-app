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
    <div className={`flex border rounded-md ${className || ''}`}>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={onToggle}
        className="rounded-r-none border-r"
      >
        <LayoutList className="w-4 h-4" />
      </Button>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={onToggle}
        className="rounded-l-none"
      >
        <LayoutGrid className="w-4 h-4" />
      </Button>
    </div>
  );
};

export default ViewModeToggle;