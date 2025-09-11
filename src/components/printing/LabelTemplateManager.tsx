import React from 'react';
import { useLabelTemplates } from '@/hooks/useLabelTemplates';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, FileText, AlertCircle } from 'lucide-react';

export const LabelTemplateManager: React.FC = () => {
  const { 
    templates, 
    isLoading, 
    error, 
    createDefaultTemplate,
    refetch 
  } = useLabelTemplates();

  if (isLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Carregando templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erro ao carregar templates: {error.message}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Templates de Etiquetas</h1>
          <p className="text-muted-foreground">
            Gerencie os templates para impressão de etiquetas
          </p>
        </div>
        
        {templates.length === 0 && (
          <Button onClick={() => createDefaultTemplate()}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Template Padrão
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Nenhum template de etiqueta encontrado. Crie um template padrão para começar a imprimir etiquetas.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card key={template.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  {template.is_default && (
                    <Badge variant="default" className="text-xs">
                      Padrão
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  <p>Tipo: {template.type}</p>
                  <p>Formato: {template.format}</p>
                  <p>Impressora: {template.printer_type}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};