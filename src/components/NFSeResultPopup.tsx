import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Download, 
  ExternalLink,
  FileText,
  Calendar,
  Hash,
  Building
} from 'lucide-react';

export interface NFSeResult {
  cnpj_prestador?: string;
  ref?: string;
  numero_rps?: string;
  serie_rps?: string;
  status: 'autorizado' | 'cancelado' | 'erro_autorizacao' | 'processando_autorizacao';
  numero?: string;
  codigo_verificacao?: string;
  data_emissao?: string;
  url?: string;
  caminho_xml_nota_fiscal?: string;
  caminho_xml_cancelamento?: string;
  erros?: Array<{
    codigo: string;
    mensagem: string;
    correcao?: string;
  }>;
}

interface NFSeResultPopupProps {
  isOpen: boolean;
  onClose: () => void;
  result: NFSeResult | null;
  onDownloadXML?: (caminho: string, tipo: 'nfse' | 'cancelamento') => void;
  onViewPrefeitura?: (url: string) => void;
}

const NFSeResultPopup: React.FC<NFSeResultPopupProps> = ({
  isOpen,
  onClose,
  result,
  onDownloadXML,
  onViewPrefeitura
}) => {
  if (!result) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'autorizado':
        return {
          icon: <CheckCircle className="h-5 w-5" />,
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          title: 'NFSe Autorizada com Sucesso!',
          description: 'A Nota Fiscal de Serviço foi emitida e autorizada pela prefeitura.'
        };
      case 'cancelado':
        return {
          icon: <XCircle className="h-5 w-5" />,
          color: 'bg-orange-500',
          textColor: 'text-orange-700',
          bgColor: 'bg-orange-50',
          title: 'NFSe Cancelada',
          description: 'A Nota Fiscal de Serviço foi cancelada.'
        };
      case 'erro_autorizacao':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          title: 'Erro na Autorização',
          description: 'Ocorreram erros durante a autorização da NFSe.'
        };
      case 'processando_autorizacao':
        return {
          icon: <Clock className="h-5 w-5" />,
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          title: 'Processando Autorização',
          description: 'A NFSe está sendo processada pela prefeitura.'
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          title: 'Status Desconhecido',
          description: 'Status não reconhecido.'
        };
    }
  };

  const statusConfig = getStatusConfig(result.status);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleString('pt-BR');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`p-2 rounded-full ${statusConfig.color} text-white`}>
              {statusConfig.icon}
            </div>
            {statusConfig.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Status Badge */}
          <div className={`p-4 rounded-lg ${statusConfig.bgColor}`}>
            <p className={`text-sm ${statusConfig.textColor}`}>
              {statusConfig.description}
            </p>
          </div>

          {/* Informações Principais */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informações da NFSe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                {result.numero && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Número NFSe</p>
                      <p className="text-sm text-gray-600">{result.numero}</p>
                    </div>
                  </div>
                )}
                
                {result.codigo_verificacao && (
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Código Verificação</p>
                      <p className="text-sm text-gray-600">{result.codigo_verificacao}</p>
                    </div>
                  </div>
                )}
                
                {result.data_emissao && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">Data Emissão</p>
                      <p className="text-sm text-gray-600">{formatDate(result.data_emissao)}</p>
                    </div>
                  </div>
                )}
                
                {result.cnpj_prestador && (
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">CNPJ Prestador</p>
                      <p className="text-sm text-gray-600">{result.cnpj_prestador}</p>
                    </div>
                  </div>
                )}
              </div>

              {result.numero_rps && (
                <Separator />
              )}

              {result.numero_rps && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Número RPS</p>
                    <p className="text-sm text-gray-600">{result.numero_rps}</p>
                  </div>
                  {result.serie_rps && (
                    <div>
                      <p className="text-sm font-medium">Série RPS</p>
                      <p className="text-sm text-gray-600">{result.serie_rps}</p>
                    </div>
                  )}
                </div>
              )}

              {result.ref && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">Referência</p>
                    <p className="text-sm text-gray-600">{result.ref}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Erros (se houver) */}
          {result.erros && result.erros.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="h-4 w-4" />
                  Erros Encontrados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {result.erros.map((erro, index) => (
                    <div key={index} className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Badge variant="destructive" className="text-xs">
                          {erro.codigo}
                        </Badge>
                        <div className="flex-1">
                          <p className="text-sm text-red-800">{erro.mensagem}</p>
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
              </CardContent>
            </Card>
          )}

          {/* Ações/Downloads */}
          {(result.status === 'autorizado' || result.status === 'cancelado') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Downloads e Visualização
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {/* Botão para visualizar na prefeitura */}
                  {result.url && onViewPrefeitura && (
                    <Button
                      onClick={() => onViewPrefeitura(result.url!)}
                      className="flex items-center gap-2"
                      variant="default"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Ver na Prefeitura
                    </Button>
                  )}

                  {/* Botão para download do XML da NFSe */}
                  {result.caminho_xml_nota_fiscal && onDownloadXML && (
                    <Button
                      onClick={() => onDownloadXML(result.caminho_xml_nota_fiscal!, 'nfse')}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <FileText className="h-4 w-4" />
                      Download XML NFSe
                    </Button>
                  )}

                  {/* Botão para download do XML de cancelamento */}
                  {result.caminho_xml_cancelamento && onDownloadXML && (
                    <Button
                      onClick={() => onDownloadXML(result.caminho_xml_cancelamento!, 'cancelamento')}
                      className="flex items-center gap-2"
                      variant="outline"
                    >
                      <FileText className="h-4 w-4" />
                      Download XML Cancelamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão Fechar */}
          <div className="flex justify-end pt-4">
            <Button onClick={onClose} variant="outline">
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default NFSeResultPopup;
