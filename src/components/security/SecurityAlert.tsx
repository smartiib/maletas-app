
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle } from 'lucide-react';

interface SecurityAlertProps {
  type: 'warning' | 'info';
  title: string;
  message: string;
}

const SecurityAlert = ({ type, title, message }: SecurityAlertProps) => {
  return (
    <Alert className={type === 'warning' ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}>
      {type === 'warning' ? (
        <AlertTriangle className="h-4 w-4 text-orange-600" />
      ) : (
        <Shield className="h-4 w-4 text-blue-600" />
      )}
      <AlertDescription className="space-y-2">
        <div className="font-semibold">{title}</div>
        <div className="text-sm">{message}</div>
      </AlertDescription>
    </Alert>
  );
};

export default SecurityAlert;
