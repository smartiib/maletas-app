
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Mail, Phone, MapPin } from 'lucide-react';
import { useRepresentantes } from '@/hooks/useWooCommerce';
import { Skeleton } from '@/components/ui/skeleton';

const RepresentantesList = () => {
  const { data: representantes, isLoading, error } = useRepresentantes();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Representantes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[150px]" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Representantes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Erro ao carregar representantes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Representantes ({representantes?.length || 0})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!representantes?.length ? (
          <p className="text-slate-500 text-center py-4">
            Nenhum representante encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {representantes.map((rep: any) => (
              <div key={rep.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={rep.avatar_urls?.['48'] || ''} />
                    <AvatarFallback>
                      {rep.first_name?.[0] || ''}{rep.last_name?.[0] || ''}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h3 className="font-medium">{rep.display_name || `${rep.first_name || ''} ${rep.last_name || ''}`.trim() || 'N/A'}</h3>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {rep.email}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    Representante
                  </Badge>
                  <Badge variant="outline">
                    ID: {rep.id}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RepresentantesList;
