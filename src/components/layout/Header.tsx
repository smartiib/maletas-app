
import { Menu, User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/hooks/useSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Link } from "react-router-dom";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { signOut, profile } = useAuth();
  const { currentOrganization } = useOrganization();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold">
              {currentOrganization?.name || "Sistema Gestão"}
            </h1>
            {currentOrganization && (
              <span className="text-sm text-muted-foreground">
                ({currentOrganization.slug})
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5 text-sm font-medium">
                {profile?.name || "Usuário"}
              </div>
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                {profile?.email}
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
