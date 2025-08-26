
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, XCircle, Clock } from 'lucide-react';

interface SyncProgressProps {
  isOpen: boolean;
  onClose: () => void;
  syncType: string;
  status: 'idle' | 'syncing' | 'success' | 'error';
  progress: number;
  currentStep: string;
  itemsProcessed: number;
  totalItems: number;
  errorMessage?: string;
}

export const SyncProgressDialog: React.FC<SyncProgressProps> = ({
  isOpen,
  onClose,
  syncType,
  status,
  progress,
  currentStep,
  itemsProcessed,
  totalItems,
  errorMessage
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'syncing':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sincronizando</Badge>;
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">Preparando</Badge>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Sincronização {syncType}
          </DialogTitle>
          <DialogDescription>
            Acompanhe o progresso da sincronização dos dados do WooCommerce
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>

          <Progress value={progress} className="h-2" />

          <div className="space-y-2">
            <div className="text-sm font-medium">{currentStep}</div>
            
            {totalItems > 0 && (
              <div className="text-sm text-muted-foreground">
                {itemsProcessed} de {totalItems} itens processados
              </div>
            )}
            
            {errorMessage && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
