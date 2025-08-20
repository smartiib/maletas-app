
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, User, Mail, Calendar, Edit, Trash2, Key } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useOrganizationUsers } from '@/hooks/useOrganizationUsers';
import { useForm } from 'react-hook-form';

interface OrganizationUser {
  id: string;
  organization_id: string;
  email: string;
  name: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  updated_at: string;
}

interface CreateUserFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface EditUserFormData {
  name: string;
  email: string;
}

interface ChangePasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface OrganizationUsersManagerProps {
  organizationId: string;
}

export function OrganizationUsersManager({ organizationId }: OrganizationUsersManagerProps) {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);
  const [loadingUsers, setLoadingUsers] = useState(true);
  
  const { createUser, updateUser, changePassword, deleteUser, loadUsers, updateUserStatus, loading } = useOrganizationUsers();

  const { register: registerCreate, handleSubmit: handleCreateSubmit, formState: { errors: createErrors }, reset: resetCreate, watch: watchCreate } = useForm<CreateUserFormData>();
  const { register: registerEdit, handleSubmit: handleEditSubmit, formState: { errors: editErrors }, reset: resetEdit, setValue: setEditValue } = useForm<EditUserFormData>();
  const { register: registerPassword, handleSubmit: handlePasswordSubmit, formState: { errors: passwordErrors }, reset: resetPassword, watch: watchPassword } = useForm<ChangePasswordFormData>();

  const createPassword = watchCreate('password');
  const newPassword = watchPassword('newPassword');

  const loadOrganizationUsers = async () => {
    setLoadingUsers(true);
    const userData = await loadUsers(organizationId);
    setUsers(userData);
    setLoadingUsers(false);
  };

  useEffect(() => {
    if (organizationId) {
      loadOrganizationUsers();
    }
  }, [organizationId]);

  const onCreateSubmit = async (data: CreateUserFormData) => {
    if (data.password !== data.confirmPassword) {
      return;
    }

    const success = await createUser(organizationId, {
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (success) {
      setIsCreateDialogOpen(false);
      resetCreate();
      await loadOrganizationUsers();
    }
  };

  const onEditSubmit = async (data: EditUserFormData) => {
    if (!editingUser) return;

    const success = await updateUser(editingUser.id, {
      name: data.name,
      email: data.email,
    });

    if (success) {
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetEdit();
      await loadOrganizationUsers();
    }
  };

  const onPasswordSubmit = async (data: ChangePasswordFormData) => {
    if (!editingUser) return;
    if (data.newPassword !== data.confirmPassword) return;

    const success = await changePassword({
      userId: editingUser.id,
      newPassword: data.newPassword,
    });

    if (success) {
      setIsPasswordDialogOpen(false);
      setEditingUser(null);
      resetPassword();
    }
  };

  const handleEditUser = (user: OrganizationUser) => {
    setEditingUser(user);
    setEditValue('name', user.name);
    setEditValue('email', user.email);
    setIsEditDialogOpen(true);
  };

  const handleChangePassword = (user: OrganizationUser) => {
    setEditingUser(user);
    setIsPasswordDialogOpen(true);
  };

  const handleDeleteUser = async (user: OrganizationUser) => {
    const success = await deleteUser(user.id);
    if (success) {
      await loadOrganizationUsers();
    }
  };

  const handleUserStatusToggle = async (userId: string, isActive: boolean) => {
    const success = await updateUserStatus(userId, isActive);
    if (success) {
      await loadOrganizationUsers();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Usuários da Organização</CardTitle>
            <CardDescription>
              Gerencie os usuários que podem acessar esta organização
            </CardDescription>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário para esta organização
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateSubmit(onCreateSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input
                    id="name"
                    {...registerCreate('name', { required: 'Nome é obrigatório' })}
                    placeholder="João Silva"
                  />
                  {createErrors.name && (
                    <p className="text-sm text-destructive mt-1">{createErrors.name.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    {...registerCreate('email', { 
                      required: 'E-mail é obrigatório',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'E-mail inválido'
                      }
                    })}
                    placeholder="joao@exemplo.com"
                  />
                  {createErrors.email && (
                    <p className="text-sm text-destructive mt-1">{createErrors.email.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    {...registerCreate('password', { 
                      required: 'Senha é obrigatória',
                      minLength: {
                        value: 6,
                        message: 'Senha deve ter pelo menos 6 caracteres'
                      }
                    })}
                    placeholder="••••••••"
                  />
                  {createErrors.password && (
                    <p className="text-sm text-destructive mt-1">{createErrors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerCreate('confirmPassword', { 
                      required: 'Confirmação de senha é obrigatória',
                      validate: (value) => value === createPassword || 'Senhas não coincidem'
                    })}
                    placeholder="••••••••"
                  />
                  {createErrors.confirmPassword && (
                    <p className="text-sm text-destructive mt-1">{createErrors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loadingUsers ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-16 bg-muted rounded-lg"></div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário encontrado</p>
            <p className="text-sm">Crie o primeiro usuário para esta organização</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleChangePassword(user)}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o usuário "{user.name}"? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteUser(user)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  
                  <Switch
                    checked={user.is_active}
                    onCheckedChange={(checked) => handleUserStatusToggle(user.id, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Dialog para Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Edite as informações do usuário
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nome Completo</Label>
              <Input
                id="edit-name"
                {...registerEdit('name', { required: 'Nome é obrigatório' })}
                placeholder="João Silva"
              />
              {editErrors.name && (
                <p className="text-sm text-destructive mt-1">{editErrors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-email">E-mail</Label>
              <Input
                id="edit-email"
                type="email"
                {...registerEdit('email', { 
                  required: 'E-mail é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'E-mail inválido'
                  }
                })}
                placeholder="joao@exemplo.com"
              />
              {editErrors.email && (
                <p className="text-sm text-destructive mt-1">{editErrors.email.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsEditDialogOpen(false);
                setEditingUser(null);
                resetEdit();
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para Alterar Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário "{editingUser?.name}"
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                {...registerPassword('newPassword', { 
                  required: 'Nova senha é obrigatória',
                  minLength: {
                    value: 6,
                    message: 'Senha deve ter pelo menos 6 caracteres'
                  }
                })}
                placeholder="••••••••"
              />
              {passwordErrors.newPassword && (
                <p className="text-sm text-destructive mt-1">{passwordErrors.newPassword.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
              <Input
                id="confirmNewPassword"
                type="password"
                {...registerPassword('confirmPassword', { 
                  required: 'Confirmação de senha é obrigatória',
                  validate: (value) => value === newPassword || 'Senhas não coincidem'
                })}
                placeholder="••••••••"
              />
              {passwordErrors.confirmPassword && (
                <p className="text-sm text-destructive mt-1">{passwordErrors.confirmPassword.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => {
                setIsPasswordDialogOpen(false);
                setEditingUser(null);
                resetPassword();
              }}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
