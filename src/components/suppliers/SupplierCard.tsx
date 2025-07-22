import React from 'react';
import { Edit, Trash2, Building2, Mail, Phone, Link, MoreHorizontal } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SupplierCardProps {
  supplier: any;
  onEdit: (supplier: any) => void;
  onDelete: (id: string) => void;
  onManageProducts: (supplier: any) => void;
}

const SupplierCard = ({ supplier, onEdit, onDelete, onManageProducts }: SupplierCardProps) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{supplier.name}</CardTitle>
              {supplier.company_name && (
                <p className="text-sm text-muted-foreground truncate">
                  {supplier.company_name}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
              {supplier.is_active ? 'Ativo' : 'Inativo'}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(supplier)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageProducts(supplier)}>
                  <Link className="mr-2 h-4 w-4" />
                  Gerenciar Produtos
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(supplier.id)}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {supplier.email && (
          <div className="flex items-center space-x-2 text-sm">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span className="truncate">{supplier.email}</span>
          </div>
        )}
        
        {supplier.phone && (
          <div className="flex items-center space-x-2 text-sm">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{supplier.phone}</span>
          </div>
        )}

        {supplier.city && supplier.state && (
          <div className="text-sm text-muted-foreground">
            {supplier.city}, {supplier.state}
          </div>
        )}

        {supplier.contact_person && (
          <div className="text-sm">
            <span className="text-muted-foreground">Contato: </span>
            <span>{supplier.contact_person}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(supplier)}
            className="flex-1"
          >
            <Edit className="w-4 h-4 mr-2" />
            Editar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onManageProducts(supplier)}
            className="flex-1"
          >
            <Link className="w-4 h-4 mr-2" />
            Produtos
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SupplierCard;