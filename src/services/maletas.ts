import { supabase } from '@/integrations/supabase/client';

export interface Representative {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  commission_rate?: number;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

export interface MaletaItem {
  id: string;
  maleta_id: string;
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  quantity: number;
  price: string;
  variation_attributes?: Array<{
    name: string;
    value: string;
  }>;
  status?: 'consigned' | 'sold' | 'returned';
  organization_id?: string;
}

export interface Maleta {
  id: string;
  number: string;
  representative_id: string;
  representative_name: string;
  customer_name?: string;
  customer_email?: string;
  departure_date?: string;
  return_date: string;
  extended_date?: string;
  status: 'active' | 'returned' | 'overdue' | 'finalized';
  total_value: string;
  items: MaletaItem[];
  commission_settings: any;
  commission_percentage?: number;
  order_number?: number;
  order_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  organization_id: string;
  representative?: Representative;
}

export interface CreateMaletaData {
  representative_id: string;
  return_date: string;
  items: Array<{
    product_id: number;
    variation_id?: number;
    name: string;
    sku: string;
    quantity: number;
    price: string;
  }>;
  commission_settings?: any;
  notes?: string;
}

export interface MaletaReturn {
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
  organization_id: string;
}

export interface CommissionCalculation {
  base_amount: number;
  commission_rate: number;
  commission_amount: number;
  penalty_amount: number;
  final_amount: number;
  delay_days: number;
}

// Get current organization ID helper
const getCurrentOrganizationId = () => {
  const savedOrgId = localStorage.getItem('currentOrganizationId');
  if (!savedOrgId) {
    throw new Error('Nenhuma organização selecionada');
  }
  return savedOrgId;
};

class MaletasAPI {
  async getMaletas(page = 1, status = '', representative_id = '') {
    const organizationId = getCurrentOrganizationId();
    
    console.log('Buscando maletas para organização:', organizationId);
    
    let query = supabase
      .from('maletas')
      .select(`
        *,
        representative:representatives(*)
      `, { count: 'exact' })
      .eq('organization_id', organizationId);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (representative_id) {
      query = query.eq('representative_id', representative_id);
    }

    const from = (page - 1) * 20;
    const to = from + 19;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar maletas:', error);
      throw error;
    }

    console.log('Maletas encontradas:', data?.length || 0, 'de', count || 0);

    return {
      data: data || [],
      total: count || 0,
      pages: Math.ceil((count || 0) / 20)
    };
  }

  async getMaleta(id: string) {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('maletas')
      .select(`
        *,
        representative:representatives(*),
        items:maleta_items(*)
      `)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .single();

    if (error) {
      console.error('Erro ao buscar maleta:', error);
      throw error;
    }
    return data;
  }

  async createMaleta(maletaData: CreateMaletaData) {
    const organizationId = getCurrentOrganizationId();
    
    const maleta = {
      representative_id: maletaData.representative_id,
      return_date: maletaData.return_date,
      commission_settings: maletaData.commission_settings || { use_global: true },
      notes: maletaData.notes,
      organization_id: organizationId
    };

    const { data: maletaResult, error: maletaError } = await supabase
      .from('maletas')
      .insert(maleta)
      .select()
      .single();

    if (maletaError) {
      console.error('Erro ao criar maleta:', maletaError);
      throw maletaError;
    }

    // Insert maleta items
    const items = maletaData.items.map(item => ({
      maleta_id: maletaResult.id,
      product_id: item.product_id,
      variation_id: item.variation_id,
      name: item.name,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      organization_id: organizationId
    }));

    const { error: itemsError } = await supabase
      .from('maleta_items')
      .insert(items);

    if (itemsError) {
      console.error('Erro ao inserir itens da maleta:', itemsError);
      throw itemsError;
    }

    return maletaResult;
  }

  async extendMaletaDeadline(id: string, new_date: string) {
    const organizationId = getCurrentOrganizationId();
    
    const { data, error } = await supabase
      .from('maletas')
      .update({ return_date: new_date })
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao estender prazo:', error);
      throw error;
    }
    return data;
  }

  async processMaletaReturn(id: string, returnData: Omit<MaletaReturn, 'maleta_id'>) {
    const organizationId = getCurrentOrganizationId();
    
    const returnRecord = {
      maleta_id: id,
      ...returnData,
      organization_id: organizationId
    };

    const { data, error } = await supabase
      .from('maleta_returns')
      .insert(returnRecord)
      .select()
      .single();

    if (error) {
      console.error('Erro ao processar devolução:', error);
      throw error;
    }

    // Update maleta status
    await supabase
      .from('maletas')
      .update({ status: 'returned' })
      .eq('id', id)
      .eq('organization_id', organizationId);

    return data;
  }

  // Representatives methods
  async getRepresentatives(page = 1, search = '') {
    const organizationId = getCurrentOrganizationId();
    
    let query = supabase
      .from('representatives')
      .select('*', { count: 'exact' })
      .eq('organization_id', organizationId);

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const from = (page - 1) * 20;
    const to = from + 19;
    query = query.range(from, to).order('name');

    const { data, error, count } = await query;

    if (error) {
      console.error('Erro ao buscar representantes:', error);
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      pages: Math.ceil((count || 0) / 20)
    };
  }

  async createRepresentative(data: Partial<Representative>) {
    const organizationId = getCurrentOrganizationId();
    
    const representative = {
      ...data,
      organization_id: organizationId
    };

    const { data: result, error } = await supabase
      .from('representatives')
      .insert(representative)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar representante:', error);
      throw error;
    }
    return result;
  }

  async updateRepresentative(id: string, data: Partial<Representative>) {
    const organizationId = getCurrentOrganizationId();
    
    const { data: result, error } = await supabase
      .from('representatives')
      .update(data)
      .eq('id', id)
      .eq('organization_id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Erro ao atualizar representante:', error);
      throw error;
    }
    return result;
  }

  // Commission calculation methods
  calculateCommission(
    amount: number,
    tiers?: any[],
    delay_days = 0,
    penalty_rate = 0.02
  ): CommissionCalculation {
    let commission_rate = 0;
    let commission_amount = 0;

    if (tiers && tiers.length > 0) {
      // Custom commission tiers
      for (const tier of tiers) {
        if (amount >= tier.min_amount && (tier.max_amount === null || amount <= tier.max_amount)) {
          commission_rate = tier.percentage / 100;
          commission_amount = (amount * commission_rate) + (tier.bonus || 0);
          break;
        }
      }
    } else {
      // Global commission rules
      if (amount <= 200) {
        commission_rate = 0;
        commission_amount = 0;
      } else if (amount <= 1500) {
        commission_rate = 0.20;
        commission_amount = amount * 0.20 + 50;
      } else if (amount <= 3000) {
        commission_rate = 0.30;
        commission_amount = amount * 0.30 + 100;
      } else {
        commission_rate = 0.40;
        commission_amount = amount * 0.40 + 200;
      }
    }

    // Apply penalty for late returns
    const penalty_amount = delay_days > 0 ? commission_amount * penalty_rate * delay_days : 0;
    const final_amount = Math.max(0, commission_amount - penalty_amount);

    return {
      base_amount: amount,
      commission_rate,
      commission_amount,
      penalty_amount,
      final_amount,
      delay_days
    };
  }

  calculateReferralBonus(amount: number): number {
    return amount * 0.05; // 5% referral bonus
  }

  isEligibleForMonthlyBonus(monthly_sales: number): boolean {
    return monthly_sales >= 10000; // R$ 10,000 monthly threshold
  }
}

export const maletasAPI = new MaletasAPI();
