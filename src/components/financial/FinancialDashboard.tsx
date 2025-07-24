import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, AlertTriangle, Calendar, Clock } from 'lucide-react';
import { useFinancialDashboard } from '@/hooks/useFinancial';

const FinancialDashboard = () => {
  const { data: dashboard, isLoading } = useFinancialDashboard();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Entradas */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                Entradas (Mês)
              </p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                R$ {dashboard?.entradas.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      {/* Saídas */}
      <Card className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Saídas (Mês)
              </p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                R$ {dashboard?.saidas.toFixed(2) || '0.00'}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Saldo */}
      <Card className={`bg-gradient-to-r ${
        (dashboard?.saldo || 0) >= 0 
          ? 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-700'
          : 'from-orange-50 to-yellow-50 dark:from-orange-900/20 dark:to-yellow-900/20 border-orange-200 dark:border-orange-700'
      }`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium ${
                (dashboard?.saldo || 0) >= 0
                  ? 'text-blue-700 dark:text-blue-300'
                  : 'text-orange-700 dark:text-orange-300'
              }`}>
                Saldo (Mês)
              </p>
              <p className={`text-2xl font-bold ${
                (dashboard?.saldo || 0) >= 0
                  ? 'text-blue-800 dark:text-blue-200'
                  : 'text-orange-800 dark:text-orange-200'
              }`}>
                R$ {dashboard?.saldo.toFixed(2) || '0.00'}
              </p>
            </div>
            <DollarSign className={`w-8 h-8 ${
              (dashboard?.saldo || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`} />
          </div>
        </CardContent>
      </Card>

      {/* Parcelas Vencidas */}
      <Card className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-200 dark:border-red-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                Parcelas Vencidas
              </p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-200">
                {dashboard?.parcelasVencidas || 0}
              </p>
              <p className="text-sm text-red-600 dark:text-red-400">
                R$ {dashboard?.valorVencido.toFixed(2) || '0.00'}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      {/* Parcelas a Vencer */}
      <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                A Vencer (7 dias)
              </p>
              <p className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">
                {dashboard?.parcelasAVencer || 0}
              </p>
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                R$ {dashboard?.valorAVencer.toFixed(2) || '0.00'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      {/* Resumo Geral */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border-purple-200 dark:border-purple-700">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                Total a Receber
              </p>
              <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                R$ {((dashboard?.valorVencido || 0) + (dashboard?.valorAVencer || 0)).toFixed(2)}
              </p>
              <p className="text-sm text-purple-600 dark:text-purple-400">
                {((dashboard?.parcelasVencidas || 0) + (dashboard?.parcelasAVencer || 0))} parcelas
              </p>
            </div>
            <Calendar className="w-8 h-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialDashboard;