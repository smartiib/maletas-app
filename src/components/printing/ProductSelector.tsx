
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Search, Tag } from 'lucide-react';

interface ProductSelection {
  id: number;
  name: string;
  sku: string;
  price: string;
  selected: boolean;
}

interface ProductSelectorProps {
  products: ProductSelection[];
  selectedProducts: number[];
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onProductSelection: (productId: number, selected: boolean) => void;
  onSelectAll: () => void;
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  products,
  selectedProducts,
  searchTerm,
  onSearchChange,
  onProductSelection,
  onSelectAll
}) => {
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = selectedProducts.length;
  const allSelected = filteredProducts.every(p => selectedProducts.includes(p.id));

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Seleção de Produtos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar produtos por nome ou SKU..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button 
              onClick={onSelectAll}
              variant="outline"
              size="sm"
            >
              {allSelected ? 'Desmarcar' : 'Selecionar'} Todos
            </Button>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedProducts.includes(product.id)
                      ? 'bg-primary/5 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => onProductSelection(product.id, !selectedProducts.includes(product.id))}
                >
                  <Checkbox
                    checked={selectedProducts.includes(product.id)}
                    onChange={(checked) => onProductSelection(product.id, !!checked)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium truncate">{product.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {product.sku}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      R$ {product.price}
                    </p>
                  </div>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </ScrollArea>

          {selectedCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">
                {selectedCount} produto(s) selecionado(s)
              </span>
              <Badge variant="default">
                Total selecionado
              </Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
