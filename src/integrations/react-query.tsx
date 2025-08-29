
import React from 'react';
import { QueryClient as QC, QueryClientProvider } from '@tanstack/react-query';

const client = new QC();

export const QueryClient: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

