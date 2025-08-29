
import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { LabelGrid } from '@/components/printing/LabelGrid';

const Labels: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Etiquetas</h1>
            <p className="text-muted-foreground">
              Selecione produtos para adicionar à fila de impressão
            </p>
          </div>
        </div>
        <LabelGrid />
      </div>
    </DashboardLayout>
  );
};

export default Labels;
