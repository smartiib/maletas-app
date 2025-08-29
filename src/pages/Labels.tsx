
import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LabelDesigner } from '@/components/printing/LabelDesigner';

const Labels: React.FC = () => {
  return (
    <DashboardLayout>
      <LabelDesigner />
    </DashboardLayout>
  );
};

export default Labels;
