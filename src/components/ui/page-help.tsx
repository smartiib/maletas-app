import React, { useState } from 'react';
import { HelpCircle, Info, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PageHelpProps {
  title: string;
  description: string;
  helpContent: {
    overview: string;
    features: Array<{
      title: string;
      description: string;
    }>;
  };
}

const PageHelp: React.FC<PageHelpProps> = ({ title, description, helpContent }) => {
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <>
      {/* Cabeçalho Informativo */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">{title}</h3>
                <p className="text-sm text-blue-700 dark:text-blue-200">{description}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900"
            >
              <HelpCircle className="w-4 h-4 mr-2" />
              Ajuda
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Ajuda */}
      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-600" />
              Ajuda de {title}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-3">Visão Geral</h3>
              <p className="text-muted-foreground">{helpContent.overview}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Funcionalidades Principais</h3>
              <div className="space-y-4">
                {helpContent.features.map((feature, index) => (
                  <div key={index} className="border-l-4 border-blue-200 pl-4">
                    <h4 className="font-medium text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button onClick={() => setHelpOpen(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PageHelp;