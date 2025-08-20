
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Minus, Edit, Trash2, Filter } from 'lucide-react';
import { useFinancialTransactions } from '@/hooks/useFinancialFiltered';
import TransactionForm from './TransactionForm';

const TransactionsList = () => {
  const { data: transactions = [], isLoading } = useFinancialTransactions();
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [initialType, setInitialType] = useState<'entrada' | 'saida' | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'entrada': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'saida': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-300';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      default: return type;
    }
  };

  const handleNewTransaction = (type: 'entrada' | 'saida') => {
    setSelectedTransaction(null);
    setInitialType(type);
    setTransactionFormOpen(true);
  };

  const handleEditTransaction = (transaction: any) => {
    setSelectedTransaction(transaction);
    setInitialType(null);
    setTransactionFormOpen(true);
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

  return (
    <div className="space-y-6">
      {/* Botões de Ação */}
      <div className="flex gap-3">
        <Button 
          onClick={() => handleNewTransaction('entrada')}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Entrada
        </Button>
        <Button 
          onClick={() => handleNewTransaction('saida')}
          variant="destructive"
        >
          <Minus className="w-4 h-4 mr-2" />
          Nova Saída
        </Button>
      </div>

      {/* Tabela de Transações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Histórico de Transações ({transactions.length} total)</span>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Plus className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Clique em "Nova Entrada" ou "Nova Saída" para começar
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(transaction.type)}>
                        {getTypeLabel(transaction.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{transaction.description}</div>
                      {transaction.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {transaction.notes}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{transaction.category || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{transaction.payment_method || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <div className={`font-semibold ${
                        transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'entrada' ? '+' : '-'}R$ {Number(transaction.amount).toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.status === 'completed' ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditTransaction(transaction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Transaction Form Dialog */}
      <TransactionForm
        open={transactionFormOpen}
        onOpenChange={setTransactionFormOpen}
        transaction={selectedTransaction}
        initialType={initialType}
      />
    </div>
  );
};

export default TransactionsList;
