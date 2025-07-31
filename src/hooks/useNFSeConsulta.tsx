import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useFocusNFeAPI } from '@/hooks/useFocusNFeAPI';

export interface NFSeConsultaFiltros {
  empresa_id?: string;
  cnpj_tomador?: string;
  referencia?: string;
  numero_rps?: string;
  numero_nfse?: string;
  status?: string;
  data_inicio?: string;
  data_fim?: string;
  valor_min?: number;
  valor_max?: number;
  page?: number;
  limit?: number;
}

export interface NFSeItem {
  id: string;
  referencia: string;
  empresa_id: string;
  cnpj_prestador: string;
  razao_social: string;
  numero_nfse?: string;
  rps_numero?: number;
  status: string;
  data_emissao: string;
  valor_servicos: number;
  tomador_razao_social?: string;
  tomador_cnpj?: string;
  tomador_cpf?: string;
  url_xml?: string;
  url_pdf?: string;
  xml_completo?: string;
  json_dados?: any;
  // Campos para compatibilidade
  prestador_razao_social?: string;
  discriminacao?: string;
  fonte: 'supabase' | 'focus_api';
}

export interface NFSeConsultaResult {
  items: NFSeItem[];
  total: number;
  page: number;
  totalPages: number;
  hasMore: boolean;
}

export const useNFSeConsulta = () => {
  const { toast } = useToast();
  const { makeRequest } = useFocusNFeAPI();
  const [loading, setLoading] = useState(false);

  // Consultar NFSe no Supabase (dados recentes)
  const consultarSupabase = useCallback(async (filtros: NFSeConsultaFiltros): Promise<NFSeConsultaResult> => {
    try {
      console.log('🔍 Consultando NFSe no Supabase:', filtros);

      let query = supabase
        .from('notas_fiscais')
        .select(`
          id,
          referencia,
          empresa_id,
          cnpj_prestador,
          razao_social,
          numero_nfse,
          rps_numero,
          status,
          data_emissao,
          valor_servicos,
          tomador_razao_social,
          tomador_cnpj,
          tomador_cpf,
          url_xml,
          url_pdf,
          xml_completo,
          json_dados,
          prestador_razao_social,
          discriminacao
        `, { count: 'exact' });

      // Aplicar filtros
      if (filtros.empresa_id) {
        query = query.eq('empresa_id', filtros.empresa_id);
      }

      if (filtros.cnpj_tomador) {
        query = query.or(`tomador_cnpj.ilike.%${filtros.cnpj_tomador}%,tomador_cpf.ilike.%${filtros.cnpj_tomador}%`);
      }

      if (filtros.referencia) {
        query = query.ilike('referencia', `%${filtros.referencia}%`);
      }

      if (filtros.numero_rps) {
        query = query.eq('rps_numero', parseInt(filtros.numero_rps));
      }

      if (filtros.numero_nfse) {
        query = query.ilike('numero_nfse', `%${filtros.numero_nfse}%`);
      }

      if (filtros.status) {
        query = query.eq('status', filtros.status);
      }

      if (filtros.data_inicio) {
        query = query.gte('data_emissao', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        query = query.lte('data_emissao', filtros.data_fim + 'T23:59:59.999Z');
      }

      if (filtros.valor_min) {
        query = query.gte('valor_servicos', filtros.valor_min);
      }

      if (filtros.valor_max) {
        query = query.lte('valor_servicos', filtros.valor_max);
      }

      // Paginação
      const page = filtros.page || 1;
      const limit = filtros.limit || 20;
      const offset = (page - 1) * limit;

      query = query
        .order('data_emissao', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('❌ Erro ao consultar Supabase:', error);
        throw error;
      }

      const items: NFSeItem[] = (data || []).map(item => ({
        ...item,
        fonte: 'supabase' as const
      }));

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      console.log('✅ Consulta Supabase concluída:', { items: items.length, total });

      return {
        items,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('❌ Erro na consulta Supabase:', error);
      throw error;
    }
  }, []);

  // Consultar NFSe na API Focus NFe (dados antigos)
  const consultarFocusAPI = useCallback(async (filtros: NFSeConsultaFiltros): Promise<NFSeConsultaResult> => {
    try {
      console.log('🔍 Consultando NFSe na Focus API:', filtros);

      // Construir parâmetros da consulta
      const params = new URLSearchParams();

      if (filtros.data_inicio) {
        params.append('data_inicio', filtros.data_inicio);
      }

      if (filtros.data_fim) {
        params.append('data_fim', filtros.data_fim);
      }

      if (filtros.referencia) {
        params.append('referencia', filtros.referencia);
      }

      // Consultar via API Focus NFe
      const response = await makeRequest(`/nfse?${params.toString()}`);
      
      // Transformar dados da API para o formato padrão
      const items: NFSeItem[] = Array.isArray(response) ? response.map((item: any) => ({
        id: item.referencia || item.id,
        referencia: item.referencia,
        empresa_id: '', // Não disponível na API
        cnpj_prestador: item.prestador?.cnpj || '',
        razao_social: item.prestador?.razao_social || '',
        numero_nfse: item.numero,
        rps_numero: item.rps?.numero,
        status: item.status,
        data_emissao: item.data_emissao,
        valor_servicos: item.servico?.valor_servicos || 0,
        tomador_razao_social: item.tomador?.razao_social,
        tomador_cnpj: item.tomador?.cnpj,
        tomador_cpf: item.tomador?.cpf,
        url_xml: item.url_xml,
        url_pdf: item.url_pdf,
        xml_completo: item.xml,
        json_dados: item,
        prestador_razao_social: item.prestador?.razao_social,
        discriminacao: item.servico?.discriminacao,
        fonte: 'focus_api' as const
      })) : [];

      console.log('✅ Consulta Focus API concluída:', { items: items.length });

      return {
        items,
        total: items.length,
        page: 1,
        totalPages: 1,
        hasMore: false
      };
    } catch (error) {
      console.error('❌ Erro na consulta Focus API:', error);
      // Não falhar se a API não estiver disponível
      return {
        items: [],
        total: 0,
        page: 1,
        totalPages: 0,
        hasMore: false
      };
    }
  }, [makeRequest]);

  // Consulta híbrida: combina dados do Supabase e Focus API
  const consultarHibrida = useCallback(async (filtros: NFSeConsultaFiltros): Promise<NFSeConsultaResult> => {
    setLoading(true);
    try {
      console.log('🔄 Iniciando consulta híbrida NFSe:', filtros);

      // Executar consultas em paralelo
      const [resultSupabase, resultFocusAPI] = await Promise.allSettled([
        consultarSupabase(filtros),
        consultarFocusAPI(filtros)
      ]);

      // Processar resultados
      let itemsSupabase: NFSeItem[] = [];
      let itemsFocusAPI: NFSeItem[] = [];

      if (resultSupabase.status === 'fulfilled') {
        itemsSupabase = resultSupabase.value.items;
      } else {
        console.error('❌ Erro na consulta Supabase:', resultSupabase.reason);
      }

      if (resultFocusAPI.status === 'fulfilled') {
        itemsFocusAPI = resultFocusAPI.value.items;
      } else {
        console.warn('⚠️ Erro na consulta Focus API (continuando):', resultFocusAPI.reason);
      }

      // Combinar e deduplificar resultados
      const referenciasSupabase = new Set(itemsSupabase.map(item => item.referencia));
      const itemsFocusAPIFiltrados = itemsFocusAPI.filter(item => 
        item.referencia && !referenciasSupabase.has(item.referencia)
      );

      const todosItems = [...itemsSupabase, ...itemsFocusAPIFiltrados];

      // Ordenar por data de emissão (mais recente primeiro)
      todosItems.sort((a, b) => 
        new Date(b.data_emissao).getTime() - new Date(a.data_emissao).getTime()
      );

      // Aplicar paginação no resultado combinado
      const page = filtros.page || 1;
      const limit = filtros.limit || 20;
      const offset = (page - 1) * limit;
      const itemsPaginados = todosItems.slice(offset, offset + limit);

      const total = todosItems.length;
      const totalPages = Math.ceil(total / limit);

      console.log('✅ Consulta híbrida concluída:', {
        supabase: itemsSupabase.length,
        focusAPI: itemsFocusAPIFiltrados.length,
        total: todosItems.length,
        pagina: itemsPaginados.length
      });

      return {
        items: itemsPaginados,
        total,
        page,
        totalPages,
        hasMore: page < totalPages
      };
    } catch (error) {
      console.error('❌ Erro na consulta híbrida:', error);
      toast({
        variant: "destructive",
        title: "Erro na Consulta",
        description: "Erro ao consultar NFSe. Tente novamente.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [consultarSupabase, consultarFocusAPI, toast]);

  return {
    consultarHibrida,
    consultarSupabase,
    consultarFocusAPI,
    loading
  };
};
