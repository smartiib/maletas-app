import React, { useState, useMemo } from 'react';
import { Plus, Search, Trash2, Package, Link as LinkIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAllProducts } from '@/hooks/useWooCommerce';
import {
  useSupplierProducts,
  useCreateProductSupplier,
  useDeleteProductSupplier,
  useUpdateProductSupplier,
} from '@/hooks/useSuppliers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ProductSuppliersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplier: any;
}

const ProductSuppliersDialog = ({ open, onOpenChange, supplier }: ProductSuppliersDialogProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [supplierSku, setSupplierSku] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [minimumOrder, setMinimumOrder] = useState('1');
  const [leadTime, setLeadTime] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const { toast } = useToast();
  const { data: allProducts = [] } = useAllProducts();
  const { data: supplierProducts = [], refetch } = useSupplierProducts(supplier?.id);
  const createProductSupplier = useCreateProductSupplier();
  const deleteProductSupplier = useDeleteProductSupplier();
  const updateProductSupplier = useUpdateProductSupplier();

  // Get products not yet linked to this supplier
  const availableProducts = useMemo(() => {
    const linkedProductIds = supplierProducts.map(sp => sp.product_id);
    return allProducts.filter(product => 
      !linkedProductIds.includes(product.id) &&
      product.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allProducts, supplierProducts, searchTerm]);

  // Get linked products with product details
  const linkedProducts = useMemo(() => {
    return supplierProducts.map((sp: any) => {
      const product = allProducts.find(p => p.id === sp.product_id);
      return {
        ...sp,
        product_name: product?.name || `Produto ID: ${sp.product_id}`,
        product_sku: product?.sku || '-',
        product_status: product?.status || 'unknown',
      };
    });
  }, [supplierProducts, allProducts]);

  const handleAddProduct = async () => {
    if (!selectedProductId) {
      toast({
        title: 'Erro',
        description: 'Selecione um produto.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createProductSupplier.mutateAsync({
        supplier_id: supplier.id,
        product_id: parseInt(selectedProductId),
        supplier_sku: supplierSku || null,
        cost_price: costPrice ? parseFloat(costPrice) : null,
        minimum_order_quantity: parseInt(minimumOrder),
        lead_time_days: leadTime ? parseInt(leadTime) : null,
        is_primary: isPrimary,
      });

      toast({
        title: 'Sucesso',
        description: 'Produto vinculado ao fornecedor com sucesso.',
      });

      // Reset form
      setSelectedProductId('');
      setSupplierSku('');
      setCostPrice('');
      setMinimumOrder('1');
      setLeadTime('');
      setIsPrimary(false);
      
      refetch();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao vincular produto ao fornecedor.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveProduct = async (id: string) => {
    if (window.confirm('Tem certeza que deseja desvincular este produto do fornecedor?')) {
      try {
        await deleteProductSupplier.mutateAsync(id);
        toast({
          title: 'Sucesso',
          description: 'Produto desvinculado do fornecedor.',
        });
        refetch();
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Erro ao desvincular produto.',
          variant: 'destructive',
        });
      }
    }
  };

  if (!supplier) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5" />
            Gerenciar Produtos - {supplier.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add Product Form */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Vincular Novo Produto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Produto *</Label>
                  <div className="space-y-2">
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id.toString()}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>SKU do Fornecedor</Label>
                  <Input
                    placeholder="SKU usado pelo fornecedor"
                    value={supplierSku}
                    onChange={(e) => setSupplierSku(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Preço de Custo</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Qtd. Mínima</Label>
                  <Input
                    type="number"
                    min="1"
                    value={minimumOrder}
                    onChange={(e) => setMinimumOrder(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Prazo de Entrega (dias)</Label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="Dias para entrega"
                    value={leadTime}
                    onChange={(e) => setLeadTime(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_primary"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="is_primary">Fornecedor principal para este produto</Label>
              </div>

              <Button onClick={handleAddProduct} className="w-full md:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Vincular Produto
              </Button>
            </CardContent>
          </Card>

          {/* Linked Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Produtos Vinculados ({linkedProducts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linkedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto vinculado</h3>
                  <p className="text-muted-foreground">
                    Vincule produtos a este fornecedor usando o formulário acima.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>SKU Produto</TableHead>
                      <TableHead>SKU Fornecedor</TableHead>
                      <TableHead>Preço Custo</TableHead>
                      <TableHead>Qtd. Mín.</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Principal</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {linkedProducts.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{link.product_name}</div>
                            <Badge variant="outline" className="text-xs">
                              {link.product_status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{link.product_sku}</TableCell>
                        <TableCell>{link.supplier_sku || '-'}</TableCell>
                        <TableCell>
                          {link.cost_price ? `R$ ${Number(link.cost_price).toFixed(2)}` : '-'}
                        </TableCell>
                        <TableCell>{link.minimum_order_quantity}</TableCell>
                        <TableCell>
                          {link.lead_time_days ? `${link.lead_time_days} dias` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={link.is_primary ? 'default' : 'secondary'}>
                            {link.is_primary ? 'Sim' : 'Não'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(link.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductSuppliersDialog;