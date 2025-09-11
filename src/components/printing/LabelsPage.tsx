import React, { useEffect } from 'react';
import { LabelDesigner } from './LabelDesigner';
import { LabelTemplateManager } from './LabelTemplateManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLabelTemplates } from '@/hooks/useLabelTemplates';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FileText, Settings } from 'lucide-react';

export const LabelsPage: React.FC = () => {
  const { templates, isLoading, createDefaultTemplate } = useLabelTemplates();

  // Auto-create default template if none exists
  useEffect(() => {
    if (!isLoading && templates.length === 0) {
      console.log('[LabelsPage] Nenhum template encontrado, criando template padrão...');
      createDefaultTemplate();
    }
  }, [isLoading, templates.length, createDefaultTemplate]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Inicializando sistema de etiquetas...</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <Tabs defaultValue="designer" className="h-full flex flex-col">
        <div className="border-b px-6 py-3">
          <TabsList className="grid w-fit grid-cols-2">
            <TabsTrigger value="designer" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Designer
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Templates
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="designer" className="flex-1 m-0">
          {templates.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4">
                <Alert className="max-w-md">
                  <FileText className="h-4 w-4" />
                  <AlertDescription>
                    Nenhum template de etiqueta encontrado. Crie um template primeiro para poder imprimir etiquetas.
                  </AlertDescription>
                </Alert>
                <Button onClick={() => createDefaultTemplate()}>
                  <FileText className="h-4 w-4 mr-2" />
                  Criar Template Padrão
                </Button>
              </div>
            </div>
          ) : (
            <LabelDesigner />
          )}
        </TabsContent>

        <TabsContent value="templates" className="flex-1 m-0 overflow-auto">
          <LabelTemplateManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};