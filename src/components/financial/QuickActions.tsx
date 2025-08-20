
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Minus, CreditCard, PiggyBank } from 'lucide-react';

interface QuickActionsProps {
  onNewEntry: () => void;
  onNewExit: () => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onNewEntry, onNewExit }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PiggyBank className="w-5 h-5" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={onNewEntry}
            className="bg-green-600 hover:bg-green-700 h-12"
          >
            <Plus className="w-5 h-5 mr-2" />
            Registrar Entrada
          </Button>
          <Button 
            onClick={onNewExit}
            variant="destructive"
            className="h-12"
          >
            <Minus className="w-5 h-5 mr-2" />
            Registrar Saída
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-sm text-green-700 dark:text-green-300">Use para</div>
            <div className="font-medium text-green-800 dark:text-green-200">Vendas, recebimentos, juros</div>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-sm text-red-700 dark:text-red-300">Use para</div>
            <div className="font-medium text-red-800 dark:text-red-200">Despesas, pagamentos, custos</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
