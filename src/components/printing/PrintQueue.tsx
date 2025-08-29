
import React, { useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { usePrintService } from '@/hooks/usePrintService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Play, 
  Pause, 
  Trash2, 
  RefreshCw, 
  Printer, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle
} from 'lucide-react';

export const PrintQueue: React.FC = () => {
  const { 
    loading, 
    printQueue, 
    loadPrintQueue, 
    processQueue 
  } = usePrintService();

  useEffect(() => {
    loadPrintQueue();
  }, [loadPrintQueue]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'processing': return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'cancelled': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-blue-100 text-blue-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const pendingJobs = printQueue.filter(job => job.status === 'pending').length;
  const processingJobs = printQueue.filter(job => job.status === 'processing').length;
  const completedJobs = printQueue.filter(job => job.status === 'completed').length;
  const failedJobs = printQueue.filter(job => job.status === 'failed').length;

  const totalJobs = printQueue.length;
  const completionRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <p className="text-sm font-medium">Pendentes</p>
                <p className="text-2xl font-bold">{pendingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-4 w-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">Processando</p>
                <p className="text-2xl font-bold">{processingJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div>
                <p className="text-sm font-medium">Concluídos</p>
                <p className="text-2xl font-bold">{completedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <div>
                <p className="text-sm font-medium">Falharam</p>
                <p className="text-2xl font-bold">{failedJobs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progresso Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Fila de Impressão
          </CardTitle>
          <CardDescription>
            Gerenciar jobs de impressão e processar fila
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Progresso geral: {completedJobs}/{totalJobs} jobs
                </p>
                <Progress value={completionRate} className="w-full mt-2" />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={loadPrintQueue}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
                <Button
                  onClick={processQueue}
                  disabled={loading || pendingJobs === 0}
                  size="sm"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Processar Fila
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Jobs */}
      <Card>
        <CardHeader>
          <CardTitle>Jobs na Fila ({printQueue.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            {printQueue.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Printer className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum job na fila de impressão</p>
              </div>
            ) : (
              <div className="space-y-3">
                {printQueue.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getStatusIcon(job.status)}
                          <h4 className="font-medium capitalize">
                            {job.template_type.replace('_', ' ')}
                          </h4>
                          <Badge 
                            variant="secondary" 
                            className={getStatusColor(job.status)}
                          >
                            {job.status}
                          </Badge>
                          {job.priority > 0 && (
                            <Badge variant="destructive">
                              Prioridade {job.priority}
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Criado {formatDistanceToNow(new Date(job.created_at), { 
                              addSuffix: true, 
                              locale: ptBR 
                            })}
                          </p>
                          {job.quantity > 1 && (
                            <p>Quantidade: {job.quantity}</p>
                          )}
                          {job.error_message && (
                            <p className="text-red-600 font-medium">
                              Erro: {job.error_message}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        {job.status === 'pending' && (
                          <Button variant="outline" size="sm">
                            <Pause className="h-3 w-3" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {job.status === 'processing' && (
                      <div className="mt-3">
                        <div className="flex items-center gap-2">
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          <span className="text-xs">Processando...</span>
                        </div>
                        <Progress value={50} className="w-full mt-1 h-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
