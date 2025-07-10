export const helpContent = {
  dashboard: {
    title: "Visão Geral do Sistema",
    description: "Acompanhe o desempenho geral da sua loja com métricas em tempo real, vendas, pedidos e estoque.",
    overview: "O Dashboard oferece uma visão consolidada de todas as operações da sua loja, permitindo monitorar vendas, pedidos, estoque e clientes de forma rápida e eficiente.",
    features: [
      {
        title: "KPIs em Tempo Real",
        description: "Visualize métricas importantes como vendas da semana, pedidos pendentes, produtos em falta e novos clientes."
      },
      {
        title: "Gráfico de Vendas",
        description: "Acompanhe a evolução das vendas ao longo do tempo com gráficos interativos."
      },
      {
        title: "Alertas Importantes",
        description: "Receba notificações sobre produtos com estoque baixo e pedidos que precisam de atenção."
      },
      {
        title: "Produtos Mais Vendidos",
        description: "Identifique quais produtos têm melhor performance de vendas."
      },
      {
        title: "Atividade Recente",
        description: "Veja as últimas movimentações de pedidos, clientes e produtos."
      },
      {
        title: "Ações Rápidas",
        description: "Acesse rapidamente funcionalidades importantes como criar novo pedido ou gerenciar estoque."
      }
    ]
  },
  produtos: {
    title: "Gerenciamento de Produtos",
    description: "Nesta página você pode visualizar, criar, editar e gerenciar todo o catálogo de produtos da sua loja integrada com WooCommerce.",
    overview: "Esta página permite o gerenciamento completo do catálogo de produtos, incluindo produtos simples e variáveis, com controle de estoque, preços e informações detalhadas.",
    features: [
      {
        title: "Filtros Avançados",
        description: "Utilize os filtros para localizar produtos específicos por nome, SKU ou status de publicação."
      },
      {
        title: "Criar Produto",
        description: "Clique no botão 'Novo Produto' para adicionar um novo item ao catálogo com todas as informações necessárias."
      },
      {
        title: "Editar Produto",
        description: "Clique no botão 'Editar' para modificar informações, preços, estoque e outras propriedades do produto."
      },
      {
        title: "Visualizar Detalhes",
        description: "Use 'Ver Detalhes' para visualizar informações completas do produto, incluindo variações se aplicável."
      },
      {
        title: "Controle de Estoque",
        description: "Monitore o status do estoque com indicadores visuais para produtos em falta, estoque baixo ou disponível."
      },
      {
        title: "Produtos Variáveis",
        description: "Expanda produtos variáveis para visualizar e gerenciar cada variação individualmente com seus próprios preços e estoque."
      }
    ]
  },
  estoque: {
    title: "Controle de Estoque",
    description: "Monitore e gerencie o estoque de todos os produtos, incluindo histórico de movimentações e alertas de estoque baixo.",
    overview: "Esta página oferece controle completo sobre o estoque dos produtos, permitindo monitorar quantidades, visualizar histórico de movimentações e identificar produtos que precisam de reposição.",
    features: [
      {
        title: "Busca e Filtros",
        description: "Encontre produtos rapidamente usando a busca por nome/SKU ou filtrando por categoria."
      },
      {
        title: "Status do Estoque",
        description: "Visualize o status atual do estoque com indicadores de cores: vermelho (sem estoque), amarelo (estoque baixo), verde (disponível)."
      },
      {
        title: "Produtos Variáveis",
        description: "Expanda produtos variáveis para ver o estoque individual de cada variação e o total consolidado."
      },
      {
        title: "Histórico de Movimentações",
        description: "Acesse o histórico completo de entradas e saídas de cada produto para rastreabilidade total."
      },
      {
        title: "Alertas Automáticos",
        description: "Receba alertas visuais quando produtos atingem níveis críticos de estoque."
      },
      {
        title: "Integração WooCommerce",
        description: "O estoque é sincronizado automaticamente com sua loja WooCommerce através de webhooks."
      }
    ]
  },
  pedidos: {
    title: "Gerenciamento de Pedidos",
    description: "Visualize, processe e gerencie todos os pedidos da sua loja com informações detalhadas de clientes, produtos e pagamentos.",
    overview: "Centralize o gerenciamento de todos os pedidos da sua loja, desde a visualização até o processamento completo, com informações detalhadas de clientes e produtos.",
    features: [
      {
        title: "Filtros por Status",
        description: "Filtre pedidos por status (pendente, processando, completo, cancelado) para organizar o fluxo de trabalho."
      },
      {
        title: "Busca Avançada",
        description: "Encontre pedidos específicos buscando por nome do cliente, email ou número do pedido."
      },
      {
        title: "Informações Completas",
        description: "Visualize dados completos: cliente, produtos, valores, método de pagamento e datas."
      },
      {
        title: "Criar Novo Pedido",
        description: "Use o botão 'Novo Pedido' para ser redirecionado ao POS e criar pedidos manualmente."
      },
      {
        title: "Editar Pedidos",
        description: "Modifique informações de pedidos existentes como status, dados do cliente ou observações."
      },
      {
        title: "Métricas Importantes",
        description: "Acompanhe KPIs como total de pedidos, pedidos pendentes e receita total em tempo real."
      }
    ]
  },
  clientes: {
    title: "Base de Clientes",
    description: "Gerencie sua base de clientes, incluindo informações de contato, histórico de compras e sistema de representantes para maletas.",
    overview: "Esta página permite o gerenciamento completo da base de clientes, incluindo funcionalidades especiais para representantes do sistema de maletas.",
    features: [
      {
        title: "Filtros Inteligentes",
        description: "Filtre a visualização entre todos os clientes, apenas clientes ou apenas representantes."
      },
      {
        title: "Busca Rápida",
        description: "Encontre clientes rapidamente por nome, email ou telefone."
      },
      {
        title: "Sistema de Representantes",
        description: "Marque clientes como representantes e sincronize automaticamente com o sistema de maletas."
      },
      {
        title: "Informações Detalhadas",
        description: "Visualize dados completos: contato, localização, histórico de pedidos e total gasto."
      },
      {
        title: "Criar Maleta",
        description: "Crie maletas diretamente para clientes marcados como representantes."
      },
      {
        title: "Métricas de Clientes",
        description: "Acompanhe total de clientes, representantes ativos e ticket médio de compras."
      }
    ]
  },
  pos: {
    title: "Ponto de Venda (POS)",
    description: "Sistema de ponto de venda para criar pedidos rapidamente, calcular totais e processar vendas diretamente na loja.",
    overview: "O POS é um sistema completo de ponto de venda que permite criar pedidos rapidamente, adicionar produtos, calcular totais e processar vendas de forma eficiente.",
    features: [
      {
        title: "Busca de Produtos",
        description: "Encontre produtos rapidamente por nome, SKU ou usando o scanner de código de barras."
      },
      {
        title: "Carrinho Dinâmico",
        description: "Adicione produtos ao carrinho, ajuste quantidades e visualize o total em tempo real."
      },
      {
        title: "Categorias Rápidas",
        description: "Navegue por categorias de produtos para encontrar itens mais rapidamente."
      },
      {
        title: "Cálculo Automático",
        description: "O sistema calcula automaticamente subtotais, impostos e total final do pedido."
      },
      {
        title: "Dados do Cliente",
        description: "Adicione informações do cliente ou selecione de clientes existentes."
      },
      {
        title: "Finalização Rápida",
        description: "Processe a venda rapidamente escolhendo método de pagamento e finalizando o pedido."
      }
    ]
  },
  maletas: {
    title: "Gestão de Maletas",
    description: "Sistema completo para gerenciar maletas de representantes, incluindo produtos, prazos, devoluções e cálculo de comissões.",
    overview: "Esta página permite o controle completo do sistema de maletas, desde a criação até o retorno, incluindo gestão de produtos, prazos e cálculo automático de comissões.",
    features: [
      {
        title: "Filtros por Status",
        description: "Filtre maletas por status (ativa, vencida, finalizada) ou por representante específico."
      },
      {
        title: "Criar Nova Maleta",
        description: "Crie maletas selecionando representante, produtos, definindo prazos e configurações de comissão."
      },
      {
        title: "Controle de Prazos",
        description: "Monitore datas de saída e retorno com alertas automáticos para maletas próximas do vencimento."
      },
      {
        title: "Gestão de Produtos",
        description: "Adicione produtos às maletas com controle de quantidade e valores individuais."
      },
      {
        title: "Processo de Retorno",
        description: "Registre devoluções, produtos vendidos e calcule comissões e multas automaticamente."
      },
      {
        title: "Relatórios Financeiros",
        description: "Acompanhe performance de representantes, comissões pagas e histórico de devoluções."
      }
    ]
  },
  relatorios: {
    title: "Relatórios e Análises",
    description: "Acesse relatórios detalhados de vendas, produtos, clientes e performance geral da loja com gráficos e métricas importantes.",
    overview: "Central de relatórios com análises detalhadas do desempenho da loja, incluindo vendas, produtos mais vendidos, performance de clientes e métricas financeiras.",
    features: [
      {
        title: "Relatórios de Vendas",
        description: "Visualize relatórios detalhados de vendas por período com gráficos de evolução temporal."
      },
      {
        title: "Análise de Produtos",
        description: "Identifique produtos mais vendidos, com maior receita e performance de estoque."
      },
      {
        title: "Performance de Clientes",
        description: "Analise comportamento de compra, clientes mais valiosos e segmentação por valor gasto."
      },
      {
        title: "Filtros por Período",
        description: "Customize relatórios por períodos específicos: hoje, semana, mês ou intervalo personalizado."
      },
      {
        title: "Métricas Financeiras",
        description: "Acompanhe receita total, ticket médio, crescimento percentual e comparações históricas."
      },
      {
        title: "Exportação de Dados",
        description: "Exporte relatórios em diversos formatos para análises externas ou apresentações."
      }
    ]
  }
};