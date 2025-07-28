import React, { useState } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, Calendar, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import FinancialDashboard from '@/components/financial/FinancialDashboard';
import TransactionForm from '@/components/financial/TransactionForm';
import InstallmentManager from '@/components/financial/InstallmentManager';
import PaymentPlanDialog from '@/components/orders/PaymentPlanDialog';
import { useFinancialTransactions } from '@/hooks/useFinancial';
import PageHelp from '@/components/ui/page-help';
import { helpContent } from '@/data/helpContent';

const Financeiro = () => {
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [paymentPlanDialogOpen, setPaymentPlanDialogOpen] = useState(false);
  const [selectedTransactionType, setSelectedTransactionType] = useState<'entrada' | 'saida' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const { data: transactions = [], isLoading } = useFinancialTransactions();

  // Filtrar transações
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = !selectedType || selectedType === 'all' || transaction.type === selectedType;
    const matchesCategory = !selectedCategory || selectedCategory === 'all' || transaction.category === selectedCategory;
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTypeColor = (type: string) => {
    return type === 'entrada' 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getTypeIcon = (type: string) => {
    return type === 'entrada' ? TrendingUp : TrendingDown;
  };

  const categories = Array.from(new Set(transactions.map(t => t.category).filter(Boolean)));

  const handleTransactionTypeSelect = (type: 'entrada' | 'saida') => {
    setSelectedTransactionType(type);
    setTransactionDialogOpen(true);
  };

  const handlePaymentPlanCreated = () => {
    setPaymentPlanDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Ajuda da Página */}
      <PageHelp 
        title="Sistema Financeiro"
        description="Gerencie suas finanças, controle de parcelas e fluxo de caixa"
        helpContent={{
          overview: "Sistema completo para gestão financeira",
          features: [
            {
              title: "Dashboard Financeiro",
              description: "Visualize resumos de entradas, saídas e saldo atual."
            },
            {
              title: "Transações",
              description: "Registre entradas e saídas manuais do seu negócio."
            },
            {
              title: "Parcelas",
              description: "Controle pagamentos parcelados de pedidos e dê baixa em parcelas."
            }
          ]
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <DollarSign className="w-8 h-8" />
            Financeiro
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
              novo
            </Badge>
          </h1>
          <p className="text-muted-foreground">
            Controle financeiro completo do seu negócio
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="w-4 h-4 mr-2" />
              Nova Transação
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => handleTransactionTypeSelect('entrada')}>
              <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
              Entrada
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleTransactionTypeSelect('saida')}>
              <TrendingDown className="w-4 h-4 mr-2 text-red-600" />
              Saída
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPaymentPlanDialogOpen(true)}>
              <Calendar className="w-4 h-4 mr-2 text-blue-600" />
              Parcelamento
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Dashboard */}
      <FinancialDashboard />

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Transações</TabsTrigger>
          <TabsTrigger value="installments">Parcelas</TabsTrigger>
        </TabsList>

        {/* Transações */}
        <TabsContent value="transactions" className="space-y-6">
          {/* Filtros */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Buscar transações..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="entrada">Entrada</SelectItem>
                      <SelectItem value="saida">Saída</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category || 'no-category'}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Transações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Transações ({filteredTransactions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma transação encontrada</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Método</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.map((transaction) => {
                      const TypeIcon = getTypeIcon(transaction.type);
                      return (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <TypeIcon className="w-4 h-4" />
                              <Badge className={getTypeColor(transaction.type)}>
                                {transaction.type === 'entrada' ? 'Entrada' : 'Saída'}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{transaction.description}</div>
                              {transaction.notes && (
                                <div className="text-sm text-muted-foreground">{transaction.notes}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {transaction.category && (
                              <Badge variant="outline">{transaction.category}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${
                              transaction.type === 'entrada' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'entrada' ? '+' : '-'}R$ {Number(transaction.amount).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.date).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell>
                            {transaction.payment_method && (
                              <Badge variant="secondary">{transaction.payment_method}</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Parcelas */}
        <TabsContent value="installments">
          <InstallmentManager />
        </TabsContent>
      </Tabs>

      {/* Transaction Dialog */}
      <TransactionForm
        open={transactionDialogOpen}
        onOpenChange={(open) => {
          setTransactionDialogOpen(open);
          if (!open) {
            setSelectedTransactionType(null);
          }
        }}
        initialType={selectedTransactionType}
      />

      {/* Payment Plan Dialog */}
      <PaymentPlanDialog
        open={paymentPlanDialogOpen}
        onOpenChange={setPaymentPlanDialogOpen}
        onPaymentPlanCreated={handlePaymentPlanCreated}
      />
    </div>
  );
};

export default Financeiro;