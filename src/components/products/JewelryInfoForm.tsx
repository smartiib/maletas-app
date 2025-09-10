import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Gem, Calculator, DollarSign, Package } from 'lucide-react';
import { ProductJewelryInfo } from '@/hooks/useProductJewelryInfo';
import { useSuppliers } from '@/hooks/useSuppliers';

const jewelrySchema = z.object({
  fornecedor_bruto: z.string().optional(),
  codigo_fornecedor_bruto: z.string().optional(),
  nome_galvanica: z.string().optional(),
  peso_peca: z.number().min(0).optional(),
  milesimo: z.number().min(0).optional(),
  valor_milesimo: z.number().min(0).optional(),
  custo_fixo: z.number().min(0).optional(),
  custo_bruto: z.number().min(0).optional(),
  custo_variavel: z.number().min(0).optional(),
  markup_desejado: z.number().min(0).optional(),
});

type JewelryFormData = z.infer<typeof jewelrySchema>;

interface JewelryInfoFormProps {
  productId: number;
  initialData?: ProductJewelryInfo | null;
  onDataChange?: (data: JewelryFormData & { custo_galvanica: number; custo_final: number; preco_venda_sugerido: number }) => void;
}

export const JewelryInfoForm: React.FC<JewelryInfoFormProps> = ({
  productId,
  initialData,
  onDataChange,
}) => {
  const { data: suppliers = [] } = useSuppliers();
  
  const form = useForm<JewelryFormData>({
    resolver: zodResolver(jewelrySchema),
    defaultValues: {
      fornecedor_bruto: initialData?.fornecedor_bruto || '',
      codigo_fornecedor_bruto: initialData?.codigo_fornecedor_bruto || '',
      nome_galvanica: initialData?.nome_galvanica || '',
      peso_peca: initialData?.peso_peca || 0,
      milesimo: initialData?.milesimo || 0,
      valor_milesimo: initialData?.valor_milesimo || 0,
      custo_fixo: initialData?.custo_fixo || 0,
      custo_bruto: initialData?.custo_bruto || 0,
      custo_variavel: initialData?.custo_variavel || 0,
      markup_desejado: initialData?.markup_desejado || 0,
    },
  });

  const watchedValues = form.watch();

  // Calculate derived values
  const custo_galvanica = (watchedValues.peso_peca || 0) * (watchedValues.valor_milesimo || 0);
  const custo_final = (watchedValues.custo_fixo || 0) + (watchedValues.custo_bruto || 0) + custo_galvanica + (watchedValues.custo_variavel || 0);
  const preco_venda_sugerido = custo_final + (custo_final * (watchedValues.markup_desejado || 0) / 100);

  // Notify parent component of data changes
  useEffect(() => {
    if (onDataChange) {
      onDataChange({
        ...watchedValues,
        custo_galvanica,
        custo_final,
        preco_venda_sugerido,
      });
    }
  }, [watchedValues, custo_galvanica, custo_final, preco_venda_sugerido, onDataChange]);

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        fornecedor_bruto: initialData.fornecedor_bruto || '',
        codigo_fornecedor_bruto: initialData.codigo_fornecedor_bruto || '',
        nome_galvanica: initialData.nome_galvanica || '',
        peso_peca: initialData.peso_peca || 0,
        milesimo: initialData.milesimo || 0,
        valor_milesimo: initialData.valor_milesimo || 0,
        custo_fixo: initialData.custo_fixo || 0,
        custo_bruto: initialData.custo_bruto || 0,
        custo_variavel: initialData.custo_variavel || 0,
        markup_desejado: initialData.markup_desejado || 0,
      });
    }
  }, [initialData, form]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Gem className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Informações de Joias</h3>
        <Badge variant="outline">Produto #{productId}</Badge>
      </div>

      <Form {...form}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fornecedores */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Fornecedores
              </CardTitle>
              <CardDescription>
                Informações sobre os fornecedores do produto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="fornecedor_bruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Fornecedor Bruto</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um fornecedor" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="codigo_fornecedor_bruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código Fornecedor Bruto</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Código do fornecedor" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nome_galvanica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Galvânica (banho)</FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma galvânica" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.name}>
                              {supplier.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Banho */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-4 w-4" />
                Banho
              </CardTitle>
              <CardDescription>
                Especificações técnicas do banho
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="peso_peca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso da Peça (g)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.001"
                        placeholder="0.000"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="milesimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milésimo</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.001"
                        placeholder="0.000"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_milesimo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor do Milésimo (R$)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  Custo Banho (Calculado)
                </div>
                <div className="text-lg font-semibold">
                  R$ {custo_galvanica.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Peso da Peça × Valor do Milésimo
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Custos
              </CardTitle>
              <CardDescription>
                Breakdown detalhado dos custos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="custo_fixo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Fixo (embalagens e outros)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custo_bruto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custo Bruto</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="custo_variavel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custos Variáveis</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calculator className="h-4 w-4" />
                  Custo Final (Calculado)
                </div>
                <div className="text-lg font-semibold">
                  R$ {custo_final.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Fixo + Bruto + Banho + Variáveis
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Markup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Markup e Preço
              </CardTitle>
              <CardDescription>
                Cálculo do preço de venda sugerido
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="markup_desejado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Markup Desejado (%)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <DollarSign className="h-4 w-4" />
                  Preço de Venda Sugerido
                </div>
                <div className="text-xl font-bold text-primary">
                  R$ {preco_venda_sugerido.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Custo Final + ({watchedValues.markup_desejado || 0}% markup)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 bg-muted/50 rounded">
                  <div className="text-muted-foreground">Custo Final</div>
                  <div className="font-medium">R$ {custo_final.toFixed(2)}</div>
                </div>
                <div className="p-2 bg-muted/50 rounded">
                  <div className="text-muted-foreground">Markup</div>
                  <div className="font-medium">R$ {(preco_venda_sugerido - custo_final).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
};