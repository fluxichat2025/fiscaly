import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePagePermissions } from "@/hooks/usePagePermissions";
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
  { title: "Dashboard", url: "/", icon: LayoutDashboard, pageKey: "dashboard" },
  {
    title: "Notas Fiscais",
    icon: FileText,
    submenu: [
      { title: "Emitir NFe", url: "/notas/nfe", icon: FileText, pageKey: "notas_nfe" },
      { title: "Emitir NFSe", url: "/notas/nfse", icon: FileText, pageKey: "notas_nfse" },
      { title: "Consultar Notas", url: "/notas", icon: FileCheck, pageKey: "notas_consultar" },
      { title: "Empresas", url: "/notas/empresas", icon: Building2, pageKey: "notas_empresas" },
      { title: "Cancelar/Inutilizar", url: "/notas/cancelar", icon: XCircle, pageKey: "notas_cancelar" },
    ]
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    submenu: [
      { title: "Fluxo de Caixa", url: "/financeiro/fluxo-caixa", icon: TrendingUp, pageKey: "financeiro_fluxo_caixa" },
      { title: "Recebimentos", url: "/financeiro/recebimentos", icon: Receipt, pageKey: "financeiro_recebimentos" },
      { title: "Relatórios Financeiros", url: "/financeiro/relatorios", icon: BarChart3, pageKey: "financeiro_relatorios" },
      { title: "Contas a Pagar", url: "/financeiro/contas-pagar", icon: PiggyBank, pageKey: "financeiro_contas_pagar" },
      { title: "Conciliação Bancária", url: "/financeiro/conciliacao", icon: CalculatorIcon, pageKey: "financeiro_conciliacao" },
    ]
  },
  { title: "Imposto de Renda", url: "/imposto-renda", icon: Calculator, pageKey: "imposto_renda" },
  { title: "Relatórios", url: "/relatorios", icon: BarChart3, pageKey: "relatorios" },
  { title: "Tarefas", url: "/tarefas", icon: FileCheck, pageKey: "tarefas" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, pageKey: "configuracoes" },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { profile, signOut, isAdmin } = useAuth();
  const { canView, loading: permissionsLoading } = usePagePermissions();
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
      // Manter compatibilidade com adminOnly
      if (item.adminOnly) {
        return isAdmin;
      }
      // Filtrar por permissões se pageKey estiver definido
      if (item.pageKey) {
        return canView(item.pageKey);
      }
      return true;
    });
  };

  const filterMenuItems = (items: any[]) => {
    return items.filter(item => {
      // Se tem submenu, verificar se pelo menos um item do submenu é visível
      if (item.submenu) {
        const visibleSubmenuItems = filterSubmenuItems(item.submenu);
        return visibleSubmenuItems.length > 0;
      }

      // Manter compatibilidade com adminOnly
      if (item.adminOnly) {
        return isAdmin;
      }

      // Filtrar por permissões se pageKey estiver definido
      if (item.pageKey) {
        return canView(item.pageKey);
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












