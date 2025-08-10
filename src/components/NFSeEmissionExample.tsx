import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNFSeMonitoring } from '@/hooks/useNFSeMonitoring';
import { useNFSeResultPopup } from '@/hooks/useNFSeResultPopup';
import NFSeResultPopup from './NFSeResultPopup';
import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const NFSeEmissionExample: React.FC = () => {
  const [referencia] = useState('nfs-exemplo-123');
  const [empresaId] = useState('empresa-teste-456');
  
  // Hook do popup de resultado
  const {
    isOpen,
    result,
    showResult,
    closePopup,
    handleDownloadXML,
    handleViewPrefeitura
  } = useNFSeResultPopup();

  // Hook de monitoramento NFSe
  const { status, startMonitoring, stopMonitoring } = useNFSeMonitoring({
    maxAttempts: 20,
    intervalMs: 15000,
    onNFSeResult: showResult, // Conectar o callback do popup
    onComplete: (data) => {
      console.log('✅ Monitoramento concluído:', data);
    },
    onError: (error) => {
      console.error('❌ Erro no monitoramento:', error);
    }
  });

  const handleEmitirNFSe = async () => {
    try {
      console.log('🚀 Iniciando emissão da NFSe...');
      
      // Aqui você faria a chamada para emitir a NFSe
      // Por exemplo: await emitirNFSe(dadosNFSe);
      
      // Simular emissão bem-sucedida e iniciar monitoramento
      await startMonitoring(referencia, empresaId);
      
    } catch (error) {
      console.error('❌ Erro na emissão:', error);
    }
  };

  const getStatusIcon = () => {
    switch (status.status) {
      case 'monitoring':
        return <Clock className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (status.status) {
      case 'monitoring':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exemplo de Emissão NFSe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Informações da NFSe */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Referência</p>
              <p className="text-sm text-gray-600">{referencia}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Empresa ID</p>
              <p className="text-sm text-gray-600">{empresaId}</p>
            </div>
          </div>

          {/* Status do Monitoramento */}
          {status.status !== 'idle' && (
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon()}
                    <Badge className={getStatusColor()}>
                      {status.status === 'monitoring' && 'Monitorando'}
                      {status.status === 'completed' && 'Concluído'}
                      {status.status === 'error' && 'Erro'}
                      {status.status === 'idle' && 'Aguardando'}
                    </Badge>
                  </div>
                  
                  {status.status === 'monitoring' && (
                    <Button
                      onClick={stopMonitoring}
                      variant="outline"
                      size="sm"
                    >
                      Parar Monitoramento
                    </Button>
                  )}
                </div>

                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">{status.message}</p>
                  
                  {status.status === 'monitoring' && (
                    <div className="text-xs text-gray-500">
                      <p>Tentativas: {status.attempts}/{status.maxAttempts}</p>
                      <p>Tempo decorrido: {Math.floor(status.timeElapsed / 60)}:{(status.timeElapsed % 60).toString().padStart(2, '0')}</p>
                      {status.currentStatus && (
                        <p>Status atual: {status.currentStatus}</p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botões de Ação */}
          <div className="flex gap-3">
            <Button
              onClick={handleEmitirNFSe}
              disabled={status.status === 'monitoring'}
              className="flex-1"
            >
              {status.status === 'monitoring' ? 'Emitindo...' : 'Emitir NFSe'}
            </Button>

            {/* Botão para testar popup com dados de exemplo */}
            <Button
              onClick={() => showResult({
                cnpj_prestador: "07504505000132",
                ref: "nfs-exemplo-123",
                numero_rps: "224",
                serie_rps: "1",
                status: "autorizado",
                numero: "233",
                codigo_verificacao: "DU1M-M2Y",
                data_emissao: "2019-05-27T00:00:00-03:00",
                url: "https://200.189.192.82/PilotoNota_Portal/Default.aspx?doc=07504505000132&num=233&cod=DUMMY",
                caminho_xml_nota_fiscal: "/arquivos/07504505000132_12345/202401/XMLsNFSe/075045050001324106902-004949940-433-DUMMY-nfse.xml"
              })}
              variant="outline"
            >
              Testar Popup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Popup de Resultado */}
      <NFSeResultPopup
        isOpen={isOpen}
        onClose={closePopup}
        result={result}
        onDownloadXML={handleDownloadXML}
        onViewPrefeitura={handleViewPrefeitura}
      />
    </div>
  );
};

export default NFSeEmissionExample;
