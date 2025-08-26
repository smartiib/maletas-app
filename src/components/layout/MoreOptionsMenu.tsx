
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Package2, 
  Briefcase, 
  DollarSign, 
  Truck, 
  BarChart3, 
  Building2, 
  CreditCard as BillingIcon, 
  Settings, 
  FileText,
  CreditCard
} from 'lucide-react';
import { useOrganizationPages } from '@/hooks/useOrganizationPages';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MoreOptionsMenuProps {
  onClose: () => void;
}

const MoreOptionsMenu: React.FC<MoreOptionsMenuProps> = ({ onClose }) => {
  const location = useLocation();
  const { enabledPages } = useOrganizationPages();
  
  const isActive = (path: string) => location.pathname === path;
  
  // Todas as páginas disponíveis (exceto as principais que já estão no menu inferior)
  const allMenuItems = [
    { path: '/pos', label: 'PDV', icon: CreditCard, key: 'pos', description: 'Ponto de Venda' },
    { path: '/stock', label: 'Estoque', icon: Package2, key: 'stock', description: 'Controle de estoque' },
    { path: '/maletas', label: 'Maletas', icon: Briefcase, key: 'maletas', description: 'Controle de maletas' },
    { path: '/financeiro', label: 'Financeiro', icon: DollarSign, key: 'financeiro', description: 'Gestão financeira' },
    { path: '/suppliers', label: 'Fornecedores', icon: Truck, key: 'suppliers', description: 'Gestão de fornecedores' },
    { path: '/reports', label: 'Relatórios', icon: BarChart3, key: 'reports', description: 'Relatórios e análises' },
    { path: '/organizations', label: 'Organizações', icon: Building2, key: 'organizations', description: 'Gestão de organizações' },
    { path: '/billing', label: 'Cobrança', icon: BillingIcon, key: 'billing', description: 'Gestão de cobrança' },
    { path: '/settings', label: 'Configurações', icon: Settings, key: 'settings', description: 'Configurações do sistema' },
    { path: '/pdf-templates', label: 'Templates PDF', icon: FileText, key: 'pdf-templates', description: 'Modelos de PDF' },
  ];

  const filteredItems = allMenuItems.filter(item => enabledPages.includes(item.key));

  return (
    <div className="py-4">
      <h3 className="text-lg font-semibold mb-4">Mais Opções</h3>
      <ScrollArea className="h-full max-h-[50vh]">
        <div className="grid grid-cols-2 gap-3">
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={cn(
                "flex flex-col items-center justify-center p-4 rounded-lg border transition-colors",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted border-border"
              )}
            >
              <item.icon className="w-6 h-6 mb-2" />
              <span className="text-sm font-medium text-center">{item.label}</span>
              <span className="text-xs text-center mt-1 opacity-70">{item.description}</span>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoreOptionsMenu;
