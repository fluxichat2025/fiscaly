import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface CompanyNfseData {
  // Company basic info
  id: string;
  cnpj_cpf: string;
  razao_social: string;
  
  // Legacy single NFSe config (from companies table)
  legacyConfig: {
    item_lista_servico?: string;
    codigo_tributario_municipio?: string;
    aliquota?: number;
    iss_retido?: boolean;
    natureza_operacao?: string;
    optante_simples_nacional?: boolean;
    incentivador_cultural?: boolean;
  };
  
  // Multiple entries (from separate tables)
  municipalTaxCodes: Array<{
    id: string;
    codigo_tributario_municipio: string;
    descricao?: string;
  }>;
  
  serviceItems: Array<{
    id: string;
    item_lista_servico: string;
    descricao?: string;
  }>;
}

export const useNfseCompanyData = () => {
  const [companyData, setCompanyData] = useState<CompanyNfseData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompanyNfseData = async (companyId: string) => {
    if (!companyId) {
      setCompanyData(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load company basic info and legacy NFSe config
      const { data: companyInfo, error: companyError } = await supabase
        .from('companies')
        .select(`
          id,
          cnpj_cpf,
          razao_social,
          item_lista_servico,
          codigo_tributario_municipio,
          aliquota,
          iss_retido,
          natureza_operacao,
          optante_simples_nacional,
          incentivador_cultural
        `)
        .eq('id', companyId)
        .single();

      if (companyError) {
        throw new Error(`Erro ao carregar dados da empresa: ${companyError.message}`);
      }

      // Load multiple municipal tax codes
      const { data: taxCodes, error: taxCodesError } = await supabase
        .from('company_municipal_tax_codes')
        .select('id, codigo_tributario_municipio, descricao')
        .eq('company_id', companyId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (taxCodesError) {
        console.warn('Erro ao carregar códigos tributários:', taxCodesError);
      }

      // Load multiple service items
      const { data: serviceItems, error: serviceItemsError } = await supabase
        .from('company_service_items')
        .select('id, item_lista_servico, descricao')
        .eq('company_id', companyId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (serviceItemsError) {
        console.warn('Erro ao carregar itens de serviço:', serviceItemsError);
      }

      // Combine all data
      const nfseData: CompanyNfseData = {
        id: companyInfo.id,
        cnpj_cpf: companyInfo.cnpj_cpf,
        razao_social: companyInfo.razao_social,
        legacyConfig: {
          item_lista_servico: companyInfo.item_lista_servico,
          codigo_tributario_municipio: companyInfo.codigo_tributario_municipio,
          aliquota: companyInfo.aliquota,
          iss_retido: companyInfo.iss_retido,
          natureza_operacao: companyInfo.natureza_operacao,
          optante_simples_nacional: companyInfo.optante_simples_nacional,
          incentivador_cultural: companyInfo.incentivador_cultural,
        },
        municipalTaxCodes: taxCodes || [],
        serviceItems: serviceItems || [],
      };

      setCompanyData(nfseData);
      console.log('✅ Dados de NFSe carregados:', nfseData);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      console.error('❌ Erro ao carregar dados de NFSe:', err);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Erro ao carregar configurações de NFSe: ${errorMessage}`,
      });
    } finally {
      setLoading(false);
    }
  };

  // Get the best available service item (prioritize multiple entries, fallback to legacy)
  const getBestServiceItem = useCallback(() => {
    if (!companyData) return null;

    // If we have multiple service items, return the first one
    if (companyData.serviceItems.length > 0) {
      return companyData.serviceItems[0].item_lista_servico;
    }

    // Fallback to legacy config
    return companyData.legacyConfig.item_lista_servico || null;
  }, [companyData]);

  // Get the best available municipal tax code (prioritize multiple entries, fallback to legacy)
  const getBestMunicipalTaxCode = useCallback(() => {
    if (!companyData) return null;

    // If we have multiple tax codes, return the first one
    if (companyData.municipalTaxCodes.length > 0) {
      return companyData.municipalTaxCodes[0].codigo_tributario_municipio;
    }

    // Fallback to legacy config
    return companyData.legacyConfig.codigo_tributario_municipio || null;
  }, [companyData]);

  // Get all available service items for dropdown
  const getAllServiceItems = useCallback(() => {
    if (!companyData) {
      return [];
    }

    const items = [];

    // Add multiple entries first
    if (companyData.serviceItems && Array.isArray(companyData.serviceItems)) {
      companyData.serviceItems.forEach(item => {
        if (item && item.item_lista_servico) {
          items.push({
            value: item.item_lista_servico,
            label: item.descricao
              ? `${item.item_lista_servico} - ${item.descricao}`
              : item.item_lista_servico,
            source: 'multiple'
          });
        }
      });
    }

    // Add legacy entry if it exists and is not already in the list
    if (companyData.legacyConfig && companyData.legacyConfig.item_lista_servico) {
      const legacyExists = items.some(item =>
        item.value === companyData.legacyConfig.item_lista_servico
      );

      if (!legacyExists) {
        items.push({
          value: companyData.legacyConfig.item_lista_servico,
          label: `${companyData.legacyConfig.item_lista_servico} (Legado)`,
          source: 'legacy'
        });
      }
    }

    return items;
  }, [companyData]);

  // Get all available municipal tax codes for dropdown
  const getAllMunicipalTaxCodes = useCallback(() => {
    if (!companyData) {
      return [];
    }

    const codes = [];

    // Add multiple entries first
    if (companyData.municipalTaxCodes && Array.isArray(companyData.municipalTaxCodes)) {
      companyData.municipalTaxCodes.forEach(code => {
        if (code && code.codigo_tributario_municipio) {
          codes.push({
            value: code.codigo_tributario_municipio,
            label: code.descricao
              ? `${code.codigo_tributario_municipio} - ${code.descricao}`
              : code.codigo_tributario_municipio,
            source: 'multiple'
          });
        }
      });
    }

    // Add legacy entry if it exists and is not already in the list
    if (companyData.legacyConfig && companyData.legacyConfig.codigo_tributario_municipio) {
      const legacyExists = codes.some(code =>
        code.value === companyData.legacyConfig.codigo_tributario_municipio
      );

      if (!legacyExists) {
        codes.push({
          value: companyData.legacyConfig.codigo_tributario_municipio,
          label: `${companyData.legacyConfig.codigo_tributario_municipio} (Legado)`,
          source: 'legacy'
        });
      }
    }

    return codes;
  }, [companyData]);

  return {
    companyData,
    loading,
    error,
    loadCompanyNfseData,
    getBestServiceItem,
    getBestMunicipalTaxCode,
    getAllServiceItems,
    getAllMunicipalTaxCodes,
  };
};
