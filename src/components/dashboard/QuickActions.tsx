import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileText, 
  Users, 
  Package, 
  Mail, 
  Download,
  Settings,
  Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmail } from '@/hooks/useEmail';
import { toast } from '@/hooks/use-toast';

const QuickActions = () => {
  const navigate = useNavigate();
  const { sendEmail, isLoading } = useEmail();

  const quickActions = [
    {
      title: 'Novo Pedido',
      description: 'Criar pedido manual',
      icon: Plus,
      action: () => navigate('/pos'),
      variant: 'default' as const,
      gradient: true
    },
    {
      title: 'Adicionar Produto',
      description: 'Cadastrar novo produto',
      icon: Package,
      action: () => navigate('/produtos'),
      variant: 'outline' as const
    },
    {
      title: 'Novo Cliente',
      description: 'Cadastrar cliente',
      icon: Users,
      action: () => navigate('/clientes'),
      variant: 'outline' as const
    },
    {
      title: 'Relatórios',
      description: 'Gerar relatórios',
      icon: FileText,
      action: () => navigate('/relatorios'),
      variant: 'outline' as const
    },
    {
      title: 'Enviar E-mail',
      description: 'Comunicação com clientes',
      icon: Mail,
      action: () => handleSendTestEmail(),
      variant: 'outline' as const,
      loading: isLoading
    },
    {
      title: 'Configurações',
      description: 'Ajustar sistema',
      icon: Settings,
      action: () => navigate('/configuracoes'),
      variant: 'outline' as const
    }
  ];

  const handleSendTestEmail = async () => {
    try {
      await sendEmail({
        to: 'admin@exemplo.com',
        subject: 'E-mail de Teste do Dashboard',
        html: '<h1>Teste de E-mail</h1><p>E-mail enviado com sucesso pelo dashboard!</p>',
        text: 'E-mail de teste enviado pelo dashboard!'
      });
    } catch (error) {
      console.error('Erro ao enviar e-mail de teste:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="w-5 h-5 mr-2 text-primary" />
          Ações Rápidas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                disabled={action.loading}
                className={`h-auto p-4 flex flex-col items-center text-center space-y-2 group hover:scale-105 transition-all-smooth ${
                  action.gradient 
                    ? 'bg-gradient-primary hover:opacity-90 text-white' 
                    : 'hover:border-primary hover:text-primary'
                }`}
              >
                <IconComponent className={`w-6 h-6 ${
                  action.gradient 
                    ? 'text-white' 
                    : 'text-slate-600 dark:text-slate-400 group-hover:text-primary'
                }`} />
                <div>
                  <p className={`font-medium text-sm ${
                    action.gradient 
                      ? 'text-white' 
                      : 'text-slate-900 dark:text-white group-hover:text-primary'
                  }`}>
                    {action.title}
                  </p>
                  <p className={`text-xs ${
                    action.gradient 
                      ? 'text-white/80' 
                      : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {action.description}
                  </p>
                </div>
                {action.loading && (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;