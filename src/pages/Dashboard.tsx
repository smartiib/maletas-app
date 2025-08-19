
import { KPICard } from "@/components/dashboard/KPICard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { 
  useWooCommerceFilteredProducts, 
  useWooCommerceFilteredOrders, 
  useWooCommerceFilteredCustomers 
} from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, Users, Package, TrendingUp } from "lucide-react";

const Dashboard = () => {
  const { data: products = [], isLoading: productsLoading } = useWooCommerceFilteredProducts();
  const { data: orders = [], isLoading: ordersLoading } = useWooCommerceFilteredOrders();
  const { data: customers = [], isLoading: customersLoading } = useWooCommerceFilteredCustomers();
  const { isConfigured } = useWooCommerceConfig();
  const { currentOrganization, loading: orgLoading } = useOrganization();
  
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
          icon={<TrendingUp className="h-4 w-4" />}
          trend={orders.length > 0 ? "+12.3%" : "0%"}
        />
        <KPICard
          title="Pedidos"
          value={isLoading ? "..." : orders.length.toString()}
          icon={<ShoppingBag className="h-4 w-4" />}
          trend={orders.length > 0 ? "+5.2%" : "0%"}
        />
        <KPICard
          title="Produtos"
          value={isLoading ? "..." : products.length.toString()}
          icon={<Package className="h-4 w-4" />}
          trend={`${lowStockProducts} com estoque baixo`}
        />
        <KPICard
          title="Clientes"
          value={isLoading ? "..." : customers.length.toString()}
          icon={<Users className="h-4 w-4" />}
          trend={customers.length > 0 ? "+8.1%" : "0%"}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SalesChart />
        <RecentActivity />
      </div>

      <QuickActions />
    </div>
  );
};

export default Dashboard;
