import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Calendar, DollarSign, MapPin, Mail, Phone, Building } from 'lucide-react';
import { Customer } from '@/types';

interface CustomerDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
}

const CustomerDetails: React.FC<CustomerDetailsProps> = ({ open, onOpenChange, customer }) => {
  if (!customer) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            {customer.first_name} {customer.last_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-400" />
              <span>@{customer.username}</span>
            </div>
            <div className="text-sm text-slate-600">
              ID: {customer.id}
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total de Pedidos</p>
                    <p className="text-2xl font-bold">{customer.orders_count || 0}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Gasto</p>
                    <p className="text-2xl font-bold">R$ {parseFloat(customer.total_spent || '0').toFixed(2)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-success-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Informações de Cobrança
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Nome Completo</label>
                    <p className="font-semibold">{customer.billing.first_name} {customer.billing.last_name}</p>
                  </div>
                  
                  {customer.billing.company && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Empresa</label>
                      <div className="flex items-center gap-2">
                        <Building className="w-4 h-4 text-slate-400" />
                        <span>{customer.billing.company}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-400" />
                      <span>{customer.billing.email}</span>
                    </div>
                  </div>
                  
                  {customer.billing.phone && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">Telefone</label>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-slate-400" />
                        <span>{customer.billing.phone}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-600">Endereço</label>
                  <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                    <div>
                      <p>{customer.billing.address_1}</p>
                      {customer.billing.address_2 && <p>{customer.billing.address_2}</p>}
                      <p>{customer.billing.city}, {customer.billing.state}</p>
                      <p>{customer.billing.postcode} - {customer.billing.country}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Informações da Conta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Data de Criação</label>
                  <p>{new Date(customer.date_created).toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Última Modificação</label>
                  <p>{new Date(customer.date_modified).toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerDetails;
