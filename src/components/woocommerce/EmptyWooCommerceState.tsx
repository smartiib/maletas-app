
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Database, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyWooCommerceStateProps {
  title: string;
  description: string;
  showConfigButton?: boolean;
}

export const EmptyWooCommerceState = ({ 
  title, 
  description, 
  showConfigButton = true 
}: EmptyWooCommerceStateProps) => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-muted flex items-center justify-center">
            <Database className="h-6 w-6 text-muted-foreground" />
          </div>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription className="text-center">
            {description}
          </CardDescription>
        </CardHeader>
        {showConfigButton && (
          <CardContent className="text-center space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              <span>Configure o WooCommerce para começar a usar o sistema</span>
            </div>
            <Link to="/settings">
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Configurar WooCommerce
              </Button>
            </Link>
          </CardContent>
        )}
      </Card>
    </div>
  );
};
