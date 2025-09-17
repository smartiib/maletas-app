
import KPICard from "@/components/dashboard/KPICard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { useLocalProducts } from "@/hooks/useLocalProducts";
import { useLocalOrders } from "@/hooks/useLocalOrders";
import { useLocalCustomers } from "@/hooks/useLocalCustomers";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationAuthContext } from "@/contexts/OrganizationAuthContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { organizationUser, isOrganizationAuthenticated } = useOrganizationAuthContext();

  // Determinar se é super admin
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

  // These hooks use the organization context internally, no need to pass organizationId
  const { data: products = [], isLoading: productsLoading } = useLocalProducts();
  const { data: orders = [], isLoading: ordersLoading } = useLocalOrders();
  const { data: customers = [], isLoading: customersLoading } = useLocalCustomers();

  const { isConfigured } = useWooCommerceConfig();
  
  const isLoading = productsLoading || ordersLoading || customersLoading || orgLoading;

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total?.toString() || '0') || 0), 0);
  const lowStockProducts = products.filter(product => 
    product.manage_stock && (product.stock_quantity || 0) < 10
  ).length;

  // Determinar nome da organização baseado no tipo de usuário
  let organizationName = 'Sistema';
  let welcomeMessage = 'Visão geral do seu negócio';

  if (isOrganizationAuthenticated && organizationUser) {
    organizationName = 'Loja';
    welcomeMessage = 'Painel administrativo da loja';
  } else if (isSuperAdmin && currentOrganization) {
    organizationName = currentOrganization.name;
    welcomeMessage = 'Visão geral do seu negócio';
  }

  if (orgLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  // Para usuários organizacionais, não verificar currentOrganization
  if (isSuperAdmin && !currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyWooCommerceState
          title="Nenhuma Organização Selecionada"
          description="Selecione uma organização para ver o dashboard."
          showConfigButton={false}
        />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo à {organizationName}
          </p>
        </div>
        <EmptyWooCommerceState
          title="Configure o WooCommerce"
          description="Configure sua conexão com o WooCommerce para começar a ver os dados do seu negócio."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo à {organizationName} - {welcomeMessage}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Receita Total"
          value={isLoading ? "..." : `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
          icon={TrendingUp}
          trend="+12.3%"
        />
        <KPICard
          title="Pedidos"
          value={isLoading ? "..." : orders.length.toString()}
          icon={ShoppingBag}
          trend="+5.2%"
        />
        <KPICard
          title="Produtos"
          value={isLoading ? "..." : products.length.toString()}
          icon={Package}
          trend={`${lowStockProducts} com estoque baixo`}
        />
        <KPICard
          title="Clientes"
          value={isLoading ? "..." : customers.length.toString()}
          icon={Users}
          trend="+8.1%"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart orders={orders.map(order => ({
          ...order,
          id: order.id,
          parent_id: 0,
          number: order.order_number,
          order_key: `wc_order_${order.id}`,
          created_via: "manual",
          version: "1.0",
          status: order.status as any,
          currency: order.currency || "BRL",
          date_created: order.date_created || new Date().toISOString(),
          date_modified: order.date_modified || new Date().toISOString(),
          discount_total: "0",
          discount_tax: "0",
          shipping_total: "0",
          shipping_tax: "0",
          cart_tax: "0",
          total: order.total?.toString() || "0",
          total_tax: "0",
          prices_include_tax: false,
          customer_id: order.customer_id || 0,
          customer_ip_address: "",
          customer_user_agent: "",
          customer_note: order.notes || "",
          billing: order.billing_address || {} as any,
          shipping: order.shipping_address || {} as any,
          payment_method: order.payment_method || "",
          payment_method_title: order.payment_method || "",
          transaction_id: "",
          date_paid: null,
          date_completed: null,
          cart_hash: "",
          meta_data: [],
          line_items: order.line_items || [],
          tax_lines: [],
          shipping_lines: [],
          fee_lines: [],
          coupon_lines: [],
          refunds: []
        }))} />
        <RecentActivity orders={orders} customers={customers} products={products} />
      </div>

      <QuickActions />
    </div>
  );
};

export default Dashboard;
