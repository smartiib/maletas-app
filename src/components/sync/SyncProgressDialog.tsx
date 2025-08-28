
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw, XCircle, Clock, Layers } from 'lucide-react';

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
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            <Layers className="h-3 w-3 mr-1" />
            Sincronizando
          </Badge>
        );
      case 'success':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Concluído</Badge>;
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Erro</Badge>;
      default:
        return <Badge variant="outline">Preparando</Badge>;
    }
  };

  const isMultiPass = syncType.includes('Multi-Pass');
  const estimatedTime = totalItems > 0 ? Math.ceil(totalItems / 25) * 0.5 : 0; // Rough estimate: 25 products per 30 seconds

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Sincronização {syncType}
          </DialogTitle>
          <DialogDescription>
            {isMultiPass 
              ? 'Processamento em múltiplas passadas com lotes menores para maior eficiência'
              : 'Acompanhe o progresso da sincronização dos dados do WooCommerce'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            {getStatusBadge()}
            <span className="text-sm text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>

          <Progress value={progress} className="h-3" />

          <div className="space-y-2">
            <div className="text-sm font-medium">{currentStep}</div>
            
            {totalItems > 0 && (
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>Processados: {itemsProcessed}</div>
                <div>Total: {totalItems}</div>
                {isMultiPass && estimatedTime > 0 && (
                  <>
                    <div>Lote: 25 produtos</div>
                    <div>Est.: ~{estimatedTime}min</div>
                  </>
                )}
              </div>
            )}

            {isMultiPass && status === 'syncing' && (
              <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded border">
                <Layers className="h-3 w-3 inline mr-1" />
                Estratégia multi-pass: Processamento em lotes menores para evitar timeouts
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
