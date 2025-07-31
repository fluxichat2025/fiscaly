import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { 
  ExternalLink as OpenInNewIcon,
  RefreshCw as RefreshIcon,
  Building2 as BusinessIcon
} from 'lucide-react';

interface FocusNFeIntegrationProps {
  height?: string | number;
}

export const FocusNFeIntegration: React.FC<FocusNFeIntegrationProps> = ({
  height = '100vh'
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState(0);

  // URL da Focus NFe
  const FOCUS_URL = 'https://app-v2.focusnfe.com.br/minhas_empresas/empresas';

  // Função para abrir em nova aba
  const handleOpenInNewTab = () => {
    window.open(FOCUS_URL, '_blank', 'noreferrer,noopener');
  };

  // Função para redirecionar na mesma aba
  const handleRedirect = () => {
    window.location.href = FOCUS_URL;
  };

  // Função para recarregar o iframe
  const handleRefresh = () => {
    setIframeKey(prev => prev + 1);
    setIsLoading(true);
    setError(null);
  };

  // Função chamada quando o iframe carrega
  const handleIframeLoad = () => {
    console.log('Iframe carregado com sucesso');
    setIsLoading(false);
  };

  // Função chamada quando há erro no iframe
  const handleIframeError = () => {
    console.error('Erro ao carregar iframe');
    setError('N\u00e3o foi poss\u00fdvel carregar a p\u00e1gina da Focus NFe diretamente. Isso pode ser devido a restri\u00e7\u00e5es de seguran\u00e7a.');
    setIsLoading(false);
  };

  // Efeito para simular carregamento
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // 2 segundos de carregamento

    return () => clearTimeout(timer);
  }, [iframeKey]);

  return (
    <div className={`flex flex-col w-full relative bg-background`} style={{ height }}>
      {/* Barra de controle */}
      <div className="flex items-center justify-between p-4 bg-card border-b">
        <div className="flex items-center gap-2">
          <BusinessIcon className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-semibold">
            Gerenciamento de Empresas - Focus NFe
          </h1>
        </div>
        
        <div className="flex gap-2">
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
            onClick={handleOpenInNewTab}
          >
            <OpenInNewIcon className="h-4 w-4 mr-2" />
            Abrir Focus NFe
          </Button>
        </div>
      </div>

      {/* Conte\u00fddo principal */}
      <div className="flex-1 relative overflow-hidden p-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-1000">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4" />
              <p className="text-lg">
                Carregando Focus NFe...
              </p>
            </div>
          </div>
        )}

        {error ? (
          <Card className="max-w2xl mx-auto mt-8">
            <CardHeader>
              <CardTitle>Integra\u00e7\u00e3o com Focus NFe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  {error}
                </AlertDescription>
              </Alert>
              
              <p className="text-sm text-muted-foreground mb-4">
                Por motivos de seguran\u00e7a, a Focus NFe pode n\u00e3o permitir ser exibida diretamente em um iframe.
              </p>
              
              <p className="text-sm font-medium mb-3">
                <strong>Op\u00e7\u00e5es:</strong>
              </p>
              
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={handleOpenInNewTab}
                >
                  <OpenInNewIcon className="h-4 w-4 mr-2" />
                  Abrir Focus NFe em Nova Aba
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleRedirect}
                >
                  Redirecionar para Focus NFe
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : !isLoading ? (
          <iframe
            key={iframeKey}
            src={FOCUS_URL}
            className="w-full h-full border-0 rounded-lg bg-white"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            title="Focus NFe - Gerenciamento de Empresas"
            allow="fullscreen; camera; microphone; geolocation"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-pointer-lock"
          />
        ) : null}
      </div>
    </div>
  );
};

export default FocusNFeIntegration;