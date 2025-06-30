
import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  style?: React.CSSProperties;
}

const KPICard = ({ title, value, subtitle, icon: Icon, trend, className, style }: KPICardProps) => {
  return (
    <Card 
      className={cn(
        "relative overflow-hidden transition-all-smooth hover:shadow-lg hover:scale-105 cursor-pointer",
        "bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900",
        className
      )}
      style={style}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className={cn(
                "flex items-center mt-2 text-xs font-medium",
                trend.isPositive ? "text-success-600" : "text-red-600"
              )}>
                <span className={cn(
                  "mr-1",
                  trend.isPositive ? "text-success-600" : "text-red-600"
                )}>
                  {trend.isPositive ? "↗" : "↘"}
                </span>
                {Math.abs(trend.value)}% vs mês anterior
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
        
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-primary opacity-5 rounded-full transform translate-x-8 -translate-y-8" />
      </CardContent>
    </Card>
  );
};

export default KPICard;
