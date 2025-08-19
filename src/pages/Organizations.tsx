
import { useState, useEffect } from 'react';
import { Plus, Building2, Edit2, Users, Settings, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useOrganizations } from '@/hooks/useOrganizations';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationForm } from '@/components/organizations/OrganizationForm';
import { OrganizationPagesManager } from '@/components/organizations/OrganizationPagesManager';
import { OrganizationUsersManager } from '@/components/organizations/OrganizationUsersManager';

interface Organization {
  id: string;
  name: string;
  slug: string;
  email?: string;
  phone?: string;
  contact_person?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  is_active: boolean;
  asaas_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [viewingOrg, setViewingOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const { createOrganization, updateOrganization, loading: actionLoading } = useOrganizations();
  const { refreshOrganizations } = useOrganization();

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name');

      if (error) {
        console.error('Erro ao carregar organizações:', error);
        return;
      }

      setOrganizations(data || []);
    } catch (error) {
      console.error('Erro ao carregar organizações:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrganizations();
  }, []);

  const handleSubmit = async (formData: any) => {
    let success = false;
    
    if (editingOrg) {
      success = await updateOrganization(editingOrg.id, formData);
    } else {
      const newOrg = await createOrganization(formData);
      success = !!newOrg;
    }

    if (success) {
      setIsDialogOpen(false);
      setEditingOrg(null);
      await loadOrganizations();
      await refreshOrganizations();
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setIsDialogOpen(true);
  };

  const handleView = (org: Organization) => {
    setViewingOrg(org);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setEditingOrg(null);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando organizações...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Organizações</h1>
          <p className="text-muted-foreground">
            Gerencie as organizações e seus acessos no sistema
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Organização
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingOrg ? 'Editar Organização' : 'Nova Organização'}
                </DialogTitle>
                <DialogDescription>
                  {editingOrg 
                    ? 'Edite as informações da organização.' 
                    : 'Crie uma nova organização no sistema.'
                  }
                </DialogDescription>
              </DialogHeader>
              <OrganizationForm
                onSubmit={handleSubmit}
                loading={actionLoading}
                initialData={editingOrg || undefined}
                mode={editingOrg ? 'edit' : 'create'}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {organizations.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma organização encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Comece criando sua primeira organização.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{org.name}</CardTitle>
                      <CardDescription>@{org.slug}</CardDescription>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant={org.is_active ? 'default' : 'secondary'}>
                      {org.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  {org.email && (
                    <p>📧 {org.email}</p>
                  )}
                  {org.phone && (
                    <p>📱 {org.phone}</p>
                  )}
                  {org.contact_person && (
                    <p>👤 {org.contact_person}</p>
                  )}
                  {(org.city || org.state) && (
                    <p>📍 {[org.city, org.state].filter(Boolean).join(', ')}</p>
                  )}
                </div>
                
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(org)}
                    className="flex-1"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Detalhes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(org)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <p className="text-xs text-muted-foreground mt-2">
                  Criada em: {new Date(org.created_at).toLocaleDateString('pt-BR')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog para visualizar detalhes da organização */}
      <Dialog open={!!viewingOrg} onOpenChange={() => setViewingOrg(null)}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {viewingOrg?.name}
            </DialogTitle>
            <DialogDescription>
              Gerencie usuários e páginas disponíveis para esta organização
            </DialogDescription>
          </DialogHeader>
          
          {viewingOrg && (
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="users">
                  <Users className="h-4 w-4 mr-2" />
                  Usuários
                </TabsTrigger>
                <TabsTrigger value="pages">
                  <Settings className="h-4 w-4 mr-2" />
                  Páginas
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="users" className="mt-6">
                <OrganizationUsersManager organizationId={viewingOrg.id} />
              </TabsContent>
              
              <TabsContent value="pages" className="mt-6">
                <OrganizationPagesManager organizationId={viewingOrg.id} />
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
