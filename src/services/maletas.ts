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
  notes?: string;
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
        representative_name: maleta.representative?.name || 'Representante não encontrado',
        commission_settings: typeof maleta.commission_settings === 'object' ? maleta.commission_settings : {
          use_global: true,
          tiers: DEFAULT_COMMISSION_TIERS,
          penalty_rate: DEFAULT_PENALTY_RATE
        },
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
        representative_name: data.representative?.name || 'Representante não encontrado',
        commission_settings: typeof data.commission_settings === 'object' ? data.commission_settings : {
          use_global: true,
          tiers: DEFAULT_COMMISSION_TIERS,
          penalty_rate: DEFAULT_PENALTY_RATE
        },
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
      // Buscar dados do representante
      const { data: representative, error: repError } = await supabase
        .from('representatives')
        .select('*')
        .eq('id', data.representative_id)
        .single();

      if (repError || !representative) {
        throw new Error('Representante não encontrado');
      }

      // Gerar número da maleta
      const { data: numberResult, error: numberError } = await supabase
        .rpc('generate_maleta_number');

      if (numberError) {
        console.error('Erro ao gerar número da maleta:', numberError);
        throw numberError;
      }

      const maletaNumber = numberResult;

      // Calcular valor total
      const totalValue = data.items.reduce((total, item) => {
        return total + (parseFloat(item.price) * item.quantity);
      }, 0);

      // Buscar configurações de comissão
      const commissionTiers = await this.getCommissionTiers();

      // Criar maleta
      const { data: newMaleta, error: maletaError } = await supabase
        .from('maletas')
        .insert({
          number: maletaNumber,
          representative_id: data.representative_id,
          customer_name: data.customer_name || representative.name,
          customer_email: data.customer_email || representative.email,
          return_date: data.return_date,
          total_value: totalValue.toFixed(2),
          commission_settings: data.commission_settings?.use_global ? {
            use_global: true,
            tiers: commissionTiers,
            penalty_rate: DEFAULT_PENALTY_RATE
          } : {
            use_global: false,
            tiers: [{
              min_amount: 0,
              percentage: data.commission_settings?.custom_percentage || 20,
              bonus: 0,
              label: 'Personalizada'
            }],
            penalty_rate: DEFAULT_PENALTY_RATE
          },
          notes: data.notes
        })
        .select()
        .single();

      if (maletaError) {
        console.error('Erro ao criar maleta:', maletaError);
        throw maletaError;
      }

      // Criar itens da maleta
      const itemsToInsert = data.items.map(item => ({
        maleta_id: newMaleta.id,
        product_id: item.product_id,
        variation_id: item.variation_id,
        name: item.name,
        sku: item.sku,
        price: parseFloat(item.price),
        quantity: item.quantity,
        variation_attributes: item.variation_id ? [{ name: 'Variação', value: `Var ${item.variation_id}` }] : []
      }));

      const { data: items, error: itemsError } = await supabase
        .from('maleta_items')
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error('Erro ao criar itens da maleta:', itemsError);
        // Rollback: deletar maleta criada
        await supabase.from('maletas').delete().eq('id', newMaleta.id);
        throw itemsError;
      }

      toast({
        title: "Maleta Criada",
        description: `Maleta ${maletaNumber} criada com sucesso!`,
      });

      return {
        ...newMaleta,
        representative_name: representative.name,
        commission_settings: newMaleta.commission_settings,
        items: (items || []).map((item: any) => ({
          ...item,
          price: item.price.toString()
        }))
      };
    } catch (error) {
      console.error('Erro ao criar maleta:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar maleta",
        variant: "destructive"
      });
      throw error;
    }
  }

  async extendMaletaDeadline(id: string, new_date: string): Promise<Maleta> {
    try {
      const { data, error } = await supabase
        .from('maletas')
        .update({ 
          return_date: new_date,
          extended_date: new_date 
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
        representative_name: data.representative?.name || 'Representante não encontrado',
        commission_settings: data.commission_settings,
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

  async processMaletaReturn(id: string, returnData: Omit<MaletaReturn, 'maleta_id'>): Promise<MaletaReturn> {
    try {
      // Criar registro de devolução
      const { data: returnRecord, error: returnError } = await supabase
        .from('maleta_returns')
        .insert({
          maleta_id: id,
          items_sold: returnData.items_sold,
          items_returned: returnData.items_returned,
          return_date: returnData.return_date,
          delay_days: returnData.delay_days,
          commission_amount: returnData.commission_amount,
          penalty_amount: returnData.penalty_amount,
          final_amount: returnData.final_amount,
          notes: returnData.notes
        })
        .select()
        .single();

      if (returnError) {
        console.error('Erro ao processar devolução:', returnError);
        throw returnError;
      }

      // Atualizar status dos itens
      for (const soldItem of returnData.items_sold) {
        await supabase
          .from('maleta_items')
          .update({ status: 'sold' })
          .eq('id', soldItem.item_id);
      }

      for (const returnedItem of returnData.items_returned) {
        await supabase
          .from('maleta_items')
          .update({ status: 'returned' })
          .eq('id', returnedItem.item_id);
      }

      // Atualizar status da maleta
      await supabase
        .from('maletas')
        .update({ status: 'finalized' })
        .eq('id', id);

      toast({
        title: "Devolução Processada",
        description: "Devolução foi processada com sucesso!",
      });

      return {
        ...returnRecord,
        items_sold: returnRecord.items_sold as Array<{ item_id: string; quantity_sold: number; }>,
        items_returned: returnRecord.items_returned as Array<{ item_id: string; quantity_returned: number; }>
      };
    } catch (error) {
      console.error('Erro ao processar devolução:', error);
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
        commission_settings: typeof rep.commission_settings === 'object' ? rep.commission_settings : {
          use_global: true,
          custom_rates: [],
          penalty_rate: DEFAULT_PENALTY_RATE
        }
      }));
    } catch (error) {
      console.error('Erro na busca de representantes:', error);
      return [];
    }
  }

  async createRepresentative(data: Partial<Representative>): Promise<Representative> {
    try {
      const { data: newRep, error } = await supabase
        .from('representatives')
        .insert({
          name: data.name!,
          email: data.email!,
          phone: data.phone,
          commission_settings: data.commission_settings || {
            use_global: true,
            custom_rates: [],
            penalty_rate: DEFAULT_PENALTY_RATE
          },
          referrer_id: data.referrer_id
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar representante:', error);
        throw error;
      }

      toast({
        title: "Representante Criado",
        description: `${data.name} foi cadastrado como representante!`,
      });

      return {
        ...newRep,
        commission_settings: newRep.commission_settings as any
      };
    } catch (error) {
      console.error('Erro ao criar representante:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar representante",
        variant: "destructive"
      });
      throw error;
    }
  }

  async updateRepresentative(id: string, data: Partial<Representative>): Promise<Representative> {
    try {
      const { data: updatedRep, error } = await supabase
        .from('representatives')
        .update(data)
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