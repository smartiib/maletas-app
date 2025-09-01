
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { PrintTemplate, LabelData } from '@/types/printing';
import { toast } from 'sonner';

interface PrintItem {
  id: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  image?: string;
}

interface PrintHistory {
  id: string;
  product_id: number;
  product_name: string;
  product_sku: string;
  quantity: number;
  label_type: string;
  format: string;
  printed_at: string;
}

interface PrintSettings {
  labelType: 'standard' | 'promotional' | 'zebra' | 'maleta';
  format: 'A4' | '80mm' | '58mm' | '50x30mm' | '40x20mm' | 'custom';
  layout: '1x1' | '2x1' | '3x1' | '2x2' | '3x3' | 'custom';
  includeBarcode: boolean;
  includeQRCode: boolean;
  customSize?: {
    width: number;
    height: number;
    unit: 'mm' | 'cm' | 'in';
  };
  customLayout?: {
    rows: number;
    cols: number;
  };
}

export const useLabelPrinting = () => {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  const [printQueue, setPrintQueue] = useState<PrintItem[]>([]);
  const [settings, setSettings] = useState<PrintSettings>({
    labelType: 'standard',
    format: 'A4',
    layout: '2x2',
    includeBarcode: true,
    includeQRCode: false
  });
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);

  // Carregar configurações salvas
  useEffect(() => {
    const loadSavedSettings = async () => {
      if (!currentOrganization?.id) return;

      try {
        const { data } = await supabase
          .from('user_configurations')
          .select('config_data')
          .eq('config_type', 'label_print_settings')
          .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
          .single();

        if (data?.config_data) {
          setSettings(prev => ({ ...prev, ...data.config_data }));
        }
      } catch (error) {
        console.log('Nenhuma configuração salva encontrada');
      }
    };

    loadSavedSettings();
  }, [currentOrganization?.id]);

  // Salvar configurações
  const saveSettings = useCallback(async () => {
    if (!currentOrganization?.id) return;

    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) return;

      await supabase
        .from('user_configurations')
        .upsert({
          user_id: user.data.user.id,
          config_type: 'label_print_settings',
          config_data: settings,
          is_active: true
        }, {
          onConflict: 'user_id,config_type'
        });

      toast.success('Configurações salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    }
  }, [settings, currentOrganization?.id]);

  // Buscar histórico de impressão
  const { data: printHistory = [] } = useQuery({
    queryKey: ['label-print-history', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('label_print_history')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .gte('printed_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
        .order('printed_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar histórico:', error);
        return [];
      }

      return data as PrintHistory[];
    }
  });

  // Salvar histórico de impressão
  const savePrintHistoryMutation = useMutation({
    mutationFn: async (items: PrintItem[]) => {
      const historyData = items.map(item => ({
        product_id: item.id,
        product_name: item.name,
        product_sku: item.sku,
        quantity: item.quantity,
        label_type: settings.labelType,
        format: settings.format,
        organization_id: currentOrganization!.id
      }));

      const { error } = await supabase
        .from('label_print_history')
        .insert(historyData);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['label-print-history'] });
      toast.success('Histórico de impressão salvo');
    }
  });

  const addToQueue = useCallback((product: any, quantity: number = 1) => {
    const existingItem = printQueue.find(item => item.id === product.id);
    
    if (existingItem) {
      setPrintQueue(prev => 
        prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      const newItem: PrintItem = {
        id: product.id,
        name: product.name,
        sku: product.sku || `PROD-${product.id}`,
        price: product.price || product.sale_price || product.regular_price || '0',
        quantity: quantity,
        image: product.images?.[0]?.src
      };
      setPrintQueue(prev => [...prev, newItem]);
    }
  }, [printQueue]);

  const removeFromQueue = useCallback((productId: number) => {
    setPrintQueue(prev => prev.filter(item => item.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromQueue(productId);
      return;
    }
    
    setPrintQueue(prev => 
      prev.map(item => 
        item.id === productId 
          ? { ...item, quantity }
          : item
      )
    );
  }, [removeFromQueue]);

  const clearQueue = useCallback(() => {
    setPrintQueue([]);
  }, []);

  const isProductInQueue = useCallback((productId: number) => {
    return printQueue.some(item => item.id === productId);
  }, [printQueue]);

  const wasRecentlyPrinted = useCallback((productId: number) => {
    return printHistory.some(history => history.product_id === productId);
  }, [printHistory]);

  const getLastPrintDate = useCallback((productId: number) => {
    const lastPrint = printHistory.find(history => history.product_id === productId);
    return lastPrint ? new Date(lastPrint.printed_at) : null;
  }, [printHistory]);

  // Converter items da fila para dados de etiqueta
  const prepareLabelData = useCallback((): LabelData[] => {
    return printQueue.flatMap(item => 
      Array.from({ length: item.quantity }, () => ({
        product_id: item.id,
        name: item.name,
        sku: item.sku,
        price: parseFloat(item.price) || 0,
        barcode: settings.includeBarcode ? item.sku : undefined,
        qr_code: settings.includeQRCode ? JSON.stringify({
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: item.price
        }) : undefined
      }))
    );
  }, [printQueue, settings]);

  // Gerar preview HTML das etiquetas
  const generatePreview = useCallback((template: PrintTemplate | null): string => {
    if (!template) {
      return '<div>Nenhum template selecionado</div>';
    }

    const labelData = prepareLabelData();
    const { rows, cols } = getGridLayout(settings.layout);
    const labelsPerPage = rows * cols;
    const totalPages = Math.ceil(labelData.length / labelsPerPage);

    let html = `
      <style>
        ${template.css_styles || ''}
        .page {
          page-break-after: always;
          width: ${settings.format === 'A4' ? '210mm' : '80mm'};
          min-height: ${settings.format === 'A4' ? '297mm' : '200mm'};
          display: grid;
          grid-template-rows: repeat(${rows}, 1fr);
          grid-template-columns: repeat(${cols}, 1fr);
          gap: 2mm;
          padding: 10mm;
        }
        .label-item {
          border: 1px solid #ddd;
        }
      </style>
    `;

    for (let page = 0; page < totalPages; page++) {
      const startIndex = page * labelsPerPage;
      const pageLabels = labelData.slice(startIndex, startIndex + labelsPerPage);
      
      html += '<div class="page">';
      
      for (let i = 0; i < labelsPerPage; i++) {
        const label = pageLabels[i];
        if (label) {
          const labelHtml = template.html_template
            .replace(/\{\{name\}\}/g, label.name)
            .replace(/\{\{sku\}\}/g, label.sku)
            .replace(/\{\{price\}\}/g, `R$ ${label.price.toFixed(2)}`)
            .replace(/\{\{barcode\}\}/g, label.barcode || '')
            .replace(/\{\{qr_code\}\}/g, label.qr_code || '');
          
          html += `<div class="label-item">${labelHtml}</div>`;
        } else {
          html += '<div class="label-item"></div>';
        }
      }
      
      html += '</div>';
    }

    return html;
  }, [prepareLabelData, settings]);

  // Gerar comandos ZPL para impressoras Zebra
  const generateZPL = useCallback((): string => {
    const labelData = prepareLabelData();
    
    let zplCommands = '';
    
    labelData.forEach((label, index) => {
      zplCommands += `
^XA
^CF0,30
^FO50,50^FD${truncateText(label.name, 20)}^FS
^CF0,20
^FO50,100^FDSKU: ${label.sku}^FS
^FO50,130^FDR$ ${label.price.toFixed(2)}^FS
${label.barcode ? `^FO50,160^BC^FD${label.barcode}^FS` : ''}
${label.qr_code ? `^FO200,200^BQ^FDMA,${label.qr_code}^FS` : ''}
^XZ
`;
    });
    
    return zplCommands.trim();
  }, [prepareLabelData]);

  // Função auxiliar para truncar texto
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  };

  // Função auxiliar para obter layout da grade
  const getGridLayout = (layout: string) => {
    if (layout === 'custom' && settings.customLayout) {
      return {
        rows: settings.customLayout.rows,
        cols: settings.customLayout.cols
      };
    }

    switch (layout) {
      case '1x1': return { rows: 1, cols: 1 };
      case '2x1': return { rows: 1, cols: 2 };
      case '3x1': return { rows: 1, cols: 3 };
      case '2x2': return { rows: 2, cols: 2 };
      case '3x3': return { rows: 3, cols: 3 };
      default: return { rows: 2, cols: 2 };
    }
  };

  const printLabels = useCallback(async () => {
    if (printQueue.length === 0) {
      toast.error('Nenhum produto na fila de impressão');
      return;
    }

    try {
      await savePrintHistoryMutation.mutateAsync(printQueue);
      clearQueue();
      toast.success(`${printQueue.length} etiquetas enviadas para impressão`);
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao processar impressão');
    }
  }, [printQueue, savePrintHistoryMutation, clearQueue]);

  return {
    printQueue,
    settings,
    printHistory,
    selectedTemplate,
    
    addToQueue,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    setSettings,
    setSelectedTemplate,
    printLabels,
    saveSettings,
    
    generatePreview,
    generateZPL,
    prepareLabelData,
    
    isProductInQueue,
    wasRecentlyPrinted,
    getLastPrintDate,
    
    queueCount: printQueue.length,
    totalQuantity: printQueue.reduce((total, item) => total + item.quantity, 0)
  };
};
