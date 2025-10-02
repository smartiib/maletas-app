
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, RefreshCw, XCircle, Clock, Layers, AlertTriangle } from 'lucide-react';

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
  // Auto-fechar modal após sucesso completo
  useEffect(() => {
    if (status === 'success' && progress === 100 && itemsProcessed === totalItems && totalItems > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [status, progress, itemsProcessed, totalItems, onClose]);
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
    const hasErrors = totalItems > 0 && itemsProcessed < totalItems && status === 'success';
    
    if (hasErrors) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Parcial
        </Badge>
      );
    }
    
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
  const estimatedTime = totalItems > 0 ? Math.ceil(totalItems / 25) * 0.5 : 0;
  const hasErrors = totalItems > 0 && itemsProcessed < totalItems && (status === 'success' || status === 'error');
  const successRate = totalItems > 0 ? Math.round((itemsProcessed / totalItems) * 100) : 0;

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
                {hasErrors && (
                  <>
                    <div className="col-span-2 text-yellow-600 font-medium">
                      Falharam: {totalItems - itemsProcessed} ({100 - successRate}%)
                    </div>
                  </>
                )}
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
            
            {hasErrors && status === 'success' && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border">
                <AlertTriangle className="h-3 w-3 inline mr-1" />
                Sincronização incompleta: {totalItems - itemsProcessed} produtos não foram sincronizados
              </div>
            )}
            
            {errorMessage && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded border">
                {errorMessage}
              </div>
            )}

            {status === 'success' && !hasErrors && progress === 100 && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded border text-center">
                ✅ Fechando automaticamente em 3 segundos...
              </div>
            )}
          </div>

          {(status === 'success' || status === 'error') && (
            <div className="flex gap-2">
              <Button 
                onClick={onClose} 
                className="flex-1"
                variant={hasErrors ? "outline" : "default"}
              >
                Fechar
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
