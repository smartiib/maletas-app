
import React from 'react';
import { Package, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StockStatusIconProps {
  stock: number;
  status: string;
  className?: string;
}

export const StockStatusIcon: React.FC<StockStatusIconProps> = ({ stock, status, className }) => {
  if (status === 'outofstock' || stock === 0) {
    return (
      <div className={cn("w-4 h-4 rounded bg-red-500 flex items-center justify-center", className)}>
        <Package className="w-2.5 h-2.5 text-white" />
      </div>
    );
  }
  
  if (stock <= 5) {
    return (
      <div className={cn("w-4 h-4 rounded bg-yellow-500 flex items-center justify-center", className)}>
        <AlertTriangle className="w-2.5 h-2.5 text-white" />
      </div>
    );
  }
  
  return (
    <div className={cn("w-4 h-4 rounded bg-green-500 flex items-center justify-center", className)}>
      <CheckCircle2 className="w-2.5 h-2.5 text-white" />
    </div>
  );
};
