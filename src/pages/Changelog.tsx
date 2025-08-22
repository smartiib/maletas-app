
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Rocket, Bug, Zap, AlertTriangle, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import ChangelogItemDialog from '@/components/changelog/ChangelogItemDialog';
import ChangelogItemCard from '@/components/changelog/ChangelogItemCard';

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

const Changelog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ChangelogItem | null>(null);
  const { toast } = useToast();

  const { data: items = [], refetch } = useQuery({
    queryKey: ['changelog-items', searchTerm, selectedType, selectedCategory, sortBy],
    queryFn: async () => {
      let query = supabase.from('changelog_items').select('*');

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Ordenação
      switch (sortBy) {
        case 'priority':
          query = query.order('priority', { ascending: false }).order('created_at', { ascending: false });
          break;
        case 'date':
          query = query.order('release_date', { ascending: false, nullsLast: true });
          break;
        case 'created':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ChangelogItem[];
    }
  });

  const completedItems = items.filter(item => item.status === 'completed');
  const roadmapItems = items.filter(item => item.status !== 'completed');

  const handleEdit = (item: ChangelogItem) => {
    setEditingItem(item);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('changelog_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o item.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sucesso",
        description: "Item excluído com sucesso!",
      });
      refetch();
    }
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingItem(null);
    refetch();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return <Rocket className="w-4 h-4" />;
      case 'improvement': return <Zap className="w-4 h-4" />;
      case 'bugfix': return <Bug className="w-4 h-4" />;
      case 'breaking': return <AlertTriangle className="w-4 h-4" />;
      default: return <Rocket className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Novidades & Roadmap</h1>
          <p className="text-muted-foreground">
            Acompanhe as últimas atualizações e recursos futuros da plataforma
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Item
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por título ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="feature">Novo recurso</SelectItem>
                <SelectItem value="improvement">Melhoria</SelectItem>
                <SelectItem value="bugfix">Correção</SelectItem>
                <SelectItem value="breaking">Breaking change</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas categorias</SelectItem>
                <SelectItem value="general">Geral</SelectItem>
                <SelectItem value="ui">Interface</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Segurança</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Prioridade</SelectItem>
                <SelectItem value="date">Data de lançamento</SelectItem>
                <SelectItem value="created">Data de criação</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="changelog" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="changelog" className="gap-2">
            <Calendar className="w-4 h-4" />
            Changelog ({completedItems.length})
          </TabsTrigger>
          <TabsTrigger value="roadmap" className="gap-2">
            <Rocket className="w-4 h-4" />
            Roadmap ({roadmapItems.length})
          </TabsTrigger>
        </TabsList>

        {/* Changelog Tab */}
        <TabsContent value="changelog" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recursos Lançados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {completedItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item no changelog ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {completedItems.map((item) => (
                    <ChangelogItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getTypeIcon={getTypeIcon}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roadmap Tab */}
        <TabsContent value="roadmap" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                Recursos Planejados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {roadmapItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Rocket className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum item no roadmap ainda.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roadmapItems.map((item) => (
                    <ChangelogItemCard
                      key={item.id}
                      item={item}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      getTypeIcon={getTypeIcon}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      <ChangelogItemDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        item={editingItem}
      />
    </div>
  );
};

export default Changelog;
