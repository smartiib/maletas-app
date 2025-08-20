
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, DollarSign, Calendar, AlertTriangle, CheckCircle } from 'lucide-react';
import { usePaymentInstallments, usePaymentPlans } from '@/hooks/useFinancial';
import PaymentDialog from './PaymentDialog';

const InstallmentManager = () => {
  const { data: installments = [], isLoading } = usePaymentInstallments();
  const { data: paymentPlans = [] } = usePaymentPlans();
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'cancelled': return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    if (status === 'paid') return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  };

  const handlePayment = (installment: any) => {
    setSelectedInstallment(installment);
    setPaymentDialogOpen(true);
  };

  const getPlanDetails = (planId: string) => {
    return paymentPlans.find(plan => plan.id === planId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Marcar parcelas vencidas
  const installmentsWithStatus = installments.map(installment => ({
    ...installment,
    status: isOverdue(installment.due_date, installment.status) && installment.status === 'pending' 
      ? 'overdue' 
      : installment.status
  }));

  // Estatísticas
  const totalPendingAmount = installmentsWithStatus
    .filter(i => i.status === 'pending' || i.status === 'overdue')
    .reduce((sum, i) => sum + Number(i.amount), 0);

  const overdueCount = installmentsWithStatus.filter(i => i.status === 'overdue').length;
  const pendingCount = installmentsWithStatus.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Card de Parcelas com Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Controle de Parcelas ({installmentsWithStatus.length} total)
          </CardTitle>
          
          {/* Estatísticas das Parcelas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <div>
                <p className="text-sm text-blue-700 dark:text-blue-300">Total a Receber</p>
                <p className="text-xl font-bold text-blue-800 dark:text-blue-200">R$ {totalPendingAmount.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <p className="text-sm text-red-700 dark:text-red-300">Parcelas Vencidas</p>
                <p className="text-xl font-bold text-red-600">{overdueCount}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Calendar className="w-8 h-8 text-yellow-600" />
              <div>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">Parcelas Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{pendingCount}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {installmentsWithStatus.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Pedido</TableHead>
                  <TableHead>Parcela</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {installmentsWithStatus.map((installment) => {
                  const plan = getPlanDetails(installment.payment_plan_id);
                  return (
                    <TableRow key={installment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{plan?.customer_name}</div>
                          <div className="text-sm text-muted-foreground">{plan?.customer_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">#{plan?.order_number || plan?.order_id}</div>
                      </TableCell>
                      <TableCell>
                        {installment.installment_number}/{plan?.installments_count}
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold">R$ {Number(installment.amount).toFixed(2)}</div>
                        {installment.late_fee > 0 && (
                          <div className="text-sm text-red-600">+R$ {Number(installment.late_fee).toFixed(2)} multa</div>
                        )}
                        {installment.discount > 0 && (
                          <div className="text-sm text-green-600">-R$ {Number(installment.discount).toFixed(2)} desconto</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(installment.due_date).toLocaleDateString('pt-BR')}
                        </div>
                        {installment.payment_date && (
                          <div className="text-sm text-muted-foreground">
                            Pago em {new Date(installment.payment_date).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(installment.status)}>
                          {getStatusLabel(installment.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {installment.status === 'pending' || installment.status === 'overdue' ? (
                            <Button
                              size="sm"
                              onClick={() => handlePayment(installment)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Baixa
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayment(installment)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        installment={selectedInstallment}
      />
    </div>
  );
};

export default InstallmentManager;
