
import { Building2, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Link } from 'react-router-dom';

export function OrganizationSelector() {
  const { currentOrganization, organizations, setCurrentOrganization, loading } = useOrganization();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>Carregando...</span>
      </div>
    );
  }

  if (organizations.length === 0) {
    return (
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Building2 className="h-4 w-4" />
          <span>Nenhuma empresa</span>
        </div>
        <Link to="/organizations">
          <Button size="sm" className="w-full justify-start gap-2">
            <Plus className="h-3 w-3" />
            Cadastrar empresa
          </Button>
        </Link>
      </div>
    );
  }

  if (organizations.length === 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm">
        <Building2 className="h-4 w-4" />
        <span className="font-medium">{currentOrganization?.name}</span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="justify-start gap-2 px-3">
          <Building2 className="h-4 w-4" />
          <span className="font-medium">
            {currentOrganization?.name || 'Selecionar empresa'}
          </span>
          <ChevronDown className="ml-auto h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => setCurrentOrganization(org)}
            className={currentOrganization?.id === org.id ? 'bg-accent' : ''}
          >
            <div className="flex flex-col">
              <span className="font-medium">{org.name}</span>
              <span className="text-xs text-muted-foreground">{org.slug}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
