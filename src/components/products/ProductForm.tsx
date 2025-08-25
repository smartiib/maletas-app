import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Product } from '@/services/woocommerce';
import { useSuppliers } from '@/hooks/useSuppliers';

const productSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  sku: z.string().optional(),
  regular_price: z.string().min(1, 'Preço é obrigatório'),
  sale_price: z.string().optional(),
  stock_quantity: z.number().min(0, 'Quantidade deve ser positiva'),
  status: z.enum(['draft', 'pending', 'private', 'publish']),
  description: z.string().optional(),
  short_description: z.string().optional(),
  stock_status: z.enum(['instock', 'outofstock', 'onbackorder']),
  supplier_id: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Partial<Product>;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, isLoading }) => {
  const { data: suppliers = [] } = useSuppliers();
  
  console.log('ProductForm - Received product data:', product);
  
  // Helper function to safely convert values
  const getDefaultValue = (value: any, fallback: any = '') => {
    return value !== undefined && value !== null ? String(value) : fallback;
  };

  const getSupplierIdFromProduct = () => {
    if (!product) return '';
    
    // Try to get supplier_id from meta_data
    const supplierMeta = (product as any)?.meta_data?.find((meta: any) => meta.key === 'supplier_id');
    if (supplierMeta?.value) {
      return String(supplierMeta.value);
    }
    
    // Try direct property
    if ((product as any)?.supplier_id) {
      return String((product as any).supplier_id);
    }
    
    return '';
  };
  
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: getDefaultValue(product?.name),
      sku: getDefaultValue(product?.sku),
      regular_price: getDefaultValue(product?.regular_price || product?.price),
      sale_price: getDefaultValue(product?.sale_price),
      stock_quantity: typeof product?.stock_quantity === 'number' ? product.stock_quantity : Number(product?.stock_quantity) || 0,
      status: (product?.status as 'draft' | 'pending' | 'private' | 'publish') || 'draft',
      description: getDefaultValue(product?.description),
      short_description: getDefaultValue(product?.short_description),
      stock_status: (product?.stock_status as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
      supplier_id: getSupplierIdFromProduct(),
    },
  });

  React.useEffect(() => {
    if (product) {
      console.log('ProductForm - Updating form values with product:', product);
      
      form.reset({
        name: getDefaultValue(product.name),
        sku: getDefaultValue(product.sku),
        regular_price: getDefaultValue(product.regular_price || product.price),
        sale_price: getDefaultValue(product.sale_price),
        stock_quantity: typeof product.stock_quantity === 'number' ? product.stock_quantity : Number(product.stock_quantity) || 0,
        status: (product.status as 'draft' | 'pending' | 'private' | 'publish') || 'draft',
        description: getDefaultValue(product.description),
        short_description: getDefaultValue(product.short_description),
        stock_status: (product.stock_status as 'instock' | 'outofstock' | 'onbackorder') || 'instock',
        supplier_id: getSupplierIdFromProduct(),
      });
    }
  }, [product, form]);

  const handleSubmit = (data: ProductFormData) => {
    console.log('ProductForm - Submitting data:', data);
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome do Produto *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome do produto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="SKU do produto" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="regular_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço Regular *</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sale_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço de Promoção</FormLabel>
                <FormControl>
                  <Input {...field} type="number" step="0.01" placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="stock_quantity"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Quantidade em Estoque</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Estoque</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="instock">Em Estoque</SelectItem>
                    <SelectItem value="outofstock">Sem Estoque</SelectItem>
                    <SelectItem value="onbackorder">Em Reposição</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status do Produto</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="draft">Rascunho</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="publish">Publicado</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="short_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Curta</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição curta do produto" rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição Completa</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Descrição completa do produto" rows={5} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading} className="bg-gradient-primary hover:opacity-90">
            {isLoading ? 'Salvando...' : 'Salvar Produto'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
