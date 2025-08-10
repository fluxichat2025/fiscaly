import React, { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  Download,
  ExternalLink,
  FileText,
  X
} from 'lucide-react';

export interface NFSeEmissionStatus {
  status: 'loading' | 'monitoring' | 'authorized' | 'error' | 'cancelled';
  message: string;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  currentStatus?: string;
  nfseData?: any;
  errorDetails?: string;
  errorCode?: string;
  errors?: Array<{
    codigo: string;
    mensagem: string;
    correcao?: string;
  }>;
}

interface NFSeEmissionPopupProps {
  isOpen: boolean;
  onClose: () => void;
  status: NFSeEmissionStatus;
  referencia: string;
  onDownloadXML?: (caminho: string, tipo: 'nfse' | 'cancelamento') => void;
  onViewPrefeitura?: (url: string) => void;
  onStopMonitoring?: () => void;
}

const NFSeEmissionPopup: React.FC<NFSeEmissionPopupProps> = ({
  isOpen,
  onClose,
  status,
  referencia,
  onDownloadXML,
  onViewPrefeitura,
  onStopMonitoring
}) => {
  // Calcular posição centralizada
  const getCenteredPosition = () => {
    const popupWidth = 384; // w-96 em pixels
    const popupHeight = 400; // altura estimada
    return {
      x: Math.max(0, (window.innerWidth - popupWidth) / 2),
      y: Math.max(0, (window.innerHeight - popupHeight) / 2)
    };
  };

  const [position, setPosition] = useState(getCenteredPosition());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const popupRef = useRef<HTMLDivElement>(null);

  // Reposicionar para o centro quando o popup abrir
  useEffect(() => {
    if (isOpen) {
      setPosition(getCenteredPosition());
    }
  }, [isOpen]);

  // Função para iniciar o arraste (apenas no header)
  const handleMouseDown = (e: React.MouseEvent) => {
    // Verificar se o clique foi no header (drag-handle)
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  // Função para arrastar com movimento suave
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();

        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;

        // Limitar às bordas da tela com margem
        const popupWidth = 384; // w-96
        const popupHeight = 400; // altura estimada
        const margin = 10;

        const maxX = window.innerWidth - popupWidth - margin;
        const maxY = window.innerHeight - popupHeight - margin;

        setPosition({
          x: Math.max(margin, Math.min(newX, maxX)),
          y: Math.max(margin, Math.min(newY, maxY))
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevenir seleção de texto
    } else {
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragStart]);
  const getStatusConfig = () => {
    switch (status.status) {
      case 'loading':
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin" />,
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          title: 'Emitindo NFSe...',
          description: 'Enviando dados para o provedor NFSe'
        };
      case 'monitoring':
        return {
          icon: <Clock className="h-6 w-6 animate-pulse" />,
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          title: 'Monitorando Autorização',
          description: 'Aguardando processamento do provedor NFSe'
        };
      case 'authorized':
        return {
          icon: <CheckCircle className="h-6 w-6" />,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          title: 'NFSe Autorizada!',
          description: 'A Nota Fiscal foi emitida e autorizada com sucesso'
        };
      case 'error':
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          title: 'Erro na Emissão',
          description: 'Ocorreu um erro durante a emissão da NFSe'
        };
      case 'cancelled':
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          title: 'Monitoramento Cancelado',
          description: 'O monitoramento foi interrompido pelo usuário'
        };
      default:
        return {
          icon: <AlertCircle className="h-6 w-6" />,
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          title: 'Status Desconhecido',
          description: 'Status não reconhecido'
        };
    }
  };

  const statusConfig = getStatusConfig();
  const progressPercentage = status.maxAttempts > 0 ? (status.attempts / status.maxAttempts) * 100 : 0;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}} modal={false}>
      <DialogContent
        ref={popupRef}
        className="fixed w-96 max-w-96 translate-x-0 translate-y-0 z-50 shadow-2xl border-2 [&>button]:hidden"
        style={{
          position: 'fixed',
          top: `${position.y}px`,
          left: `${position.x}px`,
          transform: 'none',
          margin: 0,
          transition: isDragging ? 'none' : 'all 0.2s ease-out'
        }}
      >
        <DialogHeader
          className="pb-2 drag-handle cursor-move select-none"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-lg pointer-events-none">
              <div className={`p-2 rounded-full ${statusConfig.color} text-white`}>
                {statusConfig.icon}
              </div>
              {statusConfig.title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0 cursor-pointer hover:bg-gray-100"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`p-3 rounded-lg ${statusConfig.bgColor}`}>
            <p className={`text-sm ${statusConfig.textColor} font-medium`}>
              {statusConfig.description}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Referência: {referencia}
            </p>
          </div>

          {/* Progress and Status Info */}
          {(status.status === 'monitoring' || status.status === 'loading') && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Progresso</span>
                    <span>{status.attempts}/{status.maxAttempts} tentativas</span>
                  </div>
                  
                  <Progress value={progressPercentage} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium">Tempo decorrido:</span>
                      <br />
                      {formatTime(status.timeElapsed)}
                    </div>
                    <div>
                      <span className="font-medium">Status atual:</span>
                      <br />
                      {status.currentStatus || 'Verificando...'}
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Mensagem:</span> {status.message}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success Info */}
          {status.status === 'authorized' && status.nfseData && (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-2 text-sm">
                  {status.nfseData.numero && (
                    <div className="flex justify-between">
                      <span className="font-medium">Número NFSe:</span>
                      <span>{status.nfseData.numero}</span>
                    </div>
                  )}
                  {status.nfseData.codigo_verificacao && (
                    <div className="flex justify-between">
                      <span className="font-medium">Código Verificação:</span>
                      <span>{status.nfseData.codigo_verificacao}</span>
                    </div>
                  )}
                  {status.nfseData.data_emissao && (
                    <div className="flex justify-between">
                      <span className="font-medium">Data Emissão:</span>
                      <span>{new Date(status.nfseData.data_emissao).toLocaleString('pt-BR')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Error Details */}
          {status.status === 'error' && (
            <Card className="border-red-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  {/* Código do erro */}
                  {status.errorCode && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-red-800">Código do erro:</span>
                      <Badge variant="destructive" className="text-xs">
                        {status.errorCode}
                      </Badge>
                    </div>
                  )}

                  {/* Mensagem de erro */}
                  {status.errorDetails && (
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Mensagem:</span>
                      <div className="mt-2 p-3 bg-red-50 rounded-md text-xs border border-red-200">
                        {status.errorDetails}
                      </div>
                    </div>
                  )}

                  {/* Lista de erros detalhados da API */}
                  {status.errors && status.errors.length > 0 && (
                    <div className="text-sm text-red-800">
                      <span className="font-medium">Erros retornados pela API:</span>
                      <div className="mt-2 space-y-2">
                        {status.errors.map((erro, index) => (
                          <div key={index} className="p-3 bg-red-50 rounded-md border border-red-200">
                            <div className="flex items-start gap-2">
                              <Badge variant="destructive" className="text-xs">
                                {erro.codigo}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-xs text-red-800 font-medium">{erro.mensagem}</p>
                                {erro.correcao && (
                                  <p className="text-xs text-red-600 mt-1">
                                    <strong>Correção:</strong> {erro.correcao}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {/* Download and View buttons for authorized NFSe */}
            {status.status === 'authorized' && status.nfseData && (
              <>
                {status.nfseData.url && onViewPrefeitura && (
                  <Button
                    size="sm"
                    onClick={() => onViewPrefeitura(status.nfseData.url)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver na Prefeitura
                  </Button>
                )}
                {status.nfseData.caminho_xml_nota_fiscal && onDownloadXML && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDownloadXML(status.nfseData.caminho_xml_nota_fiscal, 'nfse')}
                    className="flex items-center gap-1 text-xs"
                  >
                    <FileText className="h-3 w-3" />
                    XML
                  </Button>
                )}
              </>
            )}

            {/* Stop monitoring button */}
            {(status.status === 'monitoring' || status.status === 'loading') && onStopMonitoring && (
              <Button
                size="sm"
                variant="destructive"
                onClick={onStopMonitoring}
                className="flex items-center gap-1 text-xs"
              >
                Parar
              </Button>
            )}

            {/* Close button */}
            {(status.status === 'authorized' || status.status === 'error' || status.status === 'cancelled') && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="flex items-center gap-1 text-xs ml-auto"
              >
                Fechar
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFSeEmissionPopup;
