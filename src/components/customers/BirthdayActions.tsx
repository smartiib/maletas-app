import { Button } from "@/components/ui/button";
import { Mail, Send, Users } from "lucide-react";
import { useEmail } from "@/hooks/useEmail";
import { toast } from "@/hooks/use-toast";
import { getBirthdayInfo } from "@/utils/dateUtils";

interface BirthdayActionsProps {
  customer?: any;
  customers?: any[];
  onCampaignClick?: () => void;
  variant?: 'individual' | 'bulk';
}

export const BirthdayActions = ({ 
  customer, 
  customers = [], 
  onCampaignClick, 
  variant = 'individual' 
}: BirthdayActionsProps) => {
  const { sendEmail } = useEmail();

  const sendBirthdayEmail = async (targetCustomer: any) => {
    const birthdayInfo = getBirthdayInfo(targetCustomer);
    const customerName = targetCustomer.first_name && targetCustomer.last_name 
      ? `${targetCustomer.first_name} ${targetCustomer.last_name}`.trim()
      : targetCustomer.first_name || targetCustomer.last_name || 'Cliente';

    const subject = `🎉 Feliz Aniversário, ${customerName}!`;
    
    const emailTemplate = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e91e63; font-size: 32px; margin: 0;">🎉 Parabéns! 🎂</h1>
        </div>
        
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 30px; border-radius: 15px; margin-bottom: 20px;">
          <h2 style="color: #495057; margin-top: 0;">Olá, ${customerName}!</h2>
          
          <p style="font-size: 18px; color: #6c757d; line-height: 1.6;">
            Hoje é um dia muito especial! 🎈
          </p>
          
          <p style="font-size: 16px; color: #6c757d; line-height: 1.6;">
            Queremos desejar um <strong>Feliz Aniversário</strong> e agradecer por ser nosso cliente especial.
            ${birthdayInfo.age ? `Que seus ${birthdayInfo.age} anos sejam repletos de alegria, saúde e realizações!` : 'Que este novo ano de vida seja repleto de alegria, saúde e realizações!'}
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #e91e63; color: white; padding: 15px 30px; border-radius: 25px; display: inline-block; font-weight: bold; font-size: 18px;">
              🎁 Oferta Especial de Aniversário! 🎁
            </div>
          </div>
          
          <p style="font-size: 16px; color: #6c757d; line-height: 1.6; text-align: center;">
            Como presente, preparamos uma surpresa especial para você!<br>
            Entre em contato conosco para saber mais.
          </p>
        </div>
        
        <div style="text-align: center; color: #6c757d; font-size: 14px;">
          <p>Com carinho,<br><strong>Equipe ${window.location.hostname}</strong></p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        to: targetCustomer.email,
        subject,
        html: emailTemplate
      });

      toast({
        title: "Email enviado!",
        description: `Parabéns enviados para ${customerName}`,
      });
    } catch (error) {
      console.error('Erro ao enviar email:', error);
    }
  };

  if (variant === 'individual' && customer) {
    const birthdayInfo = getBirthdayInfo(customer);
    
    if (!birthdayInfo.date) return null;

    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => sendBirthdayEmail(customer)}
        className="text-pink-600 border-pink-200 hover:bg-pink-50 dark:text-pink-400 dark:border-pink-800 dark:hover:bg-pink-950"
      >
        <Mail className="h-3 w-3 mr-1" />
        Enviar Parabéns
      </Button>
    );
  }

  if (variant === 'bulk' && customers.length > 0) {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onCampaignClick}
          className="text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950"
        >
          <Users className="h-4 w-4 mr-2" />
          Campanha de Aniversário ({customers.length})
        </Button>
        
        <Button
          size="sm"
          onClick={async () => {
            for (const customer of customers) {
              await sendBirthdayEmail(customer);
              // Pequeno delay para não sobrecarregar
              await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            toast({
              title: "Campanhas enviadas!",
              description: `Parabéns enviados para ${customers.length} clientes`,
            });
          }}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar para Todos
        </Button>
      </div>
    );
  }

  return null;
};