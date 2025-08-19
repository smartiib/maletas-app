
import KPICard from "@/components/dashboard/KPICard";
import SalesChart from "@/components/dashboard/SalesChart";
import RecentActivity from "@/components/dashboard/RecentActivity";
import QuickActions from "@/components/dashboard/QuickActions";
import { 
  useWooCommerceFilteredProducts, 
  useWooCommerceFilteredOrders, 
  useWooCommerceFilteredCustomers 
} from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState"; // fixed: named import
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

const Dashboard = () => {
  // Get organization first so we can pass its id to the hooks
  const { currentOrganization, loading: orgLoading } = useOrganization();

  // Pass organizationId expected by filtered hooks (fallback to empty string to satisfy types)
  const { data: products = [], isLoading: productsLoading } = useWooCommerceFilteredProducts(currentOrganization?.id ?? "");
  const { data: orders = [], isLoading: ordersLoading } = useWooCommerceFilteredOrders(currentOrganization?.id ?? "");
  const { data: customers = [], isLoading: customersLoading } = useWooCommerceFilteredCustomers(currentOrganization?.id ?? "");

  const { isConfigured } = useWooCommerceConfig();
  
  const isLoading = productsLoading || ordersLoading || customersLoading || orgLoading;

  // Calculate metrics
  const totalRevenue = orders.reduce((sum, order) => sum + (parseFloat(order.total?.toString() || '0') || 0), 0);
  const lowStockProducts = products.filter(product => 
    product.manage_stock && (product.stock_quantity || 0) < 10
  ).length;

  if (orgLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
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

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
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
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo à {currentOrganization.name}
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
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo à {currentOrganization.name} - Visão geral do seu negócio
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
        <SalesChart orders={orders} />
        <RecentActivity orders={orders} customers={customers} products={products} />
      </div>

      <QuickActions />
    </div>
  );
};

export default Dashboard;

