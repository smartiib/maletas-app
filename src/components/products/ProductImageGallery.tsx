import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  useProductImages, 
  useUploadProductImage, 
  useUpdateProductImage, 
  useDeleteProductImage,
  useReorderProductImages,
  ProductImage 
} from '@/hooks/useProductImages';
import { 
  Upload, 
  Star, 
  StarOff, 
  Trash2, 
  Image as ImageIcon, 
  Move,
  Edit,
  X
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface ProductImageGalleryProps {
  productId?: number;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ productId }) => {
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const { data: images = [], isLoading } = useProductImages(productId);
  const uploadImage = useUploadProductImage();
  const updateImage = useUpdateProductImage();
  const deleteImage = useDeleteProductImage();
  const reorderImages = useReorderProductImages();

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files || !productId) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        uploadImage.mutate({
          file,
          productId,
          altText: file.name,
          isFeatured: images.length === 0, // First image is featured by default
        });
      } else {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione apenas arquivos de imagem.",
          variant: "destructive",
        });
      }
    });
  }, [productId, uploadImage, images.length]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const toggleFeatured = useCallback((image: ProductImage) => {
    updateImage.mutate({
      id: image.id,
      productId: image.product_id,
      is_featured: !image.is_featured,
    });
  }, [updateImage]);

  const handleDelete = useCallback((imageId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta imagem?')) {
      deleteImage.mutate(imageId);
    }
  }, [deleteImage]);

  const handleUpdateImage = useCallback(() => {
    if (!editingImage) return;

    updateImage.mutate({
      id: editingImage.id,
      alt_text: editingImage.alt_text,
    }, {
      onSuccess: () => {
        setEditingImage(null);
      }
    });
  }, [editingImage, updateImage]);

  if (!productId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Galeria de Imagens
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Salve o produto primeiro para adicionar imagens
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Galeria de Imagens
          <Badge variant="secondary">{images.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground mb-2">
            Arraste imagens aqui ou clique para selecionar
          </p>
          <Input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => handleFileUpload(e.target.files)}
            className="max-w-xs mx-auto"
          />
        </div>

        {/* Images Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : images.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square relative overflow-hidden rounded-lg border">
                  <img
                    src={image.image_url}
                    alt={image.alt_text || 'Produto'}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Featured Badge */}
                  {image.is_featured && (
                    <Badge className="absolute top-2 left-2" variant="default">
                      <Star className="h-3 w-3 mr-1" />
                      Destaque
                    </Badge>
                  )}

                  {/* Actions Overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => toggleFeatured(image)}
                      title={image.is_featured ? "Remover destaque" : "Definir como destaque"}
                    >
                      {image.is_featured ? (
                        <StarOff className="h-4 w-4" />
                      ) : (
                        <Star className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setEditingImage(image)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Imagem</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <img
                              src={image.image_url}
                              alt={image.alt_text || 'Produto'}
                              className="w-full h-48 object-cover rounded-lg"
                            />
                          </div>
                          <div>
                            <Label htmlFor="alt-text">Texto Alternativo</Label>
                            <Textarea
                              id="alt-text"
                              value={editingImage?.alt_text || ''}
                              onChange={(e) => setEditingImage(prev => 
                                prev ? { ...prev, alt_text: e.target.value } : null
                              )}
                              placeholder="Descrição da imagem para acessibilidade"
                            />
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="featured"
                              checked={editingImage?.is_featured || false}
                              onCheckedChange={(checked) => setEditingImage(prev => 
                                prev ? { ...prev, is_featured: checked } : null
                              )}
                            />
                            <Label htmlFor="featured">Imagem de destaque</Label>
                          </div>
                          <div className="flex gap-2">
                            <Button onClick={handleUpdateImage} className="flex-1">
                              Salvar
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingImage(null)}
                              className="flex-1"
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Image Info */}
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground truncate">
                    {image.alt_text || 'Sem descrição'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">
              Nenhuma imagem adicionada ainda
            </p>
          </div>
        )}

        {/* Loading States */}
        {(uploadImage.isPending || updateImage.isPending || deleteImage.isPending) && (
          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">Processando...</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};