
export interface Representative {
  id: number;
  name: string;
  email: string;
  phone?: string;
  commission_settings?: {
    use_global: boolean;
    custom_rates?: CommissionTier[];
    penalty_rate?: number; // % por dia de atraso
  };
  referrer_id?: number; // ID do representante que indicou
  total_sales?: number;
  created_at: string;
}

export interface CommissionTier {
  min_amount: number;
  max_amount?: number;
  percentage: number;
  bonus: number;
  label: string;
}

export interface MaletaItem {
  id: number;
  product_id: number;
  variation_id?: number;
  name: string;
  sku: string;
  price: string;
  quantity: number;
  status: 'consigned' | 'sold' | 'returned';
  variation_attributes?: Array<{ name: string; value: string }>;
}

export interface Maleta {
  id: number;
  number: string;
  representative_id: number;
  representative_name: string;
  customer_id: number;
  customer_name: string;
  customer_email: string;
  status: 'active' | 'expired' | 'finalized';
  departure_date: string;
  return_date: string;
  extended_date?: string;
  items: MaletaItem[];
  total_value: string;
  commission_percentage?: number;
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
  maleta_id: number;
  items_sold: Array<{
    item_id: number;
    quantity_sold: number;
  }>;
  items_returned: Array<{
    item_id: number;
    quantity_returned: number;
  }>;
  return_date: string;
  delay_days: number;
  commission_amount: number;
  penalty_amount: number;
  final_amount: number;
  notes?: string;
}

export interface CreateMaletaData {
  representative_id: number;
  customer_id: number;
  return_date: string;
  items: Array<{
    product_id: number;
    variation_id?: number;
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
  private config: any = null;

  constructor() {
    this.loadConfig();
  }

  private loadConfig() {
    const savedConfig = localStorage.getItem('maletas_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  public setConfig(config: any) {
    this.config = config;
    localStorage.setItem('maletas_config', JSON.stringify(config));
  }

  public getConfig() {
    return this.config;
  }

  // Maletas CRUD
  async getMaletas(page = 1, per_page = 20, status = '', representative_id = 0): Promise<Maleta[]> {
    // Implementar integração com WooCommerce usando meta_data
    // Por enquanto retorna dados mockados
    const mockMaletas: Maleta[] = [];
    return mockMaletas;
  }

  async getMaleta(id: number): Promise<Maleta> {
    // Implementar busca específica
    throw new Error('Método não implementado');
  }

  async createMaleta(data: CreateMaletaData): Promise<Maleta> {
    // Criar pedido no WooCommerce com status 'consignment'
    // Reduzir estoque dos produtos
    // Salvar dados específicos em meta_data
    throw new Error('Método não implementado');
  }

  async extendMaletaDeadline(id: number, new_date: string): Promise<Maleta> {
    // Estender prazo da maleta
    throw new Error('Método não implementado');
  }

  async processMaletaReturn(id: number, returnData: Omit<MaletaReturn, 'maleta_id'>): Promise<MaletaReturn> {
    // Processar devolução e criar pedido final
    throw new Error('Método não implementado');
  }

  // Representatives CRUD
  async getRepresentatives(page = 1, per_page = 20, search = ''): Promise<Representative[]> {
    // Buscar representantes (pode ser integrado com customers do WooCommerce)
    const mockReps: Representative[] = [];
    return mockReps;
  }

  async createRepresentative(data: Partial<Representative>): Promise<Representative> {
    throw new Error('Método não implementado');
  }

  async updateRepresentative(id: number, data: Partial<Representative>): Promise<Representative> {
    throw new Error('Método não implementado');
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
