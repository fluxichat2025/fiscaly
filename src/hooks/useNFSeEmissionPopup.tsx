import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { NFSeEmissionStatus } from '@/components/NFSeEmissionPopup';
import { parseNFSeXML, NFSeXmlData } from '@/utils/nfseXmlParser';

export const useNFSeEmissionPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<NFSeEmissionStatus>({
    status: 'loading',
    message: 'Carregando...',
    attempts: 0,
    maxAttempts: 40,
    timeElapsed: 0
  });
  
  const { toast } = useToast();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const referenciaRef = useRef<string>('');

  // Função para baixar e fazer parse do XML da NFSe
  const baixarEParsearXML = useCallback(async (caminhoXml: string): Promise<NFSeXmlData | null> => {
    try {
      console.log('📥 Baixando XML da NFSe:', caminhoXml);

      // Fazer requisição para baixar o XML via proxy do Vite
      const response = await fetch(`/api/focusnfe${caminhoXml}`, {
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro ao baixar XML: ${response.status}`);
      }

      // Obter o conteúdo XML como texto
      const xmlContent = await response.text();
      console.log('📄 XML baixado, tamanho:', xmlContent.length);

      // Fazer parse do XML
      const parsedData = parseNFSeXML(xmlContent);

      if (parsedData) {
        console.log('✅ Parse do XML realizado com sucesso');
        return parsedData;
      } else {
        console.error('❌ Falha no parse do XML');
        return null;
      }

    } catch (error) {
      console.error('❌ Erro ao baixar/parsear XML:', error);
      return null;
    }
  }, []);

  // Função para salvar dados completos no Supabase
  const salvarNFSeCompleta = useCallback(async (referencia: string, nfseData: any, empresaId: string) => {
    try {
      console.log('💾 Salvando NFSe completa no Supabase:', { referencia, nfseData, empresaId });

      // Verificar se os dados essenciais estão presentes
      if (!referencia) {
        throw new Error('Referência da NFSe é obrigatória');
      }

      if (!nfseData) {
        throw new Error('Dados da NFSe são obrigatórios');
      }

      // Tentar baixar e fazer parse do XML se disponível
      let xmlData: NFSeXmlData | null = null;
      if (nfseData.caminho_xml_nota_fiscal) {
        console.log('🔍 Tentando baixar e parsear XML da NFSe...');
        xmlData = await baixarEParsearXML(nfseData.caminho_xml_nota_fiscal);
      }

      // Mapear todos os campos conforme nova estrutura da tabela
      // Priorizar dados do XML quando disponíveis, senão usar dados do JSON
      const dadosParaSalvar = {
        // Referência única
        referencia_rps: referencia,

        // InfNfse (priorizar XML)
        inf_nfse_id: xmlData?.inf_nfse_id || '',
        numero: xmlData?.numero || nfseData.numero,
        codigo_verificacao: xmlData?.codigo_verificacao || nfseData.codigo_verificacao,
        data_emissao: xmlData?.data_emissao || nfseData.data_emissao,

        // ValoresNfse (priorizar XML)
        base_calculo: xmlData?.base_calculo || nfseData.base_calculo,
        valor_iss: xmlData?.valor_iss || nfseData.valor_iss,
        valor_liquido_nfse: xmlData?.valor_liquido_nfse || nfseData.valor_liquido_nfse,

        // PrestadorServico (priorizar XML)
        prestador_cnpj: xmlData?.prestador_cnpj || nfseData.cnpj_prestador,
        prestador_inscricao_municipal: xmlData?.prestador_inscricao_municipal || nfseData.inscricao_municipal_prestador,
        prestador_razao_social: xmlData?.prestador_razao_social || nfseData.razao_social_prestador,
        prestador_endereco: xmlData?.prestador_endereco || nfseData.endereco_prestador,
        prestador_numero: xmlData?.prestador_numero || nfseData.numero_prestador,
        prestador_bairro: xmlData?.prestador_bairro || nfseData.bairro_prestador,
        prestador_codigo_municipio: xmlData?.prestador_codigo_municipio || nfseData.codigo_municipio_prestador,
        prestador_uf: xmlData?.prestador_uf || nfseData.uf_prestador,
        prestador_cep: xmlData?.prestador_cep || nfseData.cep_prestador,
        prestador_telefone: xmlData?.prestador_telefone || nfseData.telefone_prestador,
        prestador_email: xmlData?.prestador_email || nfseData.email_prestador,
        
        // OrgaoGerador (priorizar XML)
        orgao_codigo_municipio: xmlData?.orgao_codigo_municipio || nfseData.codigo_municipio_orgao,
        orgao_uf: xmlData?.orgao_uf || nfseData.uf_orgao,

        // RPS (priorizar XML)
        rps_numero: xmlData?.rps_numero || nfseData.numero_rps,
        rps_serie: xmlData?.rps_serie || nfseData.serie_rps,
        rps_tipo: xmlData?.rps_tipo || nfseData.tipo_rps,
        rps_status: xmlData?.rps_status || nfseData.status_rps,

        // Competência (priorizar XML)
        competencia: xmlData?.competencia || nfseData.competencia,
        
        // Servico > Valores (priorizar XML)
        servico_valor_servicos: xmlData?.servico_valor_servicos || nfseData.valor_servicos,
        servico_valor_deducoes: xmlData?.servico_valor_deducoes || nfseData.valor_deducoes,
        servico_valor_pis: xmlData?.servico_valor_pis || nfseData.valor_pis,
        servico_valor_cofins: xmlData?.servico_valor_cofins || nfseData.valor_cofins,
        servico_valor_inss: xmlData?.servico_valor_inss || nfseData.valor_inss,
        servico_valor_ir: xmlData?.servico_valor_ir || nfseData.valor_ir,
        servico_valor_csll: xmlData?.servico_valor_csll || nfseData.valor_csll,
        servico_outras_retencoes: xmlData?.servico_outras_retencoes || nfseData.outras_retencoes,
        servico_valor_iss: xmlData?.servico_valor_iss || nfseData.valor_iss_servico,
        servico_aliquota: xmlData?.servico_aliquota || nfseData.aliquota,
        servico_desconto_incondicionado: xmlData?.servico_desconto_incondicionado || nfseData.desconto_incondicionado,
        servico_desconto_condicionado: xmlData?.servico_desconto_condicionado || nfseData.desconto_condicionado,

        // Servico (priorizar XML)
        servico_iss_retido: xmlData?.servico_iss_retido || (nfseData.iss_retido ? 1 : 2),
        servico_item_lista_servico: xmlData?.servico_item_lista_servico || nfseData.item_lista_servico,
        servico_codigo_cnae: xmlData?.servico_codigo_cnae || nfseData.codigo_cnae,
        servico_discriminacao: xmlData?.servico_discriminacao || nfseData.discriminacao,
        servico_codigo_municipio: xmlData?.servico_codigo_municipio || nfseData.codigo_municipio_servico,
        servico_exigibilidade_iss: xmlData?.servico_exigibilidade_iss || nfseData.exigibilidade_iss,
        
        // Tomador (priorizar XML)
        tomador_cnpj: xmlData?.tomador_cnpj || nfseData.cnpj_tomador,
        tomador_razao_social: xmlData?.tomador_razao_social || nfseData.razao_social_tomador,
        tomador_endereco: xmlData?.tomador_endereco || nfseData.endereco_tomador,
        tomador_numero: xmlData?.tomador_numero || nfseData.numero_tomador,
        tomador_bairro: xmlData?.tomador_bairro || nfseData.bairro_tomador,
        tomador_codigo_municipio: xmlData?.tomador_codigo_municipio || nfseData.codigo_municipio_tomador,
        tomador_uf: xmlData?.tomador_uf || nfseData.uf_tomador,
        tomador_codigo_pais: xmlData?.tomador_codigo_pais || nfseData.codigo_pais_tomador,
        tomador_cep: xmlData?.tomador_cep || nfseData.cep_tomador,
        tomador_email: xmlData?.tomador_email || nfseData.email_tomador,

        // Dados fiscais (priorizar XML)
        optante_simples_nacional: xmlData?.optante_simples_nacional || (nfseData.optante_simples_nacional ? 1 : 2),
        incentivo_fiscal: xmlData?.incentivo_fiscal || (nfseData.incentivo_fiscal ? 1 : 2),

        // ListaMensagemRetorno (priorizar XML)
        lista_mensagem_retorno: xmlData?.lista_mensagem_retorno || '',

        // Metadados de controle
        empresa_id: empresaId,
        status_processamento: nfseData.status,
        caminho_xml: nfseData.caminho_xml_nota_fiscal,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Log dos dados que serão salvos
      if (xmlData) {
        console.log('✅ Dados extraídos do XML e mesclados com JSON');
      } else {
        console.log('⚠️ XML não disponível, usando apenas dados do JSON');
      }

      console.log('📋 Dados mapeados para salvar:', dadosParaSalvar);

      const { data, error } = await supabase
        .from('nfse_emitidas')
        .upsert(dadosParaSalvar, {
          onConflict: 'referencia_rps'
        })
        .select();

      if (error) {
        console.error('❌ Erro ao salvar NFSe no Supabase:', error);
        console.error('❌ Detalhes do erro:', error.message, error.details, error.hint);
        throw error;
      }

      console.log('✅ NFSe salva no Supabase com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro ao salvar NFSe completa:', error);
      throw error;
    }
  }, []);

  // Função para consultar NFSe via API otimizada
  const consultarNFSe = useCallback(async (referencia: string) => {
    try {
      console.log('🔍 Consultando NFSe via API:', referencia);
      const response = await fetch(`/api/nfse/${referencia}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro HTTP na consulta:', response.status, errorText);

        // Se for 404, significa que ainda está processando
        if (response.status === 404) {
          return {
            status: 'processando',
            httpCode: 404,
            message: 'NFSe ainda processando'
          };
        }

        throw new Error(`Erro na consulta: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📋 Resposta da consulta NFSe:', data);

      // Mapear resposta para formato esperado
      return {
        status: 'sucesso',
        httpCode: response.status,
        data: data,
        message: 'Consulta realizada com sucesso'
      };
    } catch (error) {
      console.error('❌ Erro ao consultar NFSe:', error);
      throw error;
    }
  }, []);

  // Função para iniciar o monitoramento
  const startMonitoring = useCallback(async (referencia: string, empresaId: string, initialData?: any) => {
    console.log('🚀 Iniciando monitoramento NFSe:', referencia);
    
    referenciaRef.current = referencia;
    startTimeRef.current = Date.now();
    
    setIsOpen(true);
    setStatus({
      status: 'loading',
      message: 'Enviando NFSe para processamento...',
      attempts: 0,
      maxAttempts: 40,
      timeElapsed: 0,
      nfseData: initialData
    });

    // Timer para atualizar tempo decorrido
    timerRef.current = setInterval(() => {
      const timeElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setStatus(prev => ({
        ...prev,
        timeElapsed
      }));
    }, 1000);

    // Aguardar um pouco antes de iniciar o polling
    setTimeout(() => {
      setStatus(prev => ({
        ...prev,
        status: 'monitoring',
        message: 'Consultando status no provedor NFSe...'
      }));

      // Iniciar polling
      let attempts = 0;
      const maxAttempts = 40;

      const checkStatus = async () => {
        try {
          attempts++;
          console.log(`🔍 Tentativa ${attempts}/${maxAttempts} - Consultando NFSe:`, referencia);

          setStatus(prev => ({
            ...prev,
            attempts,
            message: `Consultando... (tentativa ${attempts}/${maxAttempts})`
          }));

          const result = await consultarNFSe(referencia);
          console.log('📊 Resultado da consulta:', result);
          console.log('📊 Status da consulta:', result.status);
          console.log('📊 HTTP Code:', result.httpCode);
          console.log('📊 Data da consulta:', result.data);

          // Verificar se ainda está processando (status 404 ou processando)
          if (result.status === 'processando' || result.httpCode === 404) {
            console.log('⏳ NFSe ainda processando...');
            setStatus(prev => ({
              ...prev,
              currentStatus: 'processando_autorizacao',
              message: 'NFSe sendo processada pelo provedor...'
            }));
            return; // Continuar polling
          }

          // Status final detectado - NFSe autorizada
          if (result.status === 'sucesso' && result.data) {
            const nfseData = result.data;
            console.log('✅ NFSe com sucesso, dados:', nfseData);
            console.log('✅ Status da NFSe:', nfseData.status);

            // Verificar se realmente foi autorizada
            if (nfseData.status === 'autorizado') {
              console.log('🎉 NFSe AUTORIZADA! Salvando no Supabase...');

              // Salvar no Supabase
              try {
                await salvarNFSeCompleta(referencia, nfseData, empresaId);
                console.log('✅ Dados salvos no Supabase com sucesso!');
              } catch (saveError) {
                console.error('❌ Erro ao salvar no Supabase:', saveError);
              }

              setStatus({
                status: 'authorized',
                message: 'NFSe autorizada com sucesso!',
                attempts,
                maxAttempts,
                timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
                nfseData
              });

              // Parar polling
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              toast({
                title: "NFSe Autorizada!",
                description: `NFSe nº ${nfseData.numero || referencia} foi autorizada com sucesso.`,
              });

            } else if (nfseData.status === 'erro_autorizacao') {
              // NFSe com erro de autorização
              console.error('❌ Erro de autorização na NFSe:', nfseData);

              // Salvar erro no Supabase
              try {
                await salvarNFSeCompleta(referencia, nfseData, empresaId);
              } catch (saveError) {
                console.error('❌ Erro ao salvar erro no Supabase:', saveError);
              }

              setStatus({
                status: 'error',
                message: 'Erro na autorização da NFSe',
                attempts,
                maxAttempts,
                timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
                errorDetails: 'Erro de autorização retornado pela prefeitura',
                errors: nfseData.erros || []
              });

              // Parar polling
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }

              toast({
                variant: "destructive",
                title: "Erro na Autorização",
                description: "A NFSe foi rejeitada pela prefeitura",
              });
            }

          } else if (result.status === 'erro' || result.httpCode >= 400) {
            // Erro na API ou resposta de erro
            console.error('❌ Erro na API NFSe:', result);

            // Salvar erro no Supabase
            try {
              await salvarNFSeCompleta(referencia, result.data || result, empresaId);
            } catch (saveError) {
              console.error('❌ Erro ao salvar erro no Supabase:', saveError);
            }

            setStatus({
              status: 'error',
              message: 'Erro na emissão da NFSe',
              attempts,
              maxAttempts,
              timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
              errorDetails: result.message || 'Erro na comunicação com a API',
              errorCode: result.httpCode ? result.httpCode.toString() : undefined
            });

            // Parar polling
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            toast({
              variant: "destructive",
              title: "Erro na NFSe",
              description: result.message || 'Erro na emissão da NFSe',
            });
          }

        } catch (error) {
          console.error('❌ Erro na consulta:', error);
          
          if (attempts >= maxAttempts) {
            setStatus({
              status: 'error',
              message: 'Timeout no monitoramento',
              attempts,
              maxAttempts,
              timeElapsed: Math.floor((Date.now() - startTimeRef.current) / 1000),
              errorDetails: 'Tempo limite excedido para monitoramento'
            });

            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }

            toast({
              variant: "destructive",
              title: "Timeout",
              description: "Tempo limite excedido para monitoramento da NFSe",
            });
          }
        }
      };

      // Primeira consulta imediata
      checkStatus();

      // Configurar polling a cada 15 segundos
      intervalRef.current = setInterval(() => {
        if (attempts >= maxAttempts) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }
        checkStatus();
      }, 15000);

    }, 2000); // Aguardar 2 segundos antes de iniciar

  }, [consultarNFSe, salvarNFSeCompleta, toast]);

  // Função para parar o monitoramento
  const stopMonitoring = useCallback(() => {
    console.log('⏹️ Parando monitoramento NFSe');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setStatus(prev => ({
      ...prev,
      status: 'cancelled',
      message: 'Monitoramento cancelado pelo usuário'
    }));

    toast({
      title: "Monitoramento Cancelado",
      description: "O monitoramento da NFSe foi interrompido",
    });
  }, [toast]);

  // Função para fechar o popup
  const closePopup = useCallback(() => {
    setIsOpen(false);
    
    // Limpar timers se ainda estiverem rodando
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Função para download de XML
  const handleDownloadXML = useCallback(async (caminho: string, tipo: 'nfse' | 'cancelamento') => {
    try {
      const response = await fetch(`/api/focusnfe${caminho}`, {
        headers: {
          'Authorization': 'Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6'
        }
      });

      if (!response.ok) throw new Error(`Erro no download: ${response.status}`);

      const xmlContent = await response.text();
      const blob = new Blob([xmlContent], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tipo}-${referenciaRef.current}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Download Concluído",
        description: `Arquivo XML baixado com sucesso.`,
      });
    } catch (error) {
      console.error('❌ Erro no download:', error);
      toast({
        variant: "destructive",
        title: "Erro no Download",
        description: "Não foi possível baixar o arquivo XML",
      });
    }
  }, [toast]);

  // Função para abrir página da prefeitura
  const handleViewPrefeitura = useCallback((url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
    toast({
      title: "Abrindo na Prefeitura",
      description: "A página da prefeitura foi aberta em uma nova aba.",
    });
  }, [toast]);

  return {
    isOpen,
    status,
    startMonitoring,
    stopMonitoring,
    closePopup,
    handleDownloadXML,
    handleViewPrefeitura
  };
};
