import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Representative {
  id: string;
  name: string;
  email: string;
  phone?: string;
  commission_settings?: {
    use_global: boolean;
    custom_rates?: CommissionTier[];
    penalty_rate?: number;
  };
  referrer_id?: string;
  total_sales?: number;
  created_at: string;
  updated_at: string;
}

export interface CommissionTier {
  min_amount: number;
  max_amount?: number;
  percentage: number;
  bonus: number;
  label: string;
}

export interface MaletaItem {
  id: string;
  maleta_id: string;
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  status: 'consigned' | 'sold' | 'returned';
  variation_attributes?: Array<{ name: string; value: string }>;
  created_at: string;
  updated_at: string;
}

export interface Maleta {
  id: string;
  number: string;
  representative_id: string;
  representative_name: string;
  customer_name?: string;
  customer_email?: string;
  status: 'active' | 'expired' | 'finalized';
  departure_date: string;
  return_date: string;
  extended_date?: string;
  items?: MaletaItem[];
  total_value: string;
  commission_settings: {
    use_global: boolean;
    tiers: CommissionTier[];
    penalty_rate: number;
  };
  commission_percentage?: number; // For custom commissions
  notes?: string;
  order_number?: number;
  order_url?: string;
  created_at: string;
  updated_at: string;
}

export interface MaletaReturn {
  id?: string;
  maleta_id: string;
  items_sold: Array<{
    item_id: string;
    quantity_sold: number;
  }>;
  items_returned: Array<{
    item_id: string;
    quantity_returned: number;
  }>;
  return_date: string;
  delay_days: number;
  commission_amount: number;
  penalty_amount: number;
  final_amount: number;
  notes?: string;
  created_at?: string;
}

export interface CreateMaletaData {
  representative_id: string;
  customer_name?: string;
  customer_email?: string;
  return_date: string;
  items: Array<{
    product_id: number;
    variation_id?: number;
    name: string;
    sku: string;
    quantity: number;
    price: string;
  }>;
  commission_settings?: {
    use_global: boolean;
    custom_percentage?: number;
  };
  notes?: string;
}

export interface CommissionCalculation {
  subtotal: number;
  commission_tier: CommissionTier;
  commission_amount: number;
  delay_days: number;
  penalty_amount: number;
  final_amount: number;
  referral_bonus?: number;
}

// Configurações globais de comissão
export const DEFAULT_COMMISSION_TIERS: CommissionTier[] = [
  {
    min_amount: 0,
    max_amount: 200,
    percentage: 0,
    bonus: 0,
    label: 'Varejo'
  },
  {
    min_amount: 200,
    max_amount: 1500,
    percentage: 20,
    bonus: 50,
    label: 'Nível 1'
  },
  {
    min_amount: 1500,
    max_amount: 3000,
    percentage: 30,
    bonus: 100,
    label: 'Nível 2'
  },
  {
    min_amount: 3000,
    percentage: 40,
    bonus: 200,
    label: 'Nível 3'
  }
];

export const DEFAULT_PENALTY_RATE = 1; // 1% por dia de atraso
export const MONTHLY_BONUS_THRESHOLD = 1000; // R$ 1.000 para ser elegível ao bônus mensal
export const REFERRAL_COMMISSION_RATE = 10; // 10% sobre vendas de indicados

class MaletasAPI {
  // Buscar configurações de comissão do banco
  async getCommissionTiers(): Promise<CommissionTier[]> {
    try {
      const { data, error } = await supabase
        .from('commission_tiers')
        .select('*')
        .eq('is_active', true)
        .order('min_amount', { ascending: true });

      if (error) {
        console.error('Erro ao buscar tiers de comissão:', error);
        return DEFAULT_COMMISSION_TIERS;
      }

      return data || DEFAULT_COMMISSION_TIERS;
    } catch (error) {
      console.error('Erro na busca de tiers:', error);
      return DEFAULT_COMMISSION_TIERS;
    }
  }

  // Maletas CRUD
  async getMaletas(page = 1, per_page = 20, status = '', representative_id = ''): Promise<Maleta[]> {
    try {
      let query = supabase
        .from('maletas')
        .select(`
          *,
          representative:representatives(name),
          items:maleta_items(*)
        `)
        .order('created_at', { ascending: false });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      if (representative_id) {
        query = query.eq('representative_id', representative_id);
      }

      const { data, error } = await query.range((page - 1) * per_page, page * per_page - 1);

      if (error) {
        console.error('Erro ao buscar maletas:', error);
        throw error;
      }

      return (data || []).map((maleta: any) => ({
        ...maleta,
        status: maleta.status as 'active' | 'expired' | 'finalized',
        total_value: maleta.total_value?.toString() || '0',
        representative_name: maleta.representative?.name || 'Representante não encontrado',
        commission_settings: this.parseCommissionSettings(maleta.commission_settings),
        commission_percentage: this.getCommissionPercentage(maleta.commission_settings),
        items: (maleta.items || []).map((item: any) => ({
          ...item,
          price: item.price.toString(),
          variation_attributes: Array.isArray(item.variation_attributes) ? item.variation_attributes : []
        }))
      }));
    } catch (error) {
      console.error('Erro na busca de maletas:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar maletas",
        variant: "destructive"
      });
      return [];
    }
  }

  async getMaleta(id: string): Promise<Maleta> {
    try {
      const { data, error } = await supabase
        .from('maletas')
        .select(`
          *,
          representative:representatives(name),
          items:maleta_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        console.error('Erro ao buscar maleta:', error);
        throw error;
      }

      return {
        ...data,
        status: data.status as 'active' | 'expired' | 'finalized',
        total_value: data.total_value?.toString() || '0',
        representative_name: data.representative?.name || 'Representante não encontrado',
        commission_settings: this.parseCommissionSettings(data.commission_settings),
        commission_percentage: this.getCommissionPercentage(data.commission_settings),
        items: (data.items || []).map((item: any) => ({
          ...item,
          price: item.price.toString(),
          variation_attributes: Array.isArray(item.variation_attributes) ? item.variation_attributes : []
        }))
      };
    } catch (error) {
      console.error('Erro na busca da maleta:', error);
      throw error;
    }
  }

  async createMaleta(data: CreateMaletaData): Promise<Maleta> {
    try {
      // Get current organization from context
      const orgResponse = await supabase.auth.getUser();
      if (!orgResponse.data.user) {
        throw new Error('Usuário não autenticado');
      }

      // Get user's current organization
      const { data: userOrgs, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', orgResponse.data.user.id)
        .limit(1)
        .single();

      if (userOrgError || !userOrgs) {
        throw new Error('Usuário não pertence a nenhuma organização');
      }

      // Criar maleta
      const { data: maleta, error: maletaError } = await supabase
        .from('maletas')
        .insert({
          representative_id: data.representative_id,
          return_date: data.return_date,
          notes: data.notes,
          commission_settings: data.commission_settings,
          organization_id: userOrgs.organization_id
        })
        .select('*')
        .single();

      if (maletaError) throw maletaError;

      // Criar itens da maleta
      const maletaItems = data.items.map(item => ({
        maleta_id: maleta.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        price: item.price,
        organization_id: userOrgs.organization_id
      }));

      const { error: itemsError } = await supabase
        .from('maleta_items')
        .insert(maletaItems);

      if (itemsError) throw itemsError;

      // Reduzir estoque dos produtos
      for (const item of data.items) {
        const { data: product } = await supabase
          .from('wc_products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = Math.max(0, (product.stock_quantity || 0) - item.quantity);
          
          await supabase
            .from('wc_products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);
        }
      }

      return maleta;
    } catch (error) {
      console.error('Erro ao criar maleta:', error);
      throw error;
    }
  }

  async extendMaletaDeadline(id: string, new_date: string): Promise<Maleta> {
    try {
      const { data, error } = await supabase
        .from('maletas')
        .update({ 
          return_date: new_date + 'T23:59:59',
          extended_date: new_date + 'T23:59:59'
        })
        .eq('id', id)
        .select(`
          *,
          representative:representatives(name),
          items:maleta_items(*)
        `)
        .single();

      if (error) {
        console.error('Erro ao estender prazo:', error);
        throw error;
      }

      toast({
        title: "Prazo Estendido",
        description: "Prazo da maleta foi estendido com sucesso!",
      });

      return {
        ...data,
        status: data.status as 'active' | 'expired' | 'finalized',
        total_value: data.total_value?.toString() || '0',
        representative_name: data.representative?.name || 'Representante não encontrado',
        commission_settings: this.parseCommissionSettings(data.commission_settings),
        commission_percentage: this.getCommissionPercentage(data.commission_settings),
        items: (data.items || []).map((item: any) => ({
          ...item,
          price: item.price.toString()
        }))
      };
    } catch (error) {
      console.error('Erro ao estender prazo:', error);
      throw error;
    }
  }

  async processMaletaReturn(id: string, returnData: Omit<MaletaReturn, 'maleta_id'>): Promise<void> {
    try {
      // Get current organization from context
      const orgResponse = await supabase.auth.getUser();
      if (!orgResponse.data.user) {
        throw new Error('Usuário não autenticado');
      }

      // Get user's current organization
      const { data: userOrgs, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', orgResponse.data.user.id)
        .limit(1)
        .single();

      if (userOrgError || !userOrgs) {
        throw new Error('Usuário não pertence a nenhuma organização');
      }

      // Registrar retorno
      const { error: returnError } = await supabase
        .from('maleta_returns')
        .insert({
          ...returnData,
          maleta_id: id,
          organization_id: userOrgs.organization_id
        });

      if (returnError) throw returnError;

      // Atualizar status da maleta
      const { error: updateError } = await supabase
        .from('maletas')
        .update({ status: 'returned' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Processar produtos retornados (devolver ao estoque)
      const returnedItems = returnData.items_returned || [];
      
      for (const item of returnedItems) {
        const { data: product } = await supabase
          .from('wc_products')
          .select('stock_quantity')
          .eq('id', item.product_id)
          .single();

        if (product) {
          const newStock = (product.stock_quantity || 0) + item.quantity_returned;
          
          await supabase
            .from('wc_products')
            .update({ stock_quantity: newStock })
            .eq('id', item.product_id);
        }
      }

    } catch (error) {
      console.error('Erro ao processar retorno:', error);
      throw error;
    }
  }

  // Representatives CRUD
  async getRepresentatives(page = 1, per_page = 20, search = ''): Promise<Representative[]> {
    try {
      let query = supabase
        .from('representatives')
        .select('*')
        .order('name', { ascending: true });

      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.range((page - 1) * per_page, page * per_page - 1);

      if (error) {
        console.error('Erro ao buscar representantes:', error);
        throw error;
      }

      return (data || []).map(rep => ({
        ...rep,
        commission_settings: this.parseRepresentativeCommissionSettings(rep.commission_settings)
      }));
    } catch (error) {
      console.error('Erro na busca de representantes:', error);
      return [];
    }
  }

  async createRepresentative(data: Partial<Representative>): Promise<Representative> {
    try {
      // Get current organization from context
      const orgResponse = await supabase.auth.getUser();
      if (!orgResponse.data.user) {
        throw new Error('Usuário não autenticado');
      }

      // Get user's current organization
      const { data: userOrgs, error: userOrgError } = await supabase
        .from('user_organizations')
        .select('organization_id')
        .eq('user_id', orgResponse.data.user.id)
        .limit(1)
        .single();

      if (userOrgError || !userOrgs) {
        throw new Error('Usuário não pertence a nenhuma organização');
      }

      const { data: representative, error } = await supabase
        .from('representatives')
        .insert({
          ...data,
          organization_id: userOrgs.organization_id
        })
        .select('*')
        .single();

      if (error) throw error;
      return representative;
    } catch (error) {
      console.error('Erro ao criar representante:', error);
      throw error;
    }
  }

  async updateRepresentative(id: string, data: Partial<Representative>): Promise<Representative> {
    try {
      const updateData: any = { ...data };
      if (data.commission_settings) {
        updateData.commission_settings = JSON.stringify(data.commission_settings);
      }

      const { data: updatedRep, error } = await supabase
        .from('representatives')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar representante:', error);
        throw error;
      }

      toast({
        title: "Representante Atualizado",
        description: "Dados do representante foram atualizados!",
      });

      return {
        ...updatedRep,
        commission_settings: updatedRep.commission_settings as any
      };
    } catch (error) {
      console.error('Erro ao atualizar representante:', error);
      throw error;
    }
  }

  // Helper methods for parsing commission settings
  private parseCommissionSettings(settings: any): { use_global: boolean; tiers: CommissionTier[]; penalty_rate: number } {
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch {
        return {
          use_global: true,
          tiers: DEFAULT_COMMISSION_TIERS,
          penalty_rate: DEFAULT_PENALTY_RATE
        };
      }
    }
    
    if (typeof settings === 'object' && settings !== null) {
      return {
        use_global: settings.use_global ?? true,
        tiers: Array.isArray(settings.tiers) ? settings.tiers : DEFAULT_COMMISSION_TIERS,
        penalty_rate: settings.penalty_rate ?? DEFAULT_PENALTY_RATE
      };
    }
    
    return {
      use_global: true,
      tiers: DEFAULT_COMMISSION_TIERS,
      penalty_rate: DEFAULT_PENALTY_RATE
    };
  }

  private parseRepresentativeCommissionSettings(settings: any): { use_global: boolean; custom_rates?: CommissionTier[]; penalty_rate?: number } {
    if (typeof settings === 'string') {
      try {
        settings = JSON.parse(settings);
      } catch {
        return {
          use_global: true,
          custom_rates: [],
          penalty_rate: DEFAULT_PENALTY_RATE
        };
      }
    }
    
    if (typeof settings === 'object' && settings !== null) {
      return {
        use_global: settings.use_global ?? true,
        custom_rates: Array.isArray(settings.custom_rates) ? settings.custom_rates : [],
        penalty_rate: settings.penalty_rate ?? DEFAULT_PENALTY_RATE
      };
    }
    
    return {
      use_global: true,
      custom_rates: [],
      penalty_rate: DEFAULT_PENALTY_RATE
    };
  }

  private getCommissionPercentage(settings: any): number | undefined {
    const parsed = this.parseCommissionSettings(settings);
    if (!parsed.use_global && parsed.tiers && parsed.tiers.length > 0) {
      return parsed.tiers[0].percentage;
    }
    return undefined;
  }

  // Cálculos de comissão
  calculateCommission(
    amount: number, 
    tiers: CommissionTier[] = DEFAULT_COMMISSION_TIERS,
    delay_days = 0,
    penalty_rate = DEFAULT_PENALTY_RATE
  ): CommissionCalculation {
    // Encontrar tier apropriado
    const tier = tiers.find(t => 
      amount >= t.min_amount && (!t.max_amount || amount <= t.max_amount)
    ) || tiers[tiers.length - 1];

    const commission_amount = (amount * tier.percentage / 100) + tier.bonus;
    const penalty_amount = delay_days > 0 ? (commission_amount * penalty_rate * delay_days / 100) : 0;
    const final_amount = commission_amount - penalty_amount;

    return {
      subtotal: amount,
      commission_tier: tier,
      commission_amount,
      delay_days,
      penalty_amount,
      final_amount: Math.max(0, final_amount)
    };
  }

  calculateReferralBonus(amount: number): number {
    return amount * REFERRAL_COMMISSION_RATE / 100;
  }

  isEligibleForMonthlyBonus(monthly_sales: number): boolean {
    return monthly_sales > MONTHLY_BONUS_THRESHOLD;
  }
}

export const maletasAPI = new MaletasAPI();
