
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ReportsKPIProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const ReportsKPI: React.FC<ReportsKPIProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
              {title}
            </p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs flex items-center mt-1 ${
                trend.isPositive ? 'text-success-600' : 'text-red-600'
              }`}>
                {trend.isPositive ? '↗' : '↘'} {Math.abs(trend.value)}% vs período anterior
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          </div>
          <Icon className="w-8 h-8 text-primary" />
        </div>
      </CardContent>
    </Card>
  );
};

export default ReportsKPI;
