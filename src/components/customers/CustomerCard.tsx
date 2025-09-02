import React from 'react';
import { User, Mail, Phone, MapPin, Crown, Edit, Eye, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/services/woocommerce';
import { ViewMode } from '@/hooks/useViewMode';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CreateMaletaFromCustomer from '@/components/maletas/CreateMaletaFromCustomer';
import { CustomerBirthdayBadge } from './CustomerBirthdayBadge';
import { BirthdayActions } from './BirthdayActions';
import { getBirthdayInfo } from '@/utils/dateUtils';

interface CustomerCardProps {
  customer: Customer;
  viewMode: ViewMode;
  onView?: (customer: Customer) => void;
  onEdit?: (customer: Customer) => void;
  onToggleRepresentative?: (customer: Customer) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  viewMode, 
  onView, 
  onEdit, 
  onToggleRepresentative 
}) => {
  const isRepresentative = (customer: Customer) => {
    return customer.meta_data?.some(meta => meta.key === 'is_representative' && (meta.value === true || meta.value === '1' || meta.value === 1));
  };

  const birthdayInfo = getBirthdayInfo(customer);

  return (
    <Card className="hover:shadow-md transition-all duration-200">
      <CardContent className="p-4">
        <div className={viewMode === 'grid' ? 'space-y-4' : 'flex items-center justify-between'}>
          <div className="flex-1">
            <div className={viewMode === 'grid' ? 'space-y-3' : 'flex items-center gap-4'}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {customer.first_name} {customer.last_name}
                      {birthdayInfo.isToday && <span className="ml-1">🎂</span>}
                    </h3>
                    {isRepresentative(customer) && (
                      <Crown className="w-4 h-4 text-yellow-600" />
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">ID: {customer.id}</p>
                    {birthdayInfo.age && (
                      <span className="text-xs text-muted-foreground">{birthdayInfo.age} anos</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={viewMode === 'grid' ? 'space-y-2 mt-3' : 'flex items-center gap-6 ml-16'}>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-3 h-3" />
                <span>{customer.email}</span>
              </div>
              {customer.billing?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-3 h-3" />
                  <span>{customer.billing.phone}</span>
                </div>
              )}
              {(customer.billing?.city || customer.billing?.state) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{customer.billing.city}{customer.billing.city && customer.billing.state && ', '}{customer.billing.state}</span>
                </div>
              )}
            </div>

            <div className={viewMode === 'grid' ? 'mt-3 space-y-2' : 'ml-16'}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total gasto:</span>
                <span className="font-semibold text-green-600">
                  R$ {(parseFloat(customer.total_spent || '0') || 0).toFixed(2)}
                </span>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {isRepresentative(customer) && (
                  <Badge variant="secondary" className="text-yellow-700 bg-yellow-100 border-yellow-200">
                    <Crown className="w-3 h-3 mr-1" />
                    Representante
                  </Badge>
                )}
                <CustomerBirthdayBadge customer={customer} variant="compact" />
                {customer.orders_count > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {customer.orders_count} pedidos
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className={viewMode === 'grid' ? 'flex justify-end gap-2 mt-2' : 'flex items-center gap-2'}>
            <BirthdayActions customer={customer} variant="individual" />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onView?.(customer)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onEdit?.(customer)}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onToggleRepresentative?.(customer)}>
                  <Crown className="w-4 h-4 mr-2" />
                  {isRepresentative(customer) ? 'Remover como Rep.' : 'Tornar Representante'}
                </DropdownMenuItem>
                {isRepresentative(customer) && (
                  <DropdownMenuItem asChild>
                    <CreateMaletaFromCustomer
                      representativeId={customer.id}
                      representativeName={`${customer.first_name} ${customer.last_name}`}
                    />
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerCard;