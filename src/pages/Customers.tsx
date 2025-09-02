
import { useState } from "react";
import { Plus, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ViewModeToggle from "@/components/ui/view-mode-toggle";
import { Badge } from "@/components/ui/badge";
import CustomerCard from "@/components/customers/CustomerCard";
import CustomerDialog from "@/components/customers/CustomerDialog";
import CustomerDetails from "@/components/customers/CustomerDetails";
import { BirthdayWidget } from "@/components/customers/BirthdayWidget";
import { BirthdayActions } from "@/components/customers/BirthdayActions";
import { BirthdayCampaignDialog } from "@/components/customers/BirthdayCampaignDialog";
import { useWooCommerceFilteredCustomers } from "@/hooks/useWooCommerceFiltered";
import { useWooCommerceConfig } from "@/hooks/useWooCommerce";
import { useOrganization } from "@/contexts/OrganizationContext";
import { EmptyWooCommerceState } from "@/components/woocommerce/EmptyWooCommerceState";
import { Skeleton } from "@/components/ui/skeleton";
import { useViewMode } from "@/hooks/useViewMode";
import { useBirthdays } from "@/hooks/useBirthdays";
import { getMonthOptions } from "@/utils/dateUtils";
import { formatBRL } from "@/utils/currency";

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  const [isCampaignDialogOpen, setIsCampaignDialogOpen] = useState(false);
  const [birthdayFilter, setBirthdayFilter] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");

  const { currentOrganization, loading: orgLoading } = useOrganization();
  const { data: customers = [], isLoading } = useWooCommerceFilteredCustomers();
  const { isConfigured } = useWooCommerceConfig();
  const { viewMode, setViewMode } = useViewMode('customers');
  const { 
    birthdayStats, 
    filterCustomersByBirthday, 
    prepareBirthdayCampaignData,
    getBirthdaysToday,
    getUpcomingBirthdays,
    getBirthdaysThisMonth,
    getBirthdaysByMonth
  } = useBirthdays(customers);

  // Aplicar filtros
  let filteredCustomers = customers.filter((customer) =>
    customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Aplicar filtros de aniversário
  if (birthdayFilter) {
    switch (birthdayFilter) {
      case 'today':
        filteredCustomers = getBirthdaysToday();
        break;
      case 'upcoming':
        filteredCustomers = getUpcomingBirthdays(7);
        break;
      case 'thisMonth':
        filteredCustomers = getBirthdaysThisMonth();
        break;
      case 'specificMonth':
        if (selectedMonth) {
          const monthIndex = parseInt(selectedMonth);
          filteredCustomers = getBirthdaysByMonth(monthIndex);
        }
        break;
    }
    
    // Aplicar busca por texto após filtro de aniversário
    if (searchTerm) {
      filteredCustomers = filteredCustomers.filter((customer) =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  }

  const monthOptions = getMonthOptions();

  const isRepresentative = (customer: any) => customer?.meta_data?.some((m: any) => m.key === 'is_representative' && (m.value === true || m.value === '1' || m.value === 1));
  const totalCustomers = customers.length;
  const representativesCount = customers.filter(isRepresentative).length;
  const totalRevenue = customers.reduce((sum, c) => sum + (parseFloat(c.total_spent || '0') || 0), 0);
  const handleShowBirthdays = (filter: 'today' | 'upcoming' | 'thisMonth') => {
    setBirthdayFilter(filter);
    setSelectedMonth("");
  };

  const clearFilters = () => {
    setBirthdayFilter("");
    setSelectedMonth("");
    setSearchTerm("");
  };

  const handleView = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDetailsOpen(true);
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsEditDialogOpen(true);
  };

  const getCampaignCustomers = () => {
    if (birthdayFilter === 'today') return getBirthdaysToday();
    if (birthdayFilter === 'upcoming') return getUpcomingBirthdays(7);
    if (birthdayFilter === 'thisMonth') return getBirthdaysThisMonth();
    if (birthdayFilter === 'specificMonth' && selectedMonth) {
      return getBirthdaysByMonth(parseInt(selectedMonth));
    }
    return filteredCustomers;
  };

  if (orgLoading) {
    return (
      <div className="space-y-6">
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
      <EmptyWooCommerceState
        title="Nenhuma Organização Selecionada"
        description="Selecione uma organização para ver os clientes."
        showConfigButton={false}
      />
    );
  }

  if (!isConfigured) {
    return (
      <EmptyWooCommerceState
        title="WooCommerce Não Configurado"
        description="Configure sua conexão com o WooCommerce para começar a gerenciar clientes."
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seus clientes
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
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

  if (customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Gerencie seus clientes
            </p>
          </div>
        </div>
        <EmptyWooCommerceState
          title="Nenhum Cliente Encontrado"
          description="Sincronize seus clientes do WooCommerce ou adicione clientes manualmente."
          showConfigButton={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Clientes</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gerencie seus clientes ({customers.length} clientes)
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <div className="lg:w-80">
            <BirthdayWidget customers={customers} onShowBirthdays={handleShowBirthdays} />
          </div>
          
          <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Representantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{representativesCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Receita total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBRL(totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Input
          placeholder="Buscar por nome ou email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:max-w-sm"
        />
        
        <Select value={birthdayFilter} onValueChange={setBirthdayFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filtrar aniversários" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">🎂 Aniversário hoje</SelectItem>
            <SelectItem value="upcoming">📅 Próximos 7 dias</SelectItem>
            <SelectItem value="thisMonth">🗓️ Este mês</SelectItem>
            <SelectItem value="specificMonth">📆 Mês específico</SelectItem>
          </SelectContent>
        </Select>

        {birthdayFilter === 'specificMonth' && (
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Selecionar mês" />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {(birthdayFilter || searchTerm) && (
          <Button variant="outline" onClick={clearFilters}>
            <Filter className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}

        <div className="ml-auto">
          <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />
        </div>
      </div>

      {/* Ações para campanhas */}
      {birthdayFilter && filteredCustomers.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 rounded-lg border border-pink-200 dark:border-pink-800">
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-pink-600">
              {filteredCustomers.length} aniversariante{filteredCustomers.length !== 1 ? 's' : ''}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {birthdayFilter === 'today' && 'Fazem aniversário hoje'}
              {birthdayFilter === 'upcoming' && 'Próximos aniversários (7 dias)'}
              {birthdayFilter === 'thisMonth' && 'Aniversariantes este mês'}
              {birthdayFilter === 'specificMonth' && selectedMonth && `Aniversariantes em ${monthOptions[parseInt(selectedMonth)]?.label}`}
            </span>
          </div>
          
          <BirthdayActions 
            customers={getCampaignCustomers()}
            variant="bulk"
            onCampaignClick={() => setIsCampaignDialogOpen(true)}
          />
        </div>
      )}

      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" 
          : "space-y-3"
      }>
        {filteredCustomers.map((customer) => (
          <CustomerCard 
            key={customer.id} 
            customer={customer} 
            viewMode={viewMode} 
            onView={handleView}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {filteredCustomers.length === 0 && searchTerm && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Nenhum cliente encontrado para "{searchTerm}"
          </p>
        </div>
      )}

      <CustomerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        mode="create"
      />

      <CustomerDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        customer={selectedCustomer}
        mode="edit"
      />

      <CustomerDetails
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        customer={selectedCustomer}
      />

      <BirthdayCampaignDialog
        open={isCampaignDialogOpen}
        onOpenChange={setIsCampaignDialogOpen}
        customers={prepareBirthdayCampaignData(getCampaignCustomers())}
      />
    </div>
  );
};

export default Customers;
