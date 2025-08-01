import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const FocusNFeDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const TOKEN_PRODUCAO = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
  const FOCUS_NFE_API_BASE = '/api/focusnfe/v2';

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const newResults: DiagnosticResult[] = [];

    // Teste 1: Verificar configuração do token
    newResults.push({
      test: 'Configuração do Token',
      status: TOKEN_PRODUCAO ? 'success' : 'error',
      message: TOKEN_PRODUCAO ? `Token configurado (${TOKEN_PRODUCAO.substring(0, 10)}...)` : 'Token não configurado',
      details: { tokenLength: TOKEN_PRODUCAO?.length }
    });

    // Teste 2: Verificar proxy/CORS
    try {
      const response = await fetch(`${FOCUS_NFE_API_BASE}/empresas`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Basic ${btoa(`${TOKEN_PRODUCAO}:`)}`,
        },
      });

      newResults.push({
        test: 'Conectividade (HEAD)',
        status: response.ok ? 'success' : 'error',
        message: `Status: ${response.status} ${response.statusText}`,
        details: { 
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        }
      });
    } catch (error) {
      newResults.push({
        test: 'Conectividade (HEAD)',
        status: 'error',
        message: `Erro de conexão: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        details: error
      });
    }

    // Teste 3: Requisição GET completa
    try {
      const response = await fetch(`${FOCUS_NFE_API_BASE}/empresas`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${TOKEN_PRODUCAO}:`)}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          test: 'Requisição GET /empresas',
          status: 'success',
          message: `Sucesso! ${Array.isArray(data) ? data.length : 0} empresas encontradas`,
          details: data
        });
      } else {
        const errorText = await response.text();
        newResults.push({
          test: 'Requisição GET /empresas',
          status: 'error',
          message: `Erro ${response.status}: ${errorText.substring(0, 100)}`,
          details: { status: response.status, error: errorText }
        });
      }
    } catch (error) {
      newResults.push({
        test: 'Requisição GET /empresas',
        status: 'error',
        message: `Erro de requisição: ${error instanceof Error ? error.message : 'Desconhecido'}`,
        details: error
      });
    }

    // Teste 4: Verificar URL direta (sem proxy)
    try {
      const response = await fetch('https://api.focusnfe.com.br/v2/empresas', {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${TOKEN_PRODUCAO}:`)}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        newResults.push({
          test: 'URL Direta (sem proxy)',
          status: 'success',
          message: `Sucesso direto! ${Array.isArray(data) ? data.length : 0} empresas`,
          details: data
        });
      } else {
        const errorText = await response.text();
        newResults.push({
          test: 'URL Direta (sem proxy)',
          status: 'warning',
          message: `Erro ${response.status}: CORS ou token inválido`,
          details: { status: response.status, error: errorText }
        });
      }
    } catch (error) {
      newResults.push({
        test: 'URL Direta (sem proxy)',
        status: 'warning',
        message: `Bloqueado por CORS (normal): ${error instanceof Error ? error.message : 'Desconhecido'}`,
        details: error
      });
    }

    setResults(newResults);
    setIsRunning(false);

    // Mostrar resumo
    const successCount = newResults.filter(r => r.status === 'success').length;
    const errorCount = newResults.filter(r => r.status === 'error').length;
    
    toast({
      title: "Diagnóstico concluído",
      description: `${successCount} sucessos, ${errorCount} erros`,
      variant: errorCount > 0 ? "destructive" : "default"
    });
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Sucesso</Badge>;
      case 'error':
        return <Badge variant="destructive">Erro</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Aviso</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Diagnóstico da API Focus NFe
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Executando diagnóstico...
            </>
          ) : (
            'Executar Diagnóstico'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium">{result.test}</span>
                  </div>
                  {getStatusBadge(result.status)}
                </div>
                <p className="text-sm text-muted-foreground mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600">Ver detalhes</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-32">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FocusNFeDiagnostic;
