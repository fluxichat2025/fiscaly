import React, { useEffect, useState, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import {
  ExternalLink as OpenInNewIcon,
  RefreshCw as RefreshIcon,
  Building2 as BusinessIcon
} from 'lucide-react';

const EmpresasSimples = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [iframeKey, setIframeKey] = useState(0);
  const [loginAttempted, setLoginAttempted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Credenciais para login automático
  const FOCUS_EMAIL = 'contato@fluxiwave.com.br';
  const FOCUS_PASSWORD = 'Gpv@162017';

  // URL da seção de empresas personalizada
  const EMPRESAS_SECTION_URL = '/empresas-section.html';

  // URL direta da Focus NFe (fallback)
  const FOCUS_URL = 'https://app-v2.focusnfe.com.br/minhas_empresas/empresas';

  // Função para fazer login automático
  const performAutoLogin = async () => {
    if (loginAttempted) return;
    setLoginAttempted(true);

    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Aguardar um pouco para o iframe carregar
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Tentar injetar script para fazer login automático
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Verificar se já está logado (procurar por elementos da página de empresas)
          const empresasSection = iframeDoc.querySelector('.empresas, [data-testid="empresas"], .company-list');
          if (empresasSection) {
            console.log('Já está logado na Focus NFe');
            setIsLoading(false);
            return;
          }

          // Tentar fazer login se estiver na página de login
          const emailField = iframeDoc.querySelector('input[name="email"], input[type="email"]') as HTMLInputElement;
          const passwordField = iframeDoc.querySelector('input[name="password"], input[type="password"]') as HTMLInputElement;
          const loginButton = iframeDoc.querySelector('button[type="submit"], .btn-login, input[type="submit"]') as HTMLButtonElement;

          if (emailField && passwordField && loginButton) {
            console.log('Fazendo login automático...');
            emailField.value = FOCUS_EMAIL;
            passwordField.value = FOCUS_PASSWORD;

            // Disparar eventos para simular digitação
            emailField.dispatchEvent(new Event('input', { bubbles: true }));
            passwordField.dispatchEvent(new Event('input', { bubbles: true }));

            // Aguardar um pouco e clicar no botão
            setTimeout(() => {
              loginButton.click();
            }, 500);
          }
        }
      } catch (crossOriginError) {
        console.log('Não foi possível acessar o conteúdo do iframe devido a CORS');
      }
    } catch (error) {
      console.error('Erro no login automático:', error);
    }
  };

  // Função para recarregar o iframe
  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
    setLoginAttempted(false);
  };

  // Função para abrir Focus NFe em nova aba
  const handleOpenFocusNFe = () => {
    window.open(FOCUS_URL, '_blank', 'noreferrer,noopener');
  };

  // Função para injetar CSS no iframe para mostrar apenas a seção de empresas
  const injectCustomCSS = () => {
    try {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) return;

      // CSS para ocultar elementos desnecessários e mostrar apenas a seção de empresas
      const customCSS = `
        <style id="custom-focus-css">
          /* Ocultar header, sidebar e outros elementos */
          header, .header, .navbar, .nav, .sidebar, .menu-lateral,
          .breadcrumb, .breadcrumbs, .footer, .rodape,
          .alert, .notification, .banner, .top-bar,
          [class*="header"], [class*="nav"], [class*="sidebar"],
          [class*="menu"], [class*="footer"], [class*="banner"] {
            display: none !important;
          }

          /* Ocultar elementos específicos da Focus NFe */
          .focus-header, .focus-nav, .focus-sidebar,
          .main-header, .main-nav, .main-sidebar,
          .app-header, .app-nav, .app-sidebar {
            display: none !important;
          }

          /* Mostrar apenas o conteúdo principal */
          body {
            margin: 0 !important;
            padding: 20px !important;
            background: white !important;
          }

          /* Estilizar a seção de empresas */
          .empresas-container, .companies-container,
          [class*="empresa"], [class*="company"],
          .content, .main-content, .page-content {
            display: block !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Estilizar tabela de empresas */
          table {
            width: 100% !important;
            border-collapse: collapse !important;
          }

          /* Remover elementos de navegação */
          .pagination, .paginacao,
          .btn-voltar, .back-button,
          .breadcrumb, .migas {
            display: none !important;
          }

          /* Focar apenas na área de pesquisa e tabela */
          .search-container, .pesquisa-container,
          .filter-container, .filtros-container {
            margin-bottom: 20px !important;
          }
        </style>
      `;

      // Injetar o CSS no head do iframe
      if (!iframeDoc.getElementById('custom-focus-css')) {
        iframeDoc.head.insertAdjacentHTML('beforeend', customCSS);
      }

      console.log('CSS customizado injetado no iframe');
    } catch (error) {
      console.log('Não foi possível injetar CSS devido a CORS:', error);
    }
  };

  // Função chamada quando o iframe carrega
  const handleIframeLoad = () => {
    console.log('Focus NFe carregada');
    setIsLoading(false);

    // Tentar injetar CSS customizado após carregar
    setTimeout(() => {
      injectCustomCSS();
    }, 2000);

    // Tentar fazer login automático após carregar
    setTimeout(() => {
      performAutoLogin();
    }, 1000);
  };

  // Efeito para simular carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 segundos

    return () => clearTimeout(timer);
  }, [iframeKey]);

  return (
    <Layout>
      <div className="flex flex-col h-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BusinessIcon className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                Gerenciamento de Empresas
              </h1>
              <p className="text-muted-foreground">
                Focus NFe - Lista de empresas com login automático
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshIcon className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            <Button
              size="sm"
              onClick={handleOpenFocusNFe}
            >
              <OpenInNewIcon className="h-4 w-4 mr-2" />
              Abrir Focus NFe
            </Button>
          </div>
        </div>

        {/* Conteúdo - Iframe com seção específica */}
        <div className="flex-1 min-h-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
                <h2 className="text-xl font-bold mb-2">
                  Carregando Focus NFe...
                </h2>
                <p className="text-muted-foreground">
                  Faça login com: {FOCUS_EMAIL} / {FOCUS_PASSWORD}
                </p>
              </div>
            </div>
          )}

          <Card className="h-full">
            <CardContent className="p-0 h-full relative">
              <iframe
                ref={iframeRef}
                key={iframeKey}
                src={EMPRESAS_SECTION_URL}
                className="w-full h-full border-0 rounded-lg"
                onLoad={handleIframeLoad}
                title="Focus NFe - Empresas"
                allow="fullscreen; camera; microphone; geolocation"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock allow-top-navigation"
                style={{
                  minHeight: '600px',
                  backgroundColor: '#ffffff'
                }}
              />

              {/* Overlay com CSS para ocultar elementos desnecessários */}
              <style jsx>{`
                iframe[title="Focus NFe - Empresas"] {
                  /* Tentar ocultar elementos desnecessários via CSS */
                }
              `}</style>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default EmpresasSimples;