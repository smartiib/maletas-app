import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Users, Mail, Eye, Cake } from "lucide-react";
import { useEmail } from "@/hooks/useEmail";
import { toast } from "@/hooks/use-toast";
import { getBirthdayInfo } from "@/utils/dateUtils";

interface BirthdayCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customers: any[];
}

export const BirthdayCampaignDialog = ({
  open,
  onOpenChange,
  customers
}: BirthdayCampaignDialogProps) => {
  const { sendEmail, isLoading } = useEmail();
  
  const [emailSubject, setEmailSubject] = useState("🎉 Feliz Aniversário! Oferta Especial Só Para Você!");
  const [emailContent, setEmailContent] = useState(`Olá {{NOME}}!

🎂 Hoje é um dia muito especial para nós - é o seu aniversário! 🎈

Queremos parabenizá-lo(a) {{IDADE_TEXT}} e agradecer por ser nosso cliente especial. Para comemorar este momento único, preparamos uma oferta exclusiva só para você:

🎁 **OFERTA ESPECIAL DE ANIVERSÁRIO** 🎁
• Desconto especial em sua próxima compra
• Frete grátis para qualquer pedido
• Atendimento prioritário

Entre em contato conosco para ativar sua oferta especial!

Com carinho,
Equipe {{EMPRESA}}

---
Esta é uma promoção especial de aniversário válida apenas para você.`);

  const processedCustomers = customers.map(customer => {
    const birthdayInfo = getBirthdayInfo(customer);
    const name = customer.first_name && customer.last_name 
      ? `${customer.first_name} ${customer.last_name}`.trim()
      : customer.first_name || customer.last_name || 'Cliente';
    
    return {
      ...customer,
      birthdayInfo,
      displayName: name
    };
  });

  const generatePersonalizedContent = (customer: any) => {
    const birthdayInfo = getBirthdayInfo(customer);
    const ageText = birthdayInfo.age 
      ? `pelos seus ${birthdayInfo.age} anos` 
      : 'por mais um ano de vida';
    
    return emailContent
      .replace(/{{NOME}}/g, customer.displayName)
      .replace(/{{IDADE_TEXT}}/g, ageText)
      .replace(/{{EMPRESA}}/g, window.location.hostname);
  };

  const sendCampaign = async () => {
    try {
      for (const customer of processedCustomers) {
        const personalizedSubject = emailSubject.replace(/{{NOME}}/g, customer.displayName);
        const personalizedContent = generatePersonalizedContent(customer);
        
        await sendEmail({
          to: customer.email,
          subject: personalizedSubject,
          text: personalizedContent,
          html: personalizedContent.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        });
        
        // Pequeno delay para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      toast({
        title: "Campanha enviada!",
        description: `E-mails de aniversário enviados para ${processedCustomers.length} clientes`,
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Erro ao enviar campanha:', error);
      toast({
        title: "Erro",
        description: "Erro ao enviar a campanha de aniversário",
        variant: "destructive",
      });
    }
  };

  const previewCustomer = processedCustomers[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Cake className="h-5 w-5 text-pink-600" />
            Campanha de Aniversário
          </DialogTitle>
          <DialogDescription>
            Envie parabéns personalizados para {customers.length} cliente{customers.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="compose" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customers">
              <Users className="h-4 w-4 mr-2" />
              Clientes ({customers.length})
            </TabsTrigger>
            <TabsTrigger value="compose">
              <Mail className="h-4 w-4 mr-2" />
              Compor Email
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="customers" className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary" className="text-pink-600">
                {customers.length} cliente{customers.length !== 1 ? 's' : ''} selecionado{customers.length !== 1 ? 's' : ''}
              </Badge>
            </div>
            
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {processedCustomers.map((customer) => (
                  <Card key={customer.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{customer.displayName}</div>
                          <div className="text-sm text-muted-foreground">{customer.email}</div>
                        </div>
                        <div className="text-right">
                          {customer.birthdayInfo.age && (
                            <Badge variant="outline">{customer.birthdayInfo.age} anos</Badge>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            {customer.birthdayInfo.formatted}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="compose" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="subject">Assunto do Email</Label>
                <Input
                  id="subject"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Assunto do email..."
                />
              </div>
              
              <div>
                <Label htmlFor="content">Conteúdo do Email</Label>
                <Textarea
                  id="content"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  rows={12}
                  placeholder="Conteúdo do email..."
                />
                <div className="text-xs text-muted-foreground mt-2">
                  Use variáveis: &#123;&#123;NOME&#125;&#125; para nome, &#123;&#123;IDADE_TEXT&#125;&#125; para idade, &#123;&#123;EMPRESA&#125;&#125; para nome da empresa
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            {previewCustomer && (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Preview para: <strong>{previewCustomer.displayName}</strong>
                </div>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">ASSUNTO:</Label>
                        <div className="font-medium">
                          {emailSubject.replace(/{{NOME}}/g, previewCustomer.displayName)}
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <Label className="text-xs text-muted-foreground">CONTEÚDO:</Label>
                        <div className="whitespace-pre-wrap text-sm">
                          {generatePersonalizedContent(previewCustomer)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={sendCampaign} 
            disabled={isLoading || customers.length === 0}
            className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
          >
            <Send className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : `Enviar para ${customers.length} cliente${customers.length !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};