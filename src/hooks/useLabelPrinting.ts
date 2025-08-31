
import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
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
  format: 'A4' | '80mm' | '58mm' | '50x30mm' | '40x20mm';
  layout: '1x1' | '2x1' | '3x1' | '2x2' | '3x3';
  includeBarcode: boolean;
  includeQRCode: boolean;
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

  // Buscar histórico de impressão
  const { data: printHistory = [] } = useQuery({
    queryKey: ['label-print-history', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('label_print_history')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .gte('printed_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()) // Últimos 3 dias
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

  const addToQueue = useCallback((product: any) => {
    const existingItem = printQueue.find(item => item.id === product.id);
    
    if (existingItem) {
      setPrintQueue(prev => 
        prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      const newItem: PrintItem = {
        id: product.id,
        name: product.name,
        sku: product.sku || `PROD-${product.id}`,
        price: product.price || product.sale_price || product.regular_price || '0',
        quantity: 1,
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

  const printLabels = useCallback(async () => {
    if (printQueue.length === 0) {
      toast.error('Nenhum produto na fila de impressão');
      return;
    }

    // Salvar no histórico
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
    // Estado
    printQueue,
    settings,
    printHistory,
    
    // Ações
    addToQueue,
    removeFromQueue,
    updateQuantity,
    clearQueue,
    setSettings,
    printLabels,
    
    // Verificações
    isProductInQueue,
    wasRecentlyPrinted,
    getLastPrintDate,
    
    // Totais
    queueCount: printQueue.length,
    totalQuantity: printQueue.reduce((total, item) => total + item.quantity, 0)
  };
};
