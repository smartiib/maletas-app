
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Printer, 
  Tag, 
  FileText, 
  Package,
  QrCode,
  BarChart3
} from 'lucide-react';

export const PrintingQuickAccess: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: 'Etiquetas de Produtos',
      description: 'Gerar etiquetas para produtos com códigos de barras',
      icon: Tag,
      action: () => navigate('/labels'),
      color: 'text-blue-600'
    },
    {
      title: 'Romaneios',
      description: 'Criar romaneios para representantes',
      icon: FileText,
      action: () => navigate('/maletas'), // Assumindo que romaneios estão na página de maletas
      color: 'text-green-600'
    },
    {
      title: 'Fila de Impressão',
      description: 'Ver jobs pendentes na fila',
      icon: Printer,
      action: () => navigate('/labels'), // Por enquanto vai para labels
      color: 'text-orange-600'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Printer className="h-5 w-5" />
          Opções de Impressão
        </CardTitle>
        <CardDescription>
          Acesso rápido às funcionalidades de impressão
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline" 
              className="h-auto p-4 flex flex-col items-center gap-2"
              onClick={action.action}
            >
              <action.icon className={`h-8 w-8 ${action.color}`} />
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
