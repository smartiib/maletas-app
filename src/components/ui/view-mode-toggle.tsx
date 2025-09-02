import { Button } from "@/components/ui/button";
import { Grid3X3, List } from "lucide-react";
import { ViewMode } from "@/hooks/useViewMode";

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  onToggle?: () => void;
  className?: string;
}

const ViewModeToggle = ({ viewMode, onViewModeChange, onToggle, className }: ViewModeToggleProps) => {
  const handleGridClick = () => {
    if (onViewModeChange) {
      onViewModeChange('grid');
    } else if (onToggle && viewMode === 'list') {
      onToggle();
    }
  };

  const handleListClick = () => {
    if (onViewModeChange) {
      onViewModeChange('list');
    } else if (onToggle && viewMode === 'grid') {
      onToggle();
    }
  };

  return (
    <div className={`flex items-center gap-1 border rounded-lg p-1 ${className || ''}`}>
      <Button
        variant={viewMode === 'grid' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleGridClick}
        className="h-8 w-8 p-0"
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={handleListClick}
        className="h-8 w-8 p-0"
      >
        <List className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ViewModeToggle;
export { ViewModeToggle };