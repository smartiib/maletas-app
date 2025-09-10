import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  useProductCategories, 
  useCreateProductCategory,
  ProductCategory 
} from '@/hooks/useProductCategories';
import { useWooCommerceFilteredCategories } from '@/hooks/useWooCommerceFiltered';
import { FolderTree, Plus, Folder } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface ProductCategoriesManagerProps {
  selectedCategoryId?: string;
  onCategorySelect?: (categoryId: string) => void;
}

export const ProductCategoriesManager: React.FC<ProductCategoriesManagerProps> = ({ 
  selectedCategoryId, 
  onCategorySelect 
}) => {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryParent, setNewCategoryParent] = useState<string>('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: customCategories = [] } = useProductCategories();
  const { data: wooCategories = [] } = useWooCommerceFilteredCategories();
  const createCategory = useCreateProductCategory();

  // Combine WooCommerce and custom categories
  const allCategories = [
    ...wooCategories.map(cat => ({
      id: `wc-${cat.id}`,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parent_id: cat.parent ? `wc-${cat.parent}` : null,
      isWooCommerce: true,
    })),
    ...customCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      parent_id: cat.parent_id,
      isWooCommerce: false,
    })),
  ];

  const buildCategoryTree = (categories: any[], parentId: string | null = null): any[] => {
    return categories
      .filter(cat => cat.parent_id === parentId)
      .map(cat => ({
        ...cat,
        children: buildCategoryTree(categories, cat.id),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const categoryTree = buildCategoryTree(allCategories);

  const renderCategoryOption = (category: any, depth = 0): React.ReactNode => {
    const prefix = '└ '.repeat(depth);
    
    return [
      <SelectItem key={category.id} value={category.id}>
        {prefix}{category.name}
        {category.isWooCommerce && <span className="text-xs text-muted-foreground ml-2">(WC)</span>}
      </SelectItem>,
      ...category.children.flatMap((child: any) => renderCategoryOption(child, depth + 1)),
    ];
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    await createCategory.mutateAsync({
      name: newCategoryName.trim(),
      slug,
      description: newCategoryDescription.trim() || undefined,
      parent_id: newCategoryParent || undefined,
      display_order: 0,
      is_active: true,
    });

    setNewCategoryName('');
    setNewCategoryDescription('');
    setNewCategoryParent('');
    setIsCreateDialogOpen(false);
  };

  const renderCategoryTree = (categories: any[], depth = 0): React.ReactNode => {
    return categories.map(category => (
      <div key={category.id} className={`ml-${depth * 4}`}>
        <div className="flex items-center gap-2 py-1">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{category.name}</span>
          {category.isWooCommerce && (
            <span className="text-xs text-muted-foreground bg-muted px-1 rounded">WC</span>
          )}
        </div>
        {category.children.length > 0 && renderCategoryTree(category.children, depth + 1)}
      </div>
    ));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderTree className="h-5 w-5" />
          Categorias de Produtos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Selection */}
        {onCategorySelect && (
          <div>
            <Label htmlFor="category-select">Categoria do Produto</Label>
            <Select value={selectedCategoryId} onValueChange={onCategorySelect}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhuma categoria</SelectItem>
                {categoryTree.flatMap(cat => renderCategoryOption(cat))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Create New Category */}
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Gerenciar Categorias</Label>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Categoria</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="category-name">Nome da Categoria *</Label>
                  <Input
                    id="category-name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ex: Anéis, Brincos, Colares"
                  />
                </div>
                <div>
                  <Label htmlFor="category-parent">Categoria Pai</Label>
                  <Select value={newCategoryParent} onValueChange={setNewCategoryParent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma categoria pai (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Categoria raiz</SelectItem>
                      {categoryTree.flatMap(cat => renderCategoryOption(cat))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category-description">Descrição</Label>
                  <Textarea
                    id="category-description"
                    value={newCategoryDescription}
                    onChange={(e) => setNewCategoryDescription(e.target.value)}
                    placeholder="Descrição opcional da categoria"
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleCreateCategory} 
                    disabled={!newCategoryName.trim() || createCategory.isPending}
                    className="flex-1"
                  >
                    {createCategory.isPending ? 'Criando...' : 'Criar Categoria'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setNewCategoryName('');
                      setNewCategoryDescription('');
                      setNewCategoryParent('');
                      setIsCreateDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Tree */}
        <div className="border rounded-lg p-3 max-h-60 overflow-y-auto">
          {categoryTree.length > 0 ? (
            renderCategoryTree(categoryTree)
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              Nenhuma categoria disponível. Crie a primeira categoria!
            </p>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>• Categorias marcadas com "WC" são sincronizadas do WooCommerce</p>
          <p>• Categorias personalizadas são específicas desta aplicação</p>
        </div>
      </CardContent>
    </Card>
  );
};