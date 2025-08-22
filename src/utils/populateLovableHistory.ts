
import { supabase } from '@/integrations/supabase/client';

const lovableHistoryItems = [
  // Completed features
  {
    title: "Dashboard Principal",
    description: "Interface principal com visão geral de KPIs, ações rápidas e atividades recentes",
    type: "feature" as const,
    status: "completed" as const,
    category: "ui",
    version: "1.0.0",
    release_date: "2024-01-15",
    priority: 10,
    tags: ["dashboard", "ui", "analytics"],
    is_featured: true
  },
  {
    title: "Sistema de Produtos WooCommerce",
    description: "Sincronização completa de produtos, variações e categorias do WooCommerce",
    type: "feature" as const,
    status: "completed" as const,
    category: "api",
    version: "1.1.0",
    release_date: "2024-02-01",
    priority: 9,
    tags: ["woocommerce", "sync", "produtos"],
    is_featured: true
  },
  {
    title: "Gestão de Maletas",
    description: "Sistema completo para controle de maletas de representantes com comissões",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "1.2.0",
    release_date: "2024-02-15",
    priority: 9,
    tags: ["maletas", "representantes", "comissão"],
    is_featured: true
  },
  {
    title: "Histórico de Estoque",
    description: "Rastreamento completo de movimentações de estoque com integração ao Supabase",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "1.3.0",
    release_date: "2024-03-01",
    priority: 8,
    tags: ["estoque", "histórico", "supabase"],
    is_featured: false
  },
  {
    title: "Sistema de Pedidos",
    description: "Gestão completa de pedidos com sincronização WooCommerce e planos de pagamento",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "1.4.0",
    release_date: "2024-03-15",
    priority: 8,
    tags: ["pedidos", "pagamento", "woocommerce"],
    is_featured: false
  },
  {
    title: "PDV (Ponto de Venda)",
    description: "Interface de vendas com carrinho, filtros por categoria e checkout simplificado",
    type: "feature" as const,
    status: "completed" as const,
    category: "ui",
    version: "1.5.0",
    release_date: "2024-04-01",
    priority: 8,
    tags: ["pdv", "vendas", "checkout"],
    is_featured: true
  },
  {
    title: "Gestão Financeira",
    description: "Controle de transações, receitas, despesas e relatórios financeiros",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "1.6.0",
    release_date: "2024-04-15",
    priority: 7,
    tags: ["financeiro", "transações", "relatórios"],
    is_featured: false
  },
  {
    title: "Sistema Multi-organizacional",
    description: "Suporte completo para múltiplas organizações com isolamento de dados",
    type: "feature" as const,
    status: "completed" as const,
    category: "security",
    version: "2.0.0",
    release_date: "2024-05-01",
    priority: 10,
    tags: ["organizações", "multitenancy", "segurança"],
    is_featured: true
  },
  {
    title: "Relatórios e Analytics",
    description: "Dashboard com gráficos, métricas de performance e análises de vendas",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "2.1.0",
    release_date: "2024-05-15",
    priority: 7,
    tags: ["relatórios", "analytics", "gráficos"],
    is_featured: false
  },
  {
    title: "Gestão de Fornecedores",
    description: "Cadastro e gestão de fornecedores com vínculos aos produtos",
    type: "feature" as const,
    status: "completed" as const,
    category: "general",
    version: "2.2.0",
    release_date: "2024-06-01",
    priority: 6,
    tags: ["fornecedores", "produtos", "gestão"],
    is_featured: false
  },

  // In Progress features
  {
    title: "Otimização de Performance",
    description: "Melhorias na velocidade de carregamento e responsividade da aplicação",
    type: "improvement" as const,
    status: "in_progress" as const,
    category: "performance",
    version: "2.3.0",
    priority: 8,
    tags: ["performance", "otimização", "velocidade"],
    is_featured: false
  },
  {
    title: "Webhooks Avançados",
    description: "Sistema expandido de webhooks para sincronização em tempo real",
    type: "improvement" as const,
    status: "in_progress" as const,
    category: "api",
    version: "2.3.0",
    priority: 7,
    tags: ["webhooks", "sync", "tempo-real"],
    is_featured: false
  },

  // Planned features
  {
    title: "App Mobile Nativo",
    description: "Aplicativo móvel para iOS e Android com funcionalidades principais",
    type: "feature" as const,
    status: "planned" as const,
    category: "general",
    version: "3.0.0",
    priority: 9,
    tags: ["mobile", "ios", "android"],
    is_featured: true
  },
  {
    title: "IA para Análise de Vendas",
    description: "Inteligência artificial para previsões e insights automáticos de vendas",
    type: "feature" as const,
    status: "planned" as const,
    category: "general",
    version: "3.1.0",
    priority: 8,
    tags: ["ia", "machine-learning", "previsões"],
    is_featured: true
  },
  {
    title: "Integração com Marketplace",
    description: "Conexão com Mercado Livre, Amazon e outras plataformas de venda",
    type: "feature" as const,
    status: "planned" as const,
    category: "api",
    version: "3.2.0",
    priority: 7,
    tags: ["marketplace", "mercado-livre", "amazon"],
    is_featured: false
  },
  {
    title: "Sistema de CRM",
    description: "Gestão completa de relacionamento com clientes e leads",
    type: "feature" as const,
    status: "planned" as const,
    category: "general",
    version: "3.3.0",
    priority: 6,
    tags: ["crm", "clientes", "leads"],
    is_featured: false
  },
  {
    title: "Automação de Marketing",
    description: "Campanhas automatizadas por email e WhatsApp",
    type: "feature" as const,
    status: "planned" as const,
    category: "general",
    version: "3.4.0",
    priority: 5,
    tags: ["marketing", "automação", "email", "whatsapp"],
    is_featured: false
  },
  {
    title: "API Pública",
    description: "API REST completa para integrações de terceiros",
    type: "feature" as const,
    status: "planned" as const,
    category: "api",
    version: "4.0.0",
    priority: 7,
    tags: ["api", "rest", "integrações"],
    is_featured: false
  }
];

export async function populateLovableHistory() {
  try {
    console.log('Populando histórico do Lovable...');
    
    for (const item of lovableHistoryItems) {
      const { error } = await supabase
        .from('changelog_items')
        .insert(item);
      
      if (error) {
        console.error('Erro ao inserir item:', error);
      } else {
        console.log(`Item inserido: ${item.title}`);
      }
    }
    
    console.log('Histórico do Lovable populado com sucesso!');
  } catch (error) {
    console.error('Erro ao popular histórico:', error);
  }
}
