
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Customer } from '@/services/woocommerce';

const customerSchema = z.object({
  email: z.string().email('Email inválido'),
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  username: z.string().min(1, 'Nome de usuário é obrigatório'),
  is_representative: z.boolean().default(false),
  billing: z.object({
    first_name: z.string().min(1, 'Nome é obrigatório'),
    last_name: z.string().min(1, 'Sobrenome é obrigatório'),
    company: z.string().optional(),
    address_1: z.string().min(1, 'Endereço é obrigatório'),
    address_2: z.string().optional(),
    city: z.string().min(1, 'Cidade é obrigatória'),
    state: z.string().min(1, 'Estado é obrigatório'),
    postcode: z.string().min(1, 'CEP é obrigatório'),
    country: z.string().default('BR'),
    email: z.string().email('Email inválido'),
    phone: z.string().optional(),
  }),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Partial<Customer>;
  onSubmit: (data: CustomerFormData) => void;
  isLoading?: boolean;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, onSubmit, isLoading }) => {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      email: customer?.email || '',
      first_name: customer?.first_name || '',
      last_name: customer?.last_name || '',
      username: customer?.username || '',
      is_representative: customer?.meta_data?.some(meta => meta.key === 'is_representative' && meta.value) || false,
      billing: {
        first_name: customer?.billing?.first_name || '',
        last_name: customer?.billing?.last_name || '',
        company: customer?.billing?.company || '',
        address_1: customer?.billing?.address_1 || '',
        address_2: customer?.billing?.address_2 || '',
        city: customer?.billing?.city || '',
        state: customer?.billing?.state || '',
        postcode: customer?.billing?.postcode || '',
        country: customer?.billing?.country || 'BR',
        email: customer?.billing?.email || '',
        phone: customer?.billing?.phone || '',
      },
    },
  });

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sobrenome" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@exemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome de Usuário *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="usuario123" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_representative"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Representante
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Marque esta opção se este cliente é um representante de vendas
                  </p>
                </div>
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações de Cobrança</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billing.first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Nome" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sobrenome *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Sobrenome" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billing.email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" placeholder="email@exemplo.com" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="(11) 99999-9999" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="billing.company"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Empresa</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Nome da empresa" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="billing.address_1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Rua, número" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.address_2"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Apartamento, sala, etc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="billing.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Cidade" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="SP" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="billing.postcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="00000-000" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="submit" disabled={isLoading} className="bg-gradient-primary hover:opacity-90">
            {isLoading ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CustomerForm;
