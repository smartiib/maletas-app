-- Criar tabela para modelos de PDF
CREATE TABLE public.pdf_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('romaneio', 'etiqueta', 'relatorio')),
  format TEXT NOT NULL CHECK (format IN ('A4', 'thermal_80mm', 'thermal_58mm')),
  html_template TEXT NOT NULL,
  css_styles TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pdf_templates ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações (como as outras tabelas do projeto)
CREATE POLICY "Allow all operations on pdf_templates" 
ON public.pdf_templates 
FOR ALL 
USING (true);

-- Trigger para atualizar timestamp
CREATE TRIGGER update_pdf_templates_updated_at
  BEFORE UPDATE ON public.pdf_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir template padrão para romaneio de maleta
INSERT INTO public.pdf_templates (name, type, format, html_template, css_styles, is_default) VALUES (
  'Romaneio Padrão - Maleta',
  'romaneio',
  'A4',
  '<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Romaneio #{{maleta_number}}</title>
</head>
<body>
  <div class="header">
    <h1>ROMANEIO DE MALETA</h1>
    <h2>Maleta #{{maleta_number}}</h2>
  </div>
  
  <div class="info-section">
    <div class="consultant-info">
      <h3>Consultor(a):</h3>
      <p><strong>{{representative_name}}</strong></p>
      <p>E-mail: {{representative_email}}</p>
      <p>WhatsApp: {{representative_phone}}</p>
      <p>Data Início: {{departure_date}}</p>
      <p>Data Devolução: {{return_date}}</p>
    </div>
    
    <div class="company-info">
      <h3>Riê Joias</h3>
      <p>(11) 99116-0623 - contato@userie.com.br</p>
      <p>Rua Pedro Calmon, 61 - Bela Vista</p>
      <p>Santo André - SP - CEP: 09040-140</p>
      <p>54.740.743/0001-27</p>
      <p>Instagram: @riejoias</p>
    </div>
  </div>
  
  <div class="products-table">
    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Código</th>
          <th>Descrição</th>
          <th>Quantidade</th>
          <th>Valor</th>
        </tr>
      </thead>
      <tbody>
        {{#each items}}
        <tr>
          <td>{{@index}}</td>
          <td>{{sku}}</td>
          <td>{{name}}</td>
          <td>{{quantity}}</td>
          <td>R$ {{price}}</td>
        </tr>
        {{/each}}
      </tbody>
    </table>
  </div>
  
  <div class="totals">
    <p><strong>Valor total da maleta: R$ {{total_value}}</strong></p>
    <p><strong>Quantidade total de produtos: {{total_items}}</strong></p>
  </div>
  
  <div class="commission-info">
    <h3>Comissão de vendas</h3>
    {{#if commission_tiers}}
      {{#each commission_tiers}}
      <p>{{label}}: De R$ {{min_amount}},00 a R$ {{max_amount}} = {{percentage}}% + R$ {{bonus}},00</p>
      {{/each}}
    {{else}}
      <p>Comissão personalizada: {{commission_percentage}}%</p>
    {{/if}}
  </div>
  
  <div class="bonus-info">
    <div class="bonus-special">
      <h4>Bônus especial</h4>
      <p>A revendedora que alcançar o primeiro lugar no mês poderá escolher</p>
      <p>qualquer peça da loja. A pessoa precisa vender mais que R$1.000,00</p>
      <p>para ter o benefício!</p>
    </div>
    
    <div class="referral-info">
      <h4>Indicação de revendedoras</h4>
      <p>Quem indicar uma nova revendedora e ficar responsável por ela ganhará 10%</p>
      <p>sobre as vendas que ela fizer. Essa é uma ótima oportunidade para aumentar</p>
      <p>seus ganhos!</p>
    </div>
  </div>
  
  <div class="footer">
    <p>{{current_date}}</p>
    <div class="signature">
      <div class="signature-line"></div>
      <p>{{representative_name}}</p>
    </div>
  </div>
</body>
</html>',
  'body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.4; }
.header { text-align: center; margin-bottom: 30px; }
.header h1 { font-size: 20px; font-weight: bold; margin: 0; }
.header h2 { font-size: 16px; margin: 10px 0; }
.info-section { display: flex; justify-content: space-between; margin-bottom: 30px; }
.consultant-info, .company-info { width: 48%; }
.consultant-info h3, .company-info h3 { font-size: 12px; font-weight: bold; margin-bottom: 10px; }
.consultant-info p, .company-info p { font-size: 12px; margin: 3px 0; }
.products-table { margin-bottom: 20px; }
.products-table table { width: 100%; border-collapse: collapse; }
.products-table th, .products-table td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 10px; }
.products-table th { background-color: #428bca; color: white; font-weight: bold; }
.totals { margin-bottom: 20px; }
.totals p { font-size: 12px; font-weight: bold; }
.commission-info { margin-bottom: 20px; }
.commission-info h3 { font-size: 10px; font-weight: bold; margin-bottom: 10px; }
.commission-info p { font-size: 10px; margin: 5px 0; }
.bonus-info { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 8px; }
.bonus-special, .referral-info { width: 48%; }
.bonus-special h4, .referral-info h4 { font-weight: bold; margin-bottom: 5px; }
.footer { text-align: center; margin-top: 40px; }
.footer p { font-size: 8px; }
.signature { margin-top: 20px; }
.signature-line { width: 200px; height: 1px; background-color: black; margin: 0 auto 5px; }
.signature p { font-size: 8px; }',
  true
);