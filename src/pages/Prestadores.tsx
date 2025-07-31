import React, { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Layout } from '@/components/Layout';

const Prestadores: React.FC = () => {
  const { isAdmin } = useAuth();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Verificar se o usuário é admin
  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Você não tem permissão para acessar esta página.
              </p>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    // Adicionar event listener para quando o iframe carregar
    const handleLoad = () => {
      console.log('Focus NFe iframe loaded successfully');
      
      // Tentar aplicar estilos customizados se possível
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          const style = iframeDoc.createElement('style');
          style.textContent = `
            /* Tentar ocultar elementos desnecessários */
            .sidebar, .nav-sidebar, .main-sidebar, 
            .left-sidebar, .menu-lateral { 
              display: none !important; 
            }
            
            .main-content, .content-wrapper { 
              margin-left: 0 !important; 
              width: 100% !important;
            }
            
            body { 
              margin: 0 !important; 
              padding: 0 !important; 
            }
          `;
          iframeDoc.head?.appendChild(style);
        }
      } catch (error) {
        console.log('Cannot access iframe content due to CORS:', error);
      }
    };

    iframe.addEventListener('load', handleLoad);
    return () => iframe.removeEventListener('load', handleLoad);
  }, []);

  const openInNewTab = () => {
    window.open('https://app-v2.focusnfe.com.br', '_blank');
  };

  const refreshIframe = () => {
    if (iframeRef.current) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  return (
    <Layout>
      <div className="h-full flex flex-col p-6">
        {/* Header com botões de ação */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
            <p className="text-muted-foreground">Focus NFe - Gerenciamento de Empresas</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshIframe} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Atualizar
            </Button>
            <Button onClick={openInNewTab} variant="outline" size="sm">
              <ExternalLink className="mr-2 h-4 w-4" />
              Abrir em nova aba
            </Button>
          </div>
        </div>
        
        {/* Iframe da Focus NFe */}
        <Card className="flex-1">
          <CardContent className="p-0 h-full">
            <iframe
              ref={iframeRef}
              src="https://app-v2.focusnfe.com.br"
              className="w-full h-full border-0 rounded-lg"
              title="Focus NFe - Fiscalia"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads"
              style={{
                minHeight: '600px',
                backgroundColor: '#ffffff'
              }}
            />
          </CardContent>
        </Card>
        
        {/* Instruções para o usuário */}
        <div className="mt-4">
          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Acesso à Focus NFe
                </h3>
                <div className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                  <p>
                    Faça login com suas credenciais: <strong>contato@fluxiwave.com.br</strong>
                  </p>
                  <p className="mt-1">
                    Após o login, navegue até <strong>Empresas</strong> no menu lateral para gerenciar suas empresas.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Prestadores;