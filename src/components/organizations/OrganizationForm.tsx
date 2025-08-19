
import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface OrganizationFormData {
  name: string;
  slug: string;
  email: string;
  phone: string;
  contact_person: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface OrganizationFormProps {
  onSubmit: (data: OrganizationFormData) => void;
  loading: boolean;
  initialData?: Partial<OrganizationFormData>;
  mode: 'create' | 'edit';
}

export function OrganizationForm({ onSubmit, loading, initialData, mode }: OrganizationFormProps) {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<OrganizationFormData>({
    defaultValues: initialData
  });

  const name = watch('name');

  // Auto-gerar slug baseado no nome
  React.useEffect(() => {
    if (name && mode === 'create') {
      const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  }, [name, setValue, mode]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome da Organização *</Label>
          <Input
            id="name"
            {...register('name', { required: 'Nome é obrigatório' })}
            placeholder="Ex: Minha Empresa Ltda"
          />
          {errors.name && (
            <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="slug">Slug (identificador único) *</Label>
          <Input
            id="slug"
            {...register('slug', { required: 'Slug é obrigatório' })}
            placeholder="ex: minha-empresa"
          />
          {errors.slug && (
            <p className="text-sm text-destructive mt-1">{errors.slug.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            {...register('email')}
            placeholder="contato@empresa.com"
          />
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            {...register('phone')}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div>
          <Label htmlFor="contact_person">Pessoa de Contato</Label>
          <Input
            id="contact_person"
            {...register('contact_person')}
            placeholder="Nome do responsável"
          />
        </div>

        <div>
          <Label htmlFor="zip_code">CEP</Label>
          <Input
            id="zip_code"
            {...register('zip_code')}
            placeholder="00000-000"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="address">Endereço</Label>
        <Textarea
          id="address"
          {...register('address')}
          placeholder="Rua, número, complemento"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">Cidade</Label>
          <Input
            id="city"
            {...register('city')}
            placeholder="São Paulo"
          />
        </div>

        <div>
          <Label htmlFor="state">Estado</Label>
          <Input
            id="state"
            {...register('state')}
            placeholder="SP"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : (mode === 'create' ? 'Criar Organização' : 'Atualizar Organização')}
        </Button>
      </div>
    </form>
  );
}
