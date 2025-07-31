import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  LayoutDashboard,
  FileText,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Calculator,
  ChevronRight,
  FileCheck,

  XCircle,
  DollarSign,
  TrendingUp,
  Receipt,
  PiggyBank,
  Calculator as CalculatorIcon,
} from "lucide-react";

const menuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  {
    title: "Notas Fiscais",
    icon: FileText,
    submenu: [
      { title: "Emitir NFe", url: "/notas/nfe", icon: FileText },
      { title: "Emitir NFSe", url: "/notas/nfse", icon: FileText },
      { title: "Consultar Notas", url: "/notas", icon: FileCheck },

      { title: "Empresas", url: "/notas/empresas", icon: Building2 },
      { title: "Cancelar/Inutilizar", url: "/notas/cancelar", icon: XCircle },
    ]
  },
  { 
    title: "Financeiro", 
    icon: DollarSign,
    submenu: [
      { title: "Fluxo de Caixa", url: "/financeiro/fluxo-caixa", icon: TrendingUp },
      { title: "Recebimentos", url: "/financeiro/recebimentos", icon: Receipt },
      { title: "Relatórios Financeiros", url: "/financeiro/relatorios", icon: BarChart3 },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar", icon: PiggyBank },
      { title: "Conciliação Bancária", url: "/financeiro/conciliacao", icon: CalculatorIcon },
    ]
  },
  { title: "Imposto de Renda", url: "/imposto-renda", icon: Calculator },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3 },
  { title: "Configurações", url: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, signOut, isAdmin } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === "/") {
      return currentPath === "/";
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    return isActive(path)
      ? "bg-sidebar-accent text-sidebar-primary font-medium"
      : "hover:bg-sidebar-accent/50 text-sidebar-foreground";
  };

  const isSubmenuActive = (submenu: any[]) => {
    return submenu.some(item => isActive(item.url));
  };

  const filterSubmenuItems = (submenu: any[]) => {
    return submenu.filter(item => {
      if (item.adminOnly) {
        return isAdmin;
      }
      return true;
    });
  };

  const filterMenuItems = (menuItems: any[]) => {
    return menuItems.filter(item => {
      if (item.adminOnly) {
        return isAdmin;
      }
      return true;
    });
  };

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center justify-center px-4 py-6 border-b border-sidebar-border">
          <img
            src="https://res.cloudinary.com/djuuse9oo/image/upload/v1753457762/fiscalia_1_uvyxfv.png"
            alt="Fiscalia Logo"
            className="h-10 w-auto"
          />
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filterMenuItems(menuItems).map((item) => {
                if (item.submenu) {
                  const filteredSubmenu = filterSubmenuItems(item.submenu);
                  if (filteredSubmenu.length === 0) return null;
                  
                  return (
                    <Collapsible
                      key={item.title}
                      defaultOpen={isSubmenuActive(filteredSubmenu)}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            className={`${isSubmenuActive(filteredSubmenu) 
                              ? "bg-sidebar-accent text-sidebar-primary font-medium" 
                              : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
                            }`}
                          >
                            <item.icon className="h-4 w-4" />
                            {!collapsed && <span>{item.title}</span>}
                            {!collapsed && (
                              <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            )}
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {filteredSubmenu.map((subItem) => (
                              <SidebarMenuSubItem key={subItem.title}>
                                <SidebarMenuSubButton asChild>
                                  <NavLink 
                                    to={subItem.url} 
                                    className={getNavClasses(subItem.url)}
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    {!collapsed && <span>{subItem.title}</span>}
                                  </NavLink>
                                </SidebarMenuSubButton>
                              </SidebarMenuSubItem>
                            ))}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                } else {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClasses(item.url)}>
                          <item.icon className="h-4 w-4" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                }
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User info and logout */}
        <div className="mt-auto border-t border-sidebar-border">
          <div className="p-4">
            {!collapsed && profile && (
              <div className="mb-3">
                <p className="text-sm font-medium text-sidebar-foreground">
                  {profile.first_name}
                </p>
                <p className="text-xs text-sidebar-foreground/70">
                  {profile.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            )}
            
            <SidebarMenuButton
              onClick={signOut}
              className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>Sair</span>}
            </SidebarMenuButton>
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}












