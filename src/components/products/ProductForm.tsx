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
import { useWooCommerceFilteredCategories } from '@/hooks/useWooCommerceFiltered';
import { useProductVariations } from '@/hooks/useProductVariations';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

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
  category_id: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: Partial<Product>;
  onSubmit: (data: ProductFormData) => void;
  isLoading?: boolean;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, isLoading }) => {
  const { data: suppliers = [] } = useSuppliers();
  const { data: categories = [] } = useWooCommerceFilteredCategories();
  const { data: variations = [] } = useProductVariations(
    product?.type === 'variable' ? product.id : undefined
  );
  
  console.log('ProductForm - Received product data:', product);
  console.log('ProductForm - Categories:', categories);
  console.log('ProductForm - Variations:', variations);
  
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

  const getCategoryIdFromProduct = () => {
    if (!product) return '';
    
    // Get first category from categories array
    if (product.categories && product.categories.length > 0) {
      return String(product.categories[0].id);
    }
    
    return '';
  };

  const getProductImage = () => {
    if (!product?.images || product.images.length === 0) return null;
    return product.images[0];
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
      category_id: getCategoryIdFromProduct(),
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
        category_id: getCategoryIdFromProduct(),
      });
    }
  }, [product, form]);

  const handleSubmit = (data: ProductFormData) => {
    console.log('ProductForm - Submitting data:', data);
    onSubmit(data);
  };

  const productImage = getProductImage();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Product Image Section */}
        {productImage && (
          <div className="flex justify-center">
            <div className="relative w-32 h-32 bg-muted rounded-lg overflow-hidden">
              <img 
                src={productImage.src} 
                alt={productImage.alt || product?.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

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
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={String(category.id)}>
                        {category.name}
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
            name="supplier_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fornecedor</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o fornecedor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem
                        key={supplier.id}
                        value={String(supplier.id)}
                      >
                        {supplier.name}
                      </SelectItem>
                    ))}
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        {/* Variations Section */}
        {product?.type === 'variable' && variations.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-semibold">Variações do Produto</Label>
              <p className="text-sm text-muted-foreground">
                Este produto possui {variations.length} variações
              </p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {variations.map((variation) => {
                const attributes = variation.attributes ? 
                  (Array.isArray(variation.attributes) ? variation.attributes : 
                   (typeof variation.attributes === 'string' ? 
                    JSON.parse(variation.attributes) : [])) : [];
                
                return (
                  <div key={variation.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {variation.image ? (
                        <img 
                          src={variation.image.src || variation.image} 
                          alt="Variação"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">
                          SKU: {variation.sku || `Var-${variation.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {attributes.map((attr: any) => 
                            `${attr.name}: ${attr.option}`
                          ).join(', ') || 'Sem atributos'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {variation.stock_quantity || 0} un.
                      </Badge>
                      <Badge variant="secondary">
                        R$ {parseFloat(variation.price || variation.regular_price || '0').toFixed(2)}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
