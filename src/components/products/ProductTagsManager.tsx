import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  useProductTags, 
  useProductTagsByProduct,
  useCreateProductTag, 
  useUpdateProductTags,
  ProductTag 
} from '@/hooks/useProductTags';
import { Tags, Plus, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductTagsManagerProps {
  productId?: number;
}

export const ProductTagsManager: React.FC<ProductTagsManagerProps> = ({ productId }) => {
  const [newTagName, setNewTagName] = useState('');
  const [newTagDescription, setNewTagDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: allTags = [] } = useProductTags();
  const { data: productTags = [] } = useProductTagsByProduct(productId || 0);
  const createTag = useCreateProductTag();
  const updateProductTags = useUpdateProductTags();

  // Initialize selected tags when product tags load
  React.useEffect(() => {
    if (productTags && productTags.length > 0) {
      setSelectedTags(productTags.map((tag: ProductTag) => tag.id));
    }
  }, [productTags]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    const slug = newTagName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    
    await createTag.mutateAsync({
      name: newTagName.trim(),
      slug,
      description: newTagDescription.trim() || undefined,
    });

    setNewTagName('');
    setNewTagDescription('');
    setIsCreateDialogOpen(false);
  };

  const handleToggleTag = (tagId: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagId)) {
        return prev.filter(id => id !== tagId);
      } else {
        return [...prev, tagId];
      }
    });
  };

  const handleSaveTags = async () => {
    if (!productId) return;

    await updateProductTags.mutateAsync({
      productId,
      tagIds: selectedTags,
    });
  };

  if (!productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="h-5 w-5" />
            Tags do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Salve o produto primeiro para gerenciar tags
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="h-5 w-5" />
          Tags do Produto
          <Badge variant="secondary">{selectedTags.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Product Tags */}
        <div>
          <Label className="text-sm font-medium">Tags Selecionadas</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {selectedTags.length > 0 ? (
              selectedTags.map(tagId => {
                const tag = allTags.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} variant="default" className="gap-2">
                    {tag.name}
                    <button
                      onClick={() => handleToggleTag(tagId)}
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ) : null;
              })
            ) : (
              <p className="text-muted-foreground text-sm">Nenhuma tag selecionada</p>
            )}
          </div>
        </div>

        {/* Available Tags */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-sm font-medium">Tags Disponíveis</Label>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Tag
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Nova Tag</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tag-name">Nome da Tag *</Label>
                    <Input
                      id="tag-name"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Ex: Promoção, Novo, Popular"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tag-description">Descrição</Label>
                    <Textarea
                      id="tag-description"
                      value={newTagDescription}
                      onChange={(e) => setNewTagDescription(e.target.value)}
                      placeholder="Descrição opcional da tag"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCreateTag} 
                      disabled={!newTagName.trim() || createTag.isPending}
                      className="flex-1"
                    >
                      {createTag.isPending ? 'Criando...' : 'Criar Tag'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setNewTagName('');
                        setNewTagDescription('');
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
            {allTags.length > 0 ? (
              allTags.map(tag => (
                <div key={tag.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleToggleTag(tag.id)}
                  />
                  <Label 
                    htmlFor={`tag-${tag.id}`} 
                    className="text-sm cursor-pointer flex-1"
                    title={tag.description}
                  >
                    {tag.name}
                  </Label>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-sm text-center col-span-2 py-4">
                Nenhuma tag disponível. Crie a primeira tag!
              </p>
            )}
          </div>
        </div>

        {/* Save Button */}
        <Button 
          onClick={handleSaveTags}
          disabled={updateProductTags.isPending}
          className="w-full"
        >
          {updateProductTags.isPending ? 'Salvando...' : 'Salvar Tags'}
        </Button>
      </CardContent>
    </Card>
  );
};