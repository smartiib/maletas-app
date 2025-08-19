import {
  Package,
  LayoutDashboard,
  Users,
  ShoppingBag,
  ListChecks,
  FileBarChart,
  Settings,
  UserPlus,
  Coins,
  FileText,
  Building2,
  X,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { OrganizationSelector } from './OrganizationSelector';

const Sidebar = () => {
  const location = useLocation();
  const { isCollapsed, toggleSidebar, setIsCollapsed } = useSidebar();
  const { profile } = useAuth();

  const sidebarItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Produtos",
      url: "/products",
      icon: ShoppingBag,
    },
    {
      title: "Clientes",
      url: "/customers",
      icon: Users,
    },
    {
      title: "Pedidos",
      url: "/orders",
      icon: ShoppingBag,
    },
    {
      title: "POS",
      url: "/pos",
      icon: ShoppingBag,
    },
    {
      title: "Maletas",
      url: "/maletas",
      icon: ShoppingBag,
    },
    {
      title: "Relatórios",
      url: "/reports",
      icon: FileBarChart,
    },
    {
      title: "Configurações",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Fornecedores",
      url: "/suppliers",
      icon: UserPlus,
    },
    {
      title: "Financeiro",
      url: "/financeiro",
      icon: Coins,
    },
    {
      title: "Templates PDF",
      url: "/pdf-templates",
      icon: FileText,
      roles: ["owner", "admin"] as const,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: ListChecks,
      roles: ["owner", "admin"] as const,
    },
  ];

  // Add Organizations to sidebar items after Reports
  const updatedSidebarItems = [
    ...sidebarItems.slice(0, 8), // Keep items up to Reports
    {
      title: "Organizações",
      url: "/organizations",
      icon: Building2,
      roles: ["owner", "admin"] as const,
    },
    ...sidebarItems.slice(8), // Keep remaining items
  ];

  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-card border-r transition-transform duration-300 ease-in-out",
        isCollapsed ? "-translate-x-full" : "translate-x-0",
        "lg:translate-x-0"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4 border-b">
        <div className="flex items-center gap-2">
          <Package className="h-6 w-6 text-primary" />
          <span className="font-semibold">Sistema Gestão</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="lg:hidden"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Organization Selector */}
      <div className="px-2 py-2 border-b">
        <OrganizationSelector />
      </div>

      <ScrollArea className="flex-1 px-2 py-4">
        <div className="space-y-1">
          {updatedSidebarItems
            .filter((item) => 
              !item.roles || 
              item.roles.includes(profile?.role as any)
            )
            .map((item) => (
              <Link
                key={item.url}
                to={item.url}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  location.pathname === item.url
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                onClick={() => setIsCollapsed(true)}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="mb-2 text-sm font-medium">
          {profile?.name || "Usuário"}
        </div>
        <Link to="/settings">
          <Button variant="outline" className="w-full">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;
