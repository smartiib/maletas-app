
import { Menu, User, LogOut, Settings, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useOrganizationAuthContext } from "@/contexts/OrganizationAuthContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { signOut, profile, user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { organizationUser, isOrganizationAuthenticated } = useOrganizationAuthContext();

  const handleSignOut = async () => {
    await signOut();
  };

  // Determinar se é super admin
  const isSuperAdmin = user?.email === 'douglas@agencia2b.com.br';

  // Determinar nome da organização e usuário baseado no contexto
  let organizationName = 'Sistema Gestão';
  let userName = 'Usuário';
  let userRole = 'Usuário';

  if (isOrganizationAuthenticated && organizationUser) {
    // Para usuário organizacional, usar o nome real da organização
    organizationName = organizationUser.organization_name || 'Organização';
    userName = organizationUser.name || 'Usuário';
    userRole = 'Administrador';
  } else if (isSuperAdmin) {
    // Para super admin, mostrar o nome da organização selecionada ou padrão
    organizationName = currentOrganization?.name || 'Sistema Gestão';
    userName = profile?.name || user?.email?.split('@')[0] || 'douglas';
    userRole = 'Super Admin';
  }

  // Saudação baseada no horário
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <header className="h-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-20 items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          {/* Saudação simples - sem duplicar informações */}
          <div className="hidden md:block">
            <h2 className="text-lg font-medium text-foreground">
              {getGreeting()}, {userName}! 👋
            </h2>
            <p className="text-sm text-muted-foreground">
              Aqui está o resumo do seu negócio hoje
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Barra de pesquisa */}
          <div className="hidden md:flex items-center">
            <Input
              type="search"
              placeholder="Pesquisar..."
              className="w-64"
            />
          </div>

          {/* Notificações */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-4 w-4" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs"></span>
          </Button>

          {/* Toggle tema (se necessário) */}
          <Button variant="ghost" size="icon">
            <div className="h-4 w-4 rounded-full bg-blue-600"></div>
          </Button>

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 px-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userName.substring(0, 2).toUpperCase()}
                  </span>
                </div>
                <span className="hidden md:block font-medium">
                  {userName.split(' ')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 text-sm font-medium">
                {userName}
              </div>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {profile?.email || user?.email}
              </div>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

export default Header;
