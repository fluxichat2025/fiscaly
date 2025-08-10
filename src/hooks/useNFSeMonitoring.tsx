import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Configuração do proxy local (baseado no código Java oficial da Focus NFe)
const PROXY_API_BASE = 'http://localhost:3001/api';

export interface NFSeMonitoringStatus {
  status: 'idle' | 'monitoring' | 'completed' | 'error';
  currentStatus?: string;
  message?: string;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  nfseData?: any;
}

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

export interface NFSeMonitoringOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onStatusChange?: (status: NFSeMonitoringStatus) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onNFSeResult?: (result: NFSeResult) => void;
}

const FINAL_STATUSES = ['autorizado', 'cancelado', 'erro', 'rejeitado', 'denegado', 'erro_autorizacao'];

export const useNFSeMonitoring = (options: NFSeMonitoringOptions = {}) => {
  const {
    maxAttempts = 40, // 40 tentativas * 15s = 10 minutos máximo
    intervalMs = 15000, // 15 segundos
    onStatusChange,
    onComplete,
    onError
  } = options;

  const { toast } = useToast();
  const [monitoringStatus, setMonitoringStatus] = useState<NFSeMonitoringStatus>({
    status: 'idle',
    attempts: 0,
    maxAttempts,
    timeElapsed: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const updateStatus = useCallback((updates: Partial<NFSeMonitoringStatus>) => {
    setMonitoringStatus(prev => {
      const newStatus = { ...prev, ...updates };
      onStatusChange?.(newStatus);
      return newStatus;
    });
  }, [onStatusChange]);

  const clearMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  // Função para consultar NFSe via proxy local (baseado no código Java oficial)
  const consultarNFSe = useCallback(async (referencia: string, empresaId: string) => {
    try {
      console.log('🔍 Consultando NFSe via proxy local:', referencia);

      const url = `${PROXY_API_BASE}/nfse/${referencia}`;
      console.log('🌐 URL do proxy:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      console.log('📥 Resposta do proxy - Status:', response.status);

      if (!response.ok) {
        throw new Error(`Erro no proxy: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📋 Resposta do proxy:', data);

      // O proxy já trata os diferentes status codes e retorna uma estrutura padronizada
      if (data.status === 'processando') {
        console.log('📋 NFSe ainda processando');
        return { status: 'processando', message: data.message };
      }

      if (data.status === 'sucesso') {
        console.log('✅ NFSe processada com sucesso');
        return data.data;
      }

      if (data.status === 'erro') {
        console.error('❌ Erro na consulta NFSe:', data);
        throw new Error(data.message || 'Erro na consulta NFSe');
      }

      return data;
    } catch (error) {
      console.error('❌ Erro ao consultar NFSe via proxy:', error);
      throw error;
    }
  }, []);

  const salvarNFSeCompleta = useCallback(async (referencia: string, nfseData: any, empresaId: string) => {
    try {
      console.log('💾 Salvando NFSe completa no Supabase:', referencia);
      console.log('📋 Dados da NFSe para salvar:', nfseData);

      // Get current user ID for user_id field
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Map NFSe data to match the actual notas_fiscais table structure
      const nfseRecord = {
        // Required fields
        empresa_id: empresaId,
        user_id: user.id,
        prestador_cnpj: nfseData.cnpj_prestador || nfseData.prestador?.cnpj || '',
        prestador_razao_social: nfseData.prestador?.razao_social || '',
        tomador_razao_social: nfseData.tomador?.razao_social || '',
        data_emissao: nfseData.data_emissao || new Date().toISOString(),
        valor_servicos: parseFloat(nfseData.servico?.valor_servicos || 0),
        valor_liquido: parseFloat(nfseData.servico?.valor_liquido || nfseData.servico?.valor_servicos || 0),
        discriminacao: nfseData.servico?.discriminacao || '',
        codigo_servico: nfseData.servico?.codigo_servico || nfseData.servico?.item_lista_servico || '',
        aliquota_iss: parseFloat(nfseData.servico?.aliquota_iss || nfseData.servico?.aliquota || 0),

        // NFSe specific fields from Focus NFe API response
        numero: nfseData.numero || null,
        status: nfseData.status || 'processando',
        codigo_verificacao: nfseData.codigo_verificacao || null,
        tomador_cnpj: nfseData.tomador?.cnpj || null,
        tomador_cpf: nfseData.tomador?.cpf || null,
        tomador_email: nfseData.tomador?.email || null,
        focus_nfe_ref: referencia,

        // Download links and URLs from Focus NFe response
        link_nfse: nfseData.url_danfse || nfseData.url_pdf || null, // PDF download URL

        // Tax fields
        valor_iss: parseFloat(nfseData.servico?.valor_iss || 0),
        valor_cofins: parseFloat(nfseData.servico?.valor_cofins || 0),
        valor_csll: parseFloat(nfseData.servico?.valor_csll || 0),
        valor_inss: parseFloat(nfseData.servico?.valor_inss || 0),
        valor_ir: parseFloat(nfseData.servico?.valor_ir || 0),
        valor_pis: parseFloat(nfseData.servico?.valor_pis || 0),
        valor_deducoes: parseFloat(nfseData.servico?.valor_deducoes || 0),

        // Store complete NFSe data as JSON for future reference/cloning
        // This includes all Focus NFe fields: url, caminho_xml_nota_fiscal, url_danfse, etc.
        webhook_data: nfseData
      };

      const { data, error } = await supabase
        .from('notas_fiscais')
        .upsert(nfseRecord, { 
          onConflict: 'referencia',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao salvar NFSe no Supabase:', error);
        throw error;
      }

      console.log('✅ NFSe salva com sucesso no Supabase:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar NFSe completa:', error);
      throw error;
    }
  }, []);

  const startMonitoring = useCallback(async (referencia: string, empresaId: string) => {
    console.log('🚀 Iniciando monitoramento da NFSe:', referencia);
    
    clearMonitoring();
    startTimeRef.current = Date.now();

    updateStatus({
      status: 'monitoring',
      attempts: 0,
      timeElapsed: 0,
      message: 'Iniciando monitoramento...'
    });

    // Start timer update interval (every second)
    timerIntervalRef.current = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      updateStatus({
        timeElapsed,
        message: `Monitorando... (${Math.floor(timeElapsed / 60)}:${(timeElapsed % 60).toString().padStart(2, '0')})`
      });
    }, 1000);

    let attempts = 0;

    const checkStatus = async () => {
      try {
        attempts++;
        const timeElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        
        updateStatus({
          attempts,
          timeElapsed,
          message: `Consultando status... (tentativa ${attempts}/${maxAttempts})`
        });

        const nfseData = await consultarNFSe(referencia, empresaId);
        const currentStatus = nfseData.status?.toLowerCase() || 'processando';

        console.log('📊 Status da NFSe recebido:', currentStatus);
        console.log('📋 Dados completos da NFSe:', nfseData);

        // Log specific Focus NFe fields for debugging
        if (currentStatus === 'autorizado') {
          console.log('✅ NFSe Autorizada - Detalhes:', {
            numero: nfseData.numero,
            codigo_verificacao: nfseData.codigo_verificacao,
            data_emissao: nfseData.data_emissao,
            url_danfse: nfseData.url_danfse,
            caminho_xml_nota_fiscal: nfseData.caminho_xml_nota_fiscal,
            url: nfseData.url,
            cnpj_prestador: nfseData.cnpj_prestador,
            ref: nfseData.ref
          });
        }

        updateStatus({
          currentStatus,
          message: `Status atual: ${currentStatus}`
        });

        // Verificar se é um status final
        if (FINAL_STATUSES.includes(currentStatus)) {
          clearMonitoring();

          console.log('✅ Status final detectado:', currentStatus);

          // Salvar NFSe completa no Supabase se autorizada
          if (currentStatus === 'autorizado') {
            try {
              await salvarNFSeCompleta(referencia, nfseData, empresaId);
            } catch (saveError) {
              console.error('❌ Erro ao salvar NFSe no Supabase:', saveError);
            }
          }

          updateStatus({
            status: 'completed',
            nfseData,
            message: `NFSe ${currentStatus} com sucesso!`
          });

          // Chamar callback do popup com o resultado
          if (options.onNFSeResult) {
            const nfseResult: NFSeResult = {
              cnpj_prestador: nfseData.cnpj_prestador,
              ref: nfseData.ref || referencia,
              numero_rps: nfseData.numero_rps,
              serie_rps: nfseData.serie_rps,
              status: nfseData.status,
              numero: nfseData.numero,
              codigo_verificacao: nfseData.codigo_verificacao,
              data_emissao: nfseData.data_emissao,
              url: nfseData.url,
              caminho_xml_nota_fiscal: nfseData.caminho_xml_nota_fiscal,
              caminho_xml_cancelamento: nfseData.caminho_xml_cancelamento,
              erros: nfseData.erros
            };

            console.log('📋 Chamando callback do popup com resultado:', nfseResult);
            options.onNFSeResult(nfseResult);
          }

          // Toast de notificação (mais simples, pois o popup mostrará os detalhes)
          if (currentStatus === 'autorizado') {
            toast({
              title: "🎉 NFSe Autorizada!",
              description: `NFSe nº ${nfseData.numero || referencia} foi autorizada com sucesso.`,
            });
          } else if (currentStatus === 'cancelado') {
            toast({
              title: "NFSe Cancelada",
              description: `NFSe ${referencia} foi cancelada.`,
              variant: "destructive"
            });
          } else if (currentStatus === 'erro_autorizacao') {
            toast({
              title: "Erro na Autorização",
              description: `NFSe ${referencia} teve erros na autorização.`,
              variant: "destructive"
            });
          }

          onComplete?.(nfseData);
          return;
        }

        // Verificar se atingiu o máximo de tentativas
        if (attempts >= maxAttempts) {
          clearMonitoring();
          const errorMsg = `Timeout: NFSe não processada após ${maxAttempts} tentativas`;
          
          updateStatus({
            status: 'error',
            message: errorMsg
          });

          toast({
            variant: "destructive",
            title: "Timeout no Monitoramento",
            description: errorMsg,
          });

          onError?.(errorMsg);
          return;
        }

      } catch (error) {
        console.error('❌ Erro no monitoramento:', error);
        
        // Se for erro de rede ou temporário, continuar tentando
        if (attempts < maxAttempts) {
          updateStatus({
            message: `Erro temporário, tentando novamente... (${attempts}/${maxAttempts})`
          });
          return;
        }

        // Se atingiu o máximo de tentativas com erro
        clearMonitoring();
        const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
        
        updateStatus({
          status: 'error',
          message: errorMsg
        });

        toast({
          variant: "destructive",
          title: "Erro no Monitoramento",
          description: errorMsg,
        });

        onError?.(errorMsg);
      }
    };

    // Primeira consulta imediata
    await checkStatus();

    // Configurar polling - sempre configurar o interval após a primeira consulta
    // se não foi finalizado durante a primeira consulta
    if (intervalRef.current === null) {
      console.log('🔄 Configurando polling a cada', intervalMs, 'ms');
      intervalRef.current = setInterval(checkStatus, intervalMs);
    }
  }, [consultarNFSe, salvarNFSeCompleta, clearMonitoring, updateStatus, maxAttempts, intervalMs, toast, onComplete, onError, monitoringStatus.status]);

  const stopMonitoring = useCallback(() => {
    clearMonitoring();
    updateStatus({
      status: 'idle',
      message: 'Monitoramento interrompido'
    });
  }, [clearMonitoring, updateStatus]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMonitoring();
    };
  }, [clearMonitoring]);

  return {
    monitoringStatus,
    startMonitoring,
    stopMonitoring,
    isMonitoring: monitoringStatus.status === 'monitoring'
  };
};
