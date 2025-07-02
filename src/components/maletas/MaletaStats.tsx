import React from 'react';
import { Package, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface MaletaStatsProps {
  stats: {
    total: number;
    active: number;
    expired: number;
    nearExpiry: number;
    finalized: number;
    totalValue: number;
  };
}

const MaletaStats: React.FC<MaletaStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package className="w-8 h-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Ativas</p>
              <p className="text-2xl font-bold text-success">{stats.active}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Vencidas</p>
              <p className="text-2xl font-bold text-destructive">{stats.expired}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Próx. Vencimento</p>
              <p className="text-2xl font-bold text-warning">{stats.nearExpiry}</p>
            </div>
            <Clock className="w-8 h-8 text-warning" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold">R$ {stats.totalValue.toFixed(2)}</p>
            </div>
            <span className="text-2xl">💰</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MaletaStats;