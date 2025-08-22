
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

type ChangelogItem = {
  id: string;
  title: string;
  description: string | null;
  type: 'feature' | 'improvement' | 'bugfix' | 'breaking';
  status: 'planned' | 'in_progress' | 'completed';
  category: string | null;
  version: string | null;
  release_date: string | null;
  priority: number;
  tags: string[] | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
};

interface ChangelogItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item?: ChangelogItem | null;
}

const ChangelogItemDialog: React.FC<ChangelogItemDialogProps> = ({ 
  isOpen, 
  onClose, 
  item 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'feature' as 'feature' | 'improvement' | 'bugfix' | 'breaking',
    status: 'planned' as 'planned' | 'in_progress' | 'completed',
    category: 'general',
    version: '',
    release_date: undefined as Date | undefined,
    priority: 0,
    tags: [] as string[],
    is_featured: false,
  });
  const [newTag, setNewTag] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        description: item.description || '',
        type: item.type,
        status: item.status,
        category: item.category || 'general',
        version: item.version || '',
        release_date: item.release_date ? new Date(item.release_date) : undefined,
        priority: item.priority,
        tags: item.tags || [],
        is_featured: item.is_featured,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        type: 'feature',
        status: 'planned',
        category: 'general',
        version: '',
        release_date: undefined,
        priority: 0,
        tags: [],
        is_featured: false,
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        status: formData.status,
        category: formData.category,
        version: formData.version || null,
        release_date: formData.release_date?.toISOString().split('T')[0] || null,
        priority: formData.priority,
        tags: formData.tags.length > 0 ? formData.tags : null,
        is_featured: formData.is_featured,
      };

      if (item) {
        const { error } = await supabase
          .from('changelog_items')
          .update(data)
          .eq('id', item.id);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso!",
        });
      } else {
        const { error } = await supabase
          .from('changelog_items')
          .insert(data);

        if (error) throw error;

        toast({
          title: "Sucesso",
          description: "Item criado com sucesso!",
        });
      }

      onClose();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar o item.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item ? 'Editar Item' : 'Novo Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título do item..."
                required
              />
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o item em detalhes..."
                rows={4}
              />
            </div>

            {/* Primeira linha: Tipo, Status, Categoria */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select value={formData.type} onValueChange={(value: 'feature' | 'improvement' | 'bugfix' | 'breaking') => setFormData(prev => ({ ...prev, type: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Novo recurso</SelectItem>
                    <SelectItem value="improvement">Melhoria</SelectItem>
                    <SelectItem value="bugfix">Correção</SelectItem>
                    <SelectItem value="breaking">Breaking change</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status *</Label>
                <Select value={formData.status} onValueChange={(value: 'planned' | 'in_progress' | 'completed') => setFormData(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planejado</SelectItem>
                    <SelectItem value="in_progress">Em desenvolvimento</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Geral</SelectItem>
                    <SelectItem value="ui">Interface</SelectItem>
                    <SelectItem value="api">API</SelectItem>
                    <SelectItem value="performance">Performance</SelectItem>
                    <SelectItem value="security">Segurança</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Segunda linha: Versão, Data, Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Versão</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                  placeholder="ex: 1.2.0"
                />
              </div>

              <div className="space-y-2">
                <Label>Data de lançamento</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.release_date ? (
                        format(formData.release_date, 'dd/MM/yyyy', { locale: ptBR })
                      ) : (
                        "Selecionar data"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.release_date}
                      onSelect={(date) => setFormData(prev => ({ ...prev, release_date: date }))}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Input
                  id="priority"
                  type="number"
                  min="0"
                  max="10"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite uma tag e pressione Enter..."
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Item em destaque */}
            <div className="flex items-center space-x-2">
              <Switch
                id="is_featured"
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
              />
              <Label htmlFor="is_featured">Marcar como destaque</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Salvando...' : item ? 'Atualizar' : 'Criar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangelogItemDialog;
