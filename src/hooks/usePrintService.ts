
import { useState, useCallback } from 'react';
import { printService } from '@/services/printing/PrintService';
import { PrintTemplate, PrintJob, PrinterConfiguration, TemplateType } from '@/types/printing';
import { toast } from 'sonner';

export const usePrintService = () => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [printQueue, setPrintQueue] = useState<PrintJob[]>([]);
  const [printerConfigs, setPrinterConfigs] = useState<PrinterConfiguration[]>([]);

  /**
   * Imprimir documento
   */
  const print = useCallback(async (
    templateType: TemplateType, 
    data: Record<string, any>,
    options?: {
      template?: PrintTemplate;
      quantity?: number;
      priority?: number;
    }
  ) => {
    setLoading(true);
    try {
      const result = await printService.print(templateType, {
        data,
        template: options?.template,
        quantity: options?.quantity,
        priority: options?.priority
      });

      if (result.includes('PDF gerado')) {
        toast.success('PDF gerado com sucesso!');
      } else {
        toast.success('Documento adicionado à fila de impressão!');
      }

      // Atualizar fila após adicionar job
      await loadPrintQueue();
      
      return result;
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error(`Erro ao imprimir: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar templates
   */
  const loadTemplates = useCallback(async (templateType?: TemplateType) => {
    setLoading(true);
    try {
      const data = await printService.getTemplates(templateType);
      setTemplates(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      toast.error('Erro ao carregar templates');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Carregar fila de impressão
   */
  const loadPrintQueue = useCallback(async () => {
    try {
      const data = await printService.getPrintQueue();
      setPrintQueue(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar fila de impressão:', error);
      return [];
    }
  }, []);

  /**
   * Carregar configurações de impressora
   */
  const loadPrinterConfigs = useCallback(async () => {
    try {
      const data = await printService.getPrinterConfigurations();
      setPrinterConfigs(data);
      return data;
    } catch (error) {
      console.error('Erro ao carregar configurações de impressora:', error);
      return [];
    }
  }, []);

  /**
   * Processar fila de impressão
   */
  const processQueue = useCallback(async () => {
    setLoading(true);
    try {
      await printService.processQueue();
      toast.success('Fila processada com sucesso!');
      await loadPrintQueue();
    } catch (error) {
      console.error('Erro ao processar fila:', error);
      toast.error('Erro ao processar fila de impressão');
    } finally {
      setLoading(false);
    }
  }, [loadPrintQueue]);

  /**
   * Buscar template padrão
   */
  const getDefaultTemplate = useCallback(async (templateType: TemplateType) => {
    try {
      return await printService.getDefaultTemplate(templateType);
    } catch (error) {
      console.error('Erro ao buscar template padrão:', error);
      return null;
    }
  }, []);

  return {
    // Estados
    loading,
    templates,
    printQueue,
    printerConfigs,

    // Métodos
    print,
    loadTemplates,
    loadPrintQueue,
    loadPrinterConfigs,
    processQueue,
    getDefaultTemplate
  };
};
