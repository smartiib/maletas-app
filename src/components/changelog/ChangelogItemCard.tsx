
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, Calendar, Star } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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

interface ChangelogItemCardProps {
  item: ChangelogItem;
  onEdit: (item: ChangelogItem) => void;
  onDelete: (id: string) => void;
  getTypeIcon: (type: string) => React.ReactNode;
}

const ChangelogItemCard: React.FC<ChangelogItemCardProps> = ({ 
  item, 
  onEdit, 
  onDelete, 
  getTypeIcon 
}) => {
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'feature': return 'Novo recurso';
      case 'improvement': return 'Melhoria';
      case 'bugfix': return 'Correção';
      case 'breaking': return 'Breaking change';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'improvement': return 'bg-green-100 text-green-800 border-green-200';
      case 'bugfix': return 'bg-red-100 text-red-800 border-red-200';
      case 'breaking': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'planned': return 'Planejado';
      case 'in_progress': return 'Em desenvolvimento';
      case 'completed': return 'Concluído';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className={`transition-all hover:shadow-md ${item.is_featured ? 'ring-2 ring-primary/20 bg-gradient-to-br from-primary/5 to-transparent' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header com título e featured badge */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-lg">{item.title}</h3>
                  {item.is_featured && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3" />
                      Destaque
                    </Badge>
                  )}
                </div>
                {item.description && (
                  <p className="text-muted-foreground">{item.description}</p>
                )}
              </div>
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge className={getTypeColor(item.type)}>
                {getTypeLabel(item.type)}
              </Badge>
              <Badge className={getStatusColor(item.status)}>
                {getStatusLabel(item.status)}
              </Badge>
              {item.category && item.category !== 'general' && (
                <Badge variant="outline">
                  {item.category}
                </Badge>
              )}
              {item.version && (
                <Badge variant="outline">
                  v{item.version}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Datas */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              {item.release_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(item.release_date), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
              )}
              <div>
                Criado em {format(new Date(item.created_at), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              {item.priority > 0 && (
                <Badge variant="outline" className="text-xs">
                  Prioridade {item.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Ações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(item.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChangelogItemCard;
