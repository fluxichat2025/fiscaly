import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NFSeResult } from './useNFSeMonitoring';

export const useNFSeResultPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [result, setResult] = useState<NFSeResult | null>(null);
  const { toast } = useToast();

  const showResult = useCallback((nfseResult: NFSeResult) => {
    console.log('📋 Mostrando popup de resultado NFSe:', nfseResult);
    setResult(nfseResult);
    setIsOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setIsOpen(false);
    setResult(null);
  }, []);

  const handleDownloadXML = useCallback(async (caminho: string, tipo: 'nfse' | 'cancelamento') => {
    try {
      console.log('📥 Iniciando download do XML:', { caminho, tipo });
      
      // Fazer requisição para o proxy para download do XML
      const response = await fetch(`http://localhost:3001/api/download-xml`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ caminho, tipo })
      });

      if (!response.ok) {
        throw new Error(`Erro no download: ${response.status}`);
      }

      // Obter o blob do arquivo
      const blob = await response.blob();
      
      // Criar URL temporária para download
      const url = window.URL.createObjectURL(blob);
      
      // Criar elemento de link temporário para download
      const link = document.createElement('a');
      link.href = url;
      
      // Definir nome do arquivo baseado no tipo
      const fileName = tipo === 'nfse' 
        ? `nfse-${result?.numero || result?.ref || 'documento'}.xml`
        : `cancelamento-${result?.numero || result?.ref || 'documento'}.xml`;
      
      link.download = fileName;
      
      // Adicionar ao DOM, clicar e remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Limpar URL temporária
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: `Arquivo ${fileName} foi baixado com sucesso.`,
      });

      console.log('✅ Download do XML concluído:', fileName);
      
    } catch (error) {
      console.error('❌ Erro no download do XML:', error);
      
      toast({
        variant: "destructive",
        title: "Erro no Download",
        description: error instanceof Error ? error.message : 'Erro desconhecido no download',
      });
    }
  }, [result, toast]);

  const handleViewPrefeitura = useCallback((url: string) => {
    try {
      console.log('🌐 Abrindo URL da prefeitura:', url);
      
      // Abrir em nova aba
      window.open(url, '_blank', 'noopener,noreferrer');
      
      toast({
        title: "Abrindo na Prefeitura",
        description: "A página da prefeitura foi aberta em uma nova aba.",
      });
      
    } catch (error) {
      console.error('❌ Erro ao abrir URL da prefeitura:', error);
      
      toast({
        variant: "destructive",
        title: "Erro ao Abrir Link",
        description: "Não foi possível abrir a página da prefeitura.",
      });
    }
  }, [toast]);

  return {
    isOpen,
    result,
    showResult,
    closePopup,
    handleDownloadXML,
    handleViewPrefeitura
  };
};
