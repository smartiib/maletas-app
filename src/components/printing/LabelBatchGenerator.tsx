
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { labelGenerator, LabelGenerationOptions } from '@/services/printing/LabelGenerator';
import { Zap, Upload, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

interface BatchProgress {
  total: number;
  processed: number;
  current: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
}

export const LabelBatchGenerator: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<BatchProgress>({
    total: 0,
    processed: 0,
    current: '',
    status: 'idle'
  });

  const [batchOptions, setBatchOptions] = useState<Partial<LabelGenerationOptions>>({
    labelType: 'standard',
    format: 'A4',
    layout: '2x2',
    includeBarcode: true,
    includeQRCode: false,
    quantity: 1
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0];
    if (uploadedFile) {
      if (uploadedFile.type !== 'text/csv' && !uploadedFile.name.endsWith('.csv')) {
        toast.error('Por favor, selecione um arquivo CSV');
        return;
      }
      setFile(uploadedFile);
      toast.success('Arquivo carregado com sucesso');
    }
  };

  const processCSVFile = async (csvFile: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('Arquivo CSV deve conter pelo menos um cabeçalho e uma linha de dados'));
            return;
          }
          
          const headers = lines[0].split(',').map(h => h.trim());
          const products = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const product: any = { id: index + 1000 }; // ID temporário
            
            headers.forEach((header, i) => {
              const key = header.toLowerCase();
              switch (key) {
                case 'nome':
                case 'name':
                  product.name = values[i];
                  break;
                case 'sku':
                case 'codigo':
                  product.sku = values[i];
                  break;
                case 'preco':
                case 'price':
                  product.price = values[i];
                  break;
                case 'preco_original':
                case 'regular_price':
                  product.regular_price = values[i];
                  break;
                case 'preco_promocional':
                case 'sale_price':
                  product.sale_price = values[i];
                  break;
                case 'categoria':
                case 'category':
                  product.categories = [{ name: values[i] }];
                  break;
                case 'marca':
                case 'brand':
                  product.brand = values[i];
                  break;
                default:
                  product[key] = values[i];
              }
            });
            
            return product;
          });
          
          resolve(products);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo CSV'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsText(csvFile);
    });
  };

  const processBatch = async () => {
    if (!file) {
      toast.error('Selecione um arquivo CSV');
      return;
    }

    try {
      setProgress(prev => ({ ...prev, status: 'processing' }));
      
      // Processar arquivo CSV
      const products = await processCSVFile(file);
      
      setProgress(prev => ({ 
        ...prev, 
        total: products.length,
        processed: 0,
        current: 'Iniciando processamento...'
      }));

      const options: LabelGenerationOptions = {
        ...batchOptions,
        products
      } as LabelGenerationOptions;

      // Validar opções
      const validation = labelGenerator.validateLabelOptions(options);
      if (!validation.isValid) {
        toast.error(`Erro de validação: ${validation.errors.join(', ')}`);
        setProgress(prev => ({ ...prev, status: 'error' }));
        return;
      }

      // Processar em lotes de 50 produtos
      const batchSize = 50;
      const jobIds: string[] = [];
      
      for (let i = 0; i < products.length; i += batchSize) {
        const batch = products.slice(i, i + batchSize);
        
        setProgress(prev => ({
          ...prev,
          processed: i,
          current: `Processando produtos ${i + 1}-${Math.min(i + batchSize, products.length)}...`
        }));

        const batchOptions: LabelGenerationOptions = {
          ...options,
          products: batch
        };

        const batchJobIds = await labelGenerator.generateBatch(batchOptions);
        jobIds.push(...batchJobIds);

        // Pequeno delay para não sobrecarregar o sistema
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setProgress(prev => ({
        ...prev,
        processed: products.length,
        current: 'Processamento concluído',
        status: 'completed'
      }));

      toast.success(`${jobIds.length} etiquetas adicionadas à fila de impressão`);

    } catch (error) {
      console.error('Erro no processamento em lote:', error);
      toast.error('Erro ao processar lote de etiquetas');
      setProgress(prev => ({ ...prev, status: 'error' }));
    }
  };

  const downloadTemplate = () => {
    const csvContent = `nome,sku,preco,preco_original,categoria,marca
Camiseta Básica,CAM001,29.90,35.90,Roupas,Marca A
Calça Jeans,CAL002,89.90,,Roupas,Marca B
Tênis Esportivo,TEN003,159.90,199.90,Calçados,Marca C`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-etiquetas.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Template CSV baixado');
  };

  const resetBatch = () => {
    setFile(null);
    setProgress({
      total: 0,
      processed: 0,
      current: '',
      status: 'idle'
    });
  };

  const progressPercentage = progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Geração em Lote
        </CardTitle>
        <CardDescription>
          Gere etiquetas em massa usando um arquivo CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload de Arquivo */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Arquivo CSV</Label>
            <Button
              onClick={downloadTemplate}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-3 w-3" />
              Baixar Template
            </Button>
          </div>

          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            {file ? (
              <div className="space-y-2">
                <FileText className="h-8 w-8 mx-auto text-green-600" />
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button
                  onClick={resetBatch}
                  variant="outline"
                  size="sm"
                >
                  Remover Arquivo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                <div>
                  <Label
                    htmlFor="csv-upload"
                    className="cursor-pointer text-primary hover:underline"
                  >
                    Clique aqui para selecionar um arquivo CSV
                  </Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Ou arraste e solte o arquivo aqui
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Configurações do Lote */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tipo de Etiqueta</Label>
            <Select
              value={batchOptions.labelType}
              onValueChange={(value: any) => 
                setBatchOptions(prev => ({ ...prev, labelType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Padrão</SelectItem>
                <SelectItem value="promotional">Promocional</SelectItem>
                <SelectItem value="zebra">Zebra</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <Select
              value={batchOptions.format}
              onValueChange={(value: any) => 
                setBatchOptions(prev => ({ ...prev, format: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="A4">A4</SelectItem>
                <SelectItem value="thermal_80mm">Térmica 80mm</SelectItem>
                <SelectItem value="thermal_58mm">Térmica 58mm</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Layout</Label>
            <Select
              value={batchOptions.layout}
              onValueChange={(value: any) => 
                setBatchOptions(prev => ({ ...prev, layout: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2x2">2 x 2 (4 etiquetas)</SelectItem>
                <SelectItem value="3x3">3 x 3 (9 etiquetas)</SelectItem>
                <SelectItem value="2x1">2 x 1 (2 etiquetas)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantidade por Produto</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={batchOptions.quantity}
              onChange={(e) => 
                setBatchOptions(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 1 
                }))
              }
            />
          </div>
        </div>

        {/* Progresso */}
        {progress.status !== 'idle' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Progresso do Processamento</Label>
              <Badge 
                variant={progress.status === 'completed' ? 'default' : 
                        progress.status === 'error' ? 'destructive' : 'secondary'}
              >
                {progress.status === 'processing' && 'Processando...'}
                {progress.status === 'completed' && 'Concluído'}
                {progress.status === 'error' && 'Erro'}
              </Badge>
            </div>
            
            <Progress value={progressPercentage} className="w-full" />
            
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{progress.current}</span>
              <span>{progress.processed}/{progress.total}</span>
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex justify-end gap-2">
          <Button
            onClick={processBatch}
            disabled={!file || progress.status === 'processing'}
            className="flex items-center gap-2"
          >
            <Zap className="h-4 w-4" />
            Processar Lote
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
