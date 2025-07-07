import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileText, Plus, Edit, Trash, Eye } from 'lucide-react';
import { PdfTemplate, PdfTemplateService } from '@/services/pdfTemplates';
import { useToast } from '@/hooks/use-toast';

const PdfTemplates = () => {
  const [templates, setTemplates] = useState<PdfTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await PdfTemplateService.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar templates de PDF",
        variant: "destructive",
      });
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      await PdfTemplateService.deleteTemplate(id);
      toast({
        title: "Sucesso",
        description: "Template excluído com sucesso",
      });
      loadTemplates();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao excluir template",
        variant: "destructive",
      });
      console.error('Erro ao excluir template:', error);
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'romaneio': return 'Romaneio';
      case 'etiqueta': return 'Etiqueta';
      case 'relatorio': return 'Relatório';
      default: return type;
    }
  };

  const getFormatLabel = (format: string) => {
    switch (format) {
      case 'A4': return 'A4';
      case 'thermal_80mm': return 'Térmica 80mm';
      case 'thermal_58mm': return 'Térmica 58mm';
      default: return format;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Templates de PDF</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-muted-foreground">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6" />
          <h1 className="text-2xl font-bold">Templates de PDF</h1>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Novo Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {getTypeLabel(template.type)} • {getFormatLabel(template.format)}
                  </CardDescription>
                </div>
                <div className="flex gap-1">
                  {template.is_default && (
                    <Badge variant="secondary" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                  {template.is_active ? (
                    <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs bg-muted text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p>Criado em: {new Date(template.created_at).toLocaleDateString('pt-BR')}</p>
                  <p>Atualizado em: {new Date(template.updated_at).toLocaleDateString('pt-BR')}</p>
                </div>

                <Separator />

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-2" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="w-4 h-4 mr-2" />
                    Editar
                  </Button>
                  {!template.is_default && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Crie seu primeiro template de PDF para começar a gerar documentos personalizados.
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Criar Primeiro Template
          </Button>
        </div>
      )}
    </div>
  );
};

export default PdfTemplates;