import React from 'react';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ViewModeToggle from '@/components/ui/view-mode-toggle';
import { ViewMode } from '@/hooks/useViewMode';

interface MaletaFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
}

const MaletaFilters: React.FC<MaletaFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  viewMode,
  onToggleViewMode
}) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap gap-4 flex-1">
          <div className="relative flex-1 min-w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por cliente, representante ou número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="active">Ativas</SelectItem>
              <SelectItem value="expired">Vencidas</SelectItem>
              <SelectItem value="finalized">Finalizadas</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <ViewModeToggle 
          viewMode={viewMode} 
          onToggle={onToggleViewMode} 
        />
      </div>
    </div>
  );
};

export default MaletaFilters;