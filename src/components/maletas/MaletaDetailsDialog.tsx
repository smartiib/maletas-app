import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Package, User, Calendar, FileText, Download, Image } from 'lucide-react';
import { Maleta } from '@/services/maletas';
// Removido import do pdfGenerator - agora usando pdfTemplates
import { PdfTemplateService } from '@/services/pdfTemplates';
import { supabase } from '@/integrations/supabase/client';

interface MaletaDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maleta: Maleta | null;
}

const MaletaDetailsDialog: React.FC<MaletaDetailsDialogProps> = ({
  open,
  onOpenChange,
  maleta
}) => {
  const [representativeData, setRepresentativeData] = React.useState<any>(null);
  const [productImages, setProductImages] = React.useState<{[key: number]: string}>({});

  React.useEffect(() => {
    const fetchRepresentativeData = async () => {
      if (maleta?.representative_id) {
        try {
          const { data, error } = await supabase
            .from('representatives')
            .select('name, email, phone')
            .eq('id', maleta.representative_id)
            .single();
          
          if (!error && data) {
            setRepresentativeData(data);
          }
        } catch (error) {
          console.error('Erro ao buscar dados do representante:', error);
        }
      }
    };

    const fetchProductImages = async () => {
      if (maleta?.items) {
        try {
          const { wooCommerceAPI } = await import('@/services/woocommerce');
          const config = wooCommerceAPI.getConfig();
          
          if (!config) {
            console.log('WooCommerce não configurado - não será possível carregar imagens');
            return;
          }
          
          console.log('Carregando imagens dos produtos...');
          const imagePromises = maleta.items.map(async (item) => {
            try {
              const product = await wooCommerceAPI.getProduct(item.product_id);
              
              if (product.images && product.images.length > 0) {
                console.log(`Imagem encontrada para produto ${item.product_id}:`, product.images[0].src);
                return { id: item.product_id, image: product.images[0].src };
              }
            } catch (error) {
              console.error(`Erro ao buscar imagem do produto ${item.product_id}:`, error);
            }
            return { id: item.product_id, image: null };
          });

          const results = await Promise.all(imagePromises);
          const imagesMap = results.reduce((acc, { id, image }) => {
            if (image) acc[id] = image;
            return acc;
          }, {} as {[key: number]: string});
          
          console.log('Imagens carregadas:', imagesMap);
          setProductImages(imagesMap);
        } catch (error) {
          console.error('Erro geral ao buscar imagens:', error);
        }
      }
    };

    fetchRepresentativeData();
    fetchProductImages();
  }, [maleta?.representative_id, maleta?.items]);

  if (!maleta) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'expired': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'finalized': return 'bg-muted text-muted-foreground border-border';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Ativa';
      case 'expired': return 'Expirada';
      case 'finalized': return 'Finalizada';
      default: return status;
    }
  };

  const handleGeneratePDF = async () => {
    try {
      console.log('Gerando PDF para maleta:', maleta.id);
      const pdfData = await PdfTemplateService.generatePdf(maleta.id, 'romaneio');
      
      // Verificar se pdfData é um ArrayBuffer ou já um Blob
      let blob: Blob;
      if (pdfData instanceof ArrayBuffer) {
        blob = new Blob([pdfData], { type: 'application/pdf' });
      } else if (pdfData instanceof Uint8Array) {
        blob = new Blob([pdfData], { type: 'application/pdf' });
      } else {
        // Se for outro tipo, tentar converter
        blob = new Blob([pdfData], { type: 'application/pdf' });
      }
      
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `Maleta-${maleta.number}-Romaneio.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      
      console.log('PDF gerado e baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  const daysUntilReturn = Math.ceil(
    (new Date(maleta.return_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Maleta #{maleta.number}
            </DialogTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleGeneratePDF}>
                <Download className="w-4 h-4 mr-2" />
                PDF Romaneio
              </Button>
              <Badge className={getStatusColor(maleta.status)}>
                {getStatusLabel(maleta.status)}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Dados do Representante */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Representante</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Nome:</span>
                  <p className="font-medium">{maleta.representative_name}</p>
                </div>
                {representativeData?.email && (
                  <div>
                    <span className="text-sm text-muted-foreground">E-mail:</span>
                    <p className="text-sm">{representativeData.email}</p>
                  </div>
                )}
                {representativeData?.phone && (
                  <div>
                    <span className="text-sm text-muted-foreground">Telefone:</span>
                    <p className="text-sm">{representativeData.phone}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dados Temporais */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Prazos</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2">
                <div>
                  <span className="text-sm text-muted-foreground">Data de Saída:</span>
                  <p className="font-medium">
                    {new Date(maleta.departure_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Data de Devolução:</span>
                  <p className="font-medium">
                    {new Date(maleta.return_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Dias restantes:</span>
                  <p className={`font-medium ${daysUntilReturn < 0 ? 'text-destructive' : daysUntilReturn <= 3 ? 'text-warning' : 'text-success'}`}>
                    {daysUntilReturn < 0 ? `${Math.abs(daysUntilReturn)} dias em atraso` : `${daysUntilReturn} dias`}
                  </p>
                </div>
                {maleta.extended_date && (
                  <div>
                    <span className="text-sm text-muted-foreground">Data Estendida:</span>
                    <p className="font-medium text-orange-600">
                      {new Date(maleta.extended_date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Produtos da Maleta */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Produtos ({maleta.items.length} itens)</h3>
            </div>
            
            <div className="border rounded-lg overflow-hidden overflow-x-auto">
              <div className="bg-muted/30 p-3 grid grid-cols-12 gap-3 text-sm font-medium border-b min-w-[800px]">
                <div className="col-span-1">IMG</div>
                <div className="col-span-2">SKU</div>
                <div className="col-span-4">Produto</div>
                <div className="col-span-1">Qtd</div>
                <div className="col-span-2">Valor Unit.</div>
                <div className="col-span-2">Status</div>
              </div>
              
              <div className="divide-y">
                {maleta.items.map((item) => (
                  <div key={item.id} className="p-3 grid grid-cols-12 gap-3 text-sm min-w-[800px]">
                    <div className="col-span-1">
                      {productImages[item.product_id] ? (
                        <img 
                          src={productImages[item.product_id]} 
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-lg"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-10 h-10 bg-muted rounded-lg flex items-center justify-center ${productImages[item.product_id] ? 'hidden' : ''}`}>
                        <Image className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="col-span-2 font-mono text-xs">{item.sku}</div>
                    <div className="col-span-4">
                      <p className="font-medium">{item.name}</p>
                      {item.variation_attributes && item.variation_attributes.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {item.variation_attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')}
                        </p>
                      )}
                    </div>
                    <div className="col-span-1">{item.quantity}</div>
                    <div className="col-span-2 font-medium">R$ {parseFloat(item.price).toFixed(2)}</div>
                    <div className="col-span-2">
                      <Badge 
                        variant="outline" 
                        className={
                          item.status === 'sold' ? 'bg-success/10 text-success border-success/20' :
                          item.status === 'returned' ? 'bg-muted text-muted-foreground border-border' :
                          'bg-warning/10 text-warning border-warning/20'
                        }
                      >
                        {item.status === 'sold' ? 'Vendido' : 
                         item.status === 'returned' ? 'Devolvido' : 
                         'Consignado'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Itens</p>
                  <p className="text-2xl font-bold text-primary">
                    {maleta.items.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="text-2xl font-bold text-success">
                    R$ {parseFloat(maleta.total_value).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Comissão Estimada</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {maleta.commission_percentage ? `${maleta.commission_percentage}%` : 'Global'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações de Comissão */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Configurações de Comissão</h3>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Tipo:</span>
                <p className="font-medium">
                  {maleta.commission_settings.use_global ? 'Comissão Global' : 'Comissão Personalizada'}
                </p>
              </div>
              
              {!maleta.commission_settings.use_global && (
                <div>
                  <span className="text-sm text-muted-foreground">Percentual:</span>
                  <p className="font-medium">{maleta.commission_percentage}%</p>
                </div>
              )}
              
              <div>
                <span className="text-sm text-muted-foreground">Taxa de Penalidade:</span>
                <p className="font-medium">{maleta.commission_settings.penalty_rate}% por dia de atraso</p>
              </div>
              
              {maleta.commission_settings.use_global && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Tiers de Comissão:</span>
                  <div className="space-y-1">
                    {maleta.commission_settings.tiers.map((tier, index) => (
                      <div key={index} className="text-xs bg-white dark:bg-slate-700 p-2 rounded border">
                        <span className="font-medium">{tier.label}:</span>
                        <span className="ml-2">
                          R$ {tier.min_amount}{tier.max_amount ? ` - R$ ${tier.max_amount}` : '+'} 
                          → {tier.percentage}% + R$ {tier.bonus}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Informações do Pedido */}
          {maleta.status === 'finalized' && (maleta.order_number || maleta.order_url) && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Informações do Pedido</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-3">
                {maleta.order_number && (
                  <div>
                    <span className="text-sm text-muted-foreground">Número do Pedido:</span>
                    <p className="font-semibold text-success">#{maleta.order_number}</p>
                  </div>
                )}
                {maleta.order_url && (
                  <div>
                    <span className="text-sm text-muted-foreground">Link do Pedido:</span>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(maleta.order_url, '_blank')}
                        className="h-8 text-xs"
                      >
                        Ver Pedido #{maleta.order_number}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações */}
          {maleta.notes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">Observações</h3>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-wrap">{maleta.notes}</p>
              </div>
            </div>
          )}

          {/* Histórico */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Histórico</h3>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Criada em:</span>
                <span className="ml-2">{new Date(maleta.created_at).toLocaleString('pt-BR')}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Última atualização:</span>
                <span className="ml-2">{new Date(maleta.updated_at).toLocaleString('pt-BR')}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaletaDetailsDialog;