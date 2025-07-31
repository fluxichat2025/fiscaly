import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export interface NFSeMonitoringStatus {
  status: 'idle' | 'monitoring' | 'completed' | 'error';
  currentStatus?: string;
  message?: string;
  attempts: number;
  maxAttempts: number;
  timeElapsed: number;
  nfseData?: any;
}

export interface NFSeMonitoringOptions {
  maxAttempts?: number;
  intervalMs?: number;
  onStatusChange?: (status: NFSeMonitoringStatus) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

const FINAL_STATUSES = ['autorizado', 'cancelado', 'erro', 'rejeitado', 'denegado'];

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
  }, []);

  const consultarNFSe = useCallback(async (referencia: string, empresaId: string) => {
    try {
      console.log('🔍 Consultando NFSe:', referencia);

      // Buscar dados da empresa no Supabase
      const { data: empresaSupabase, error: empresaError } = await supabase
        .from('empresas')
        .select('*')
        .eq('id', empresaId)
        .single();

      if (empresaError || !empresaSupabase) {
        throw new Error('Empresa não encontrada no sistema');
      }

      // Usar o token de produção da empresa
      const token = empresaSupabase.focus_nfe_token_producao;
      if (!token) {
        throw new Error('Token da Focus NFe não configurado para esta empresa');
      }

      const response = await fetch(`/api/focusnfe/v2/nfse/${referencia}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${btoa(`${token}:`)}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { status: 'processando', message: 'NFSe ainda não processada' };
        }
        throw new Error(`Erro na consulta: ${response.status}`);
      }

      const data = await response.json();
      console.log('📋 Resposta da consulta NFSe:', data);

      return data;
    } catch (error) {
      console.error('❌ Erro ao consultar NFSe:', error);
      throw error;
    }
  }, []);

  const salvarNFSeCompleta = useCallback(async (referencia: string, nfseData: any, empresaId: string) => {
    try {
      console.log('💾 Salvando NFSe completa no Supabase:', referencia);

      const nfseRecord = {
        referencia,
        empresa_id: empresaId,
        cnpj_prestador: nfseData.prestador?.cnpj,
        razao_social: nfseData.prestador?.razao_social,
        rps_numero: nfseData.rps?.numero,
        numero_nfse: nfseData.numero,
        status: nfseData.status,
        data_emissao: nfseData.data_emissao || new Date().toISOString(),
        valor_servicos: nfseData.servico?.valor_servicos || 0,
        xml_completo: nfseData.xml,
        json_dados: nfseData,
        url_xml: nfseData.url_xml,
        url_pdf: nfseData.url_pdf,
        // Campos existentes para compatibilidade
        prestador_cnpj: nfseData.prestador?.cnpj,
        prestador_razao_social: nfseData.prestador?.razao_social,
        tomador_cnpj: nfseData.tomador?.cnpj,
        tomador_cpf: nfseData.tomador?.cpf,
        tomador_razao_social: nfseData.tomador?.razao_social,
        tomador_email: nfseData.tomador?.email,
        discriminacao: nfseData.servico?.discriminacao || '',
        codigo_servico: nfseData.servico?.codigo_servico || '',
        aliquota_iss: nfseData.servico?.aliquota_iss || 0,
        valor_iss: nfseData.servico?.valor_iss || 0,
        valor_liquido: nfseData.servico?.valor_liquido || nfseData.servico?.valor_servicos || 0,
        link_nfse: nfseData.url_pdf,
        xml_nfse: nfseData.xml,
        focus_nfe_ref: referencia
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

        updateStatus({
          currentStatus,
          message: `Status atual: ${currentStatus}`
        });

        // Verificar se é um status final
        if (FINAL_STATUSES.includes(currentStatus)) {
          clearMonitoring();
          
          // Salvar NFSe completa no Supabase
          await salvarNFSeCompleta(referencia, nfseData, empresaId);
          
          updateStatus({
            status: 'completed',
            nfseData,
            message: `NFSe ${currentStatus} com sucesso!`
          });

          if (currentStatus === 'autorizado') {
            toast({
              title: "NFSe Autorizada!",
              description: `NFSe ${nfseData.numero || referencia} foi autorizada com sucesso.`,
            });
          } else {
            toast({
              variant: "destructive",
              title: "NFSe com Problema",
              description: `NFSe ${referencia} teve status: ${currentStatus}`,
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

    // Configurar polling se ainda estiver monitorando
    if (monitoringStatus.status === 'monitoring') {
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
