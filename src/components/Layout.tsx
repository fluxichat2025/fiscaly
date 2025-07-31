import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-16 border-b border-border bg-background flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Fiscalia
                </h2>
                <p className="text-sm text-muted-foreground">
                  {profile?.role === 'admin' ? 'Painel Administrativo' : 'Painel Operacional'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Placeholder for news panel */}
              <Button variant="outline" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <span className="sr-only">Notificações</span>
                {/* Placeholder badge */}
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full"></span>
              </Button>
              
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {profile?.first_name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {profile?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                </p>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1 bg-muted/30 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}