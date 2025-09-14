
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import OrderCard from "@/components/orders/OrderCard";
import OrderDialog from "@/components/orders/OrderDialog";
import OrderDetails from "@/components/orders/OrderDetails";
import { useLocalOrders } from "@/hooks/useLocalOrders";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewMode } from "@/hooks/useViewMode";
import ViewModeToggle from "@/components/ui/view-mode-toggle";

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<any>(null);

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { data: orders = [], isLoading } = useLocalOrders();
  const { isConfigured } = useWooCommerceConfig();
  const { viewMode, toggleViewMode } = useViewMode('orders');

  const filteredOrders = orders.filter((order) =>
    order.number?.toString().includes(searchTerm) ||
    order.billing?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.billing?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.billing?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  const handleEditOrder = (order: any) => {
    setEditingOrder(order);
    setIsDialogOpen(true);
  };

  const handleCloseEdit = () => {
    setIsDialogOpen(false);
    setEditingOrder(null);
  };

  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
    setSelectedOrder(null);
  };

  if (orgLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyWooCommerceState
          title="Nenhuma Organização Selecionada"
          description="Selecione uma organização para ver os pedidos."
          showConfigButton={false}
        />
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="container mx-auto px-4 py-6">
        <EmptyWooCommerceState
          title="WooCommerce Não Configurado"
          description="Configure sua conexão com o WooCommerce para começar a gerenciar pedidos."
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pedidos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seus pedidos
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Novo Pedido
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Pedidos</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seus pedidos
            </p>
          </div>
        </div>
        <EmptyWooCommerceState
          title="Nenhum Pedido Encontrado"
          description="Sincronize seus pedidos do WooCommerce ou adicione pedidos manualmente."
          showConfigButton={false}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Pedidos</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seus pedidos ({orders.length} pedidos)
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Pedido
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <Input
          placeholder="Buscar por número, cliente ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        <ViewModeToggle 
          viewMode={viewMode} 
          onToggle={toggleViewMode}
          className="w-full sm:w-auto"
        />
      </div>

      <div className={viewMode === 'grid' 
        ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
        : "space-y-4"
      }>
        {filteredOrders.map((order) => (
          <OrderCard 
            key={order.id} 
            order={order} 
            viewMode={viewMode}
            onView={handleViewOrder}
            onEdit={handleEditOrder}
          />
        ))}
      </div>

      {filteredOrders.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum pedido encontrado para "{searchTerm}"
          </p>
        </div>
      )}

      <OrderDialog
        open={isDialogOpen}
        onOpenChange={editingOrder ? handleCloseEdit : setIsDialogOpen}
        mode={editingOrder ? "edit" : "create"}
        order={editingOrder}
      />

      <OrderDetails
        open={isDetailsOpen}
        onOpenChange={handleCloseDetails}
        order={selectedOrder}
      />
    </div>
  );
};

export default Orders;
