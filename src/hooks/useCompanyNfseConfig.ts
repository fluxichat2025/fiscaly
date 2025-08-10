import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CompanyMunicipalTaxCode {
  id?: string;
  company_id: string;
  codigo_tributario_municipio: string;
  descricao?: string;
  ativo?: boolean;
}

export interface CompanyServiceItem {
  id?: string;
  company_id: string;
  item_lista_servico: string;
  descricao?: string;
  ativo?: boolean;
}

export interface CompanyNfseConfig {
  municipalTaxCodes: CompanyMunicipalTaxCode[];
  serviceItems: CompanyServiceItem[];
}

export const useCompanyNfseConfig = (companyId?: string) => {
  const [config, setConfig] = useState<CompanyNfseConfig>({
    municipalTaxCodes: [],
    serviceItems: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load NFSe configuration for a company
  const loadConfig = async (id?: string) => {
    const targetId = id || companyId;
    if (!targetId) return;

    setLoading(true);
    setError(null);

    try {
      // Load municipal tax codes
      const { data: taxCodes, error: taxCodesError } = await supabase
        .from('company_municipal_tax_codes')
        .select('*')
        .eq('company_id', targetId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (taxCodesError) throw taxCodesError;

      // Load service items
      const { data: serviceItems, error: serviceItemsError } = await supabase
        .from('company_service_items')
        .select('*')
        .eq('company_id', targetId)
        .eq('ativo', true)
        .order('created_at', { ascending: true });

      if (serviceItemsError) throw serviceItemsError;

      setConfig({
        municipalTaxCodes: taxCodes || [],
        serviceItems: serviceItems || []
      });
    } catch (err) {
      console.error('Error loading NFSe config:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  // Add a new municipal tax code
  const addMunicipalTaxCode = async (taxCode: Omit<CompanyMunicipalTaxCode, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('company_municipal_tax_codes')
        .insert(taxCode)
        .select()
        .single();

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        municipalTaxCodes: [...prev.municipalTaxCodes, data]
      }));

      toast.success('Código tributário adicionado com sucesso');
      return data;
    } catch (err) {
      console.error('Error adding municipal tax code:', err);
      toast.error('Erro ao adicionar código tributário');
      throw err;
    }
  };

  // Update a municipal tax code
  const updateMunicipalTaxCode = async (id: string, updates: Partial<CompanyMunicipalTaxCode>) => {
    try {
      const { data, error } = await supabase
        .from('company_municipal_tax_codes')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        municipalTaxCodes: prev.municipalTaxCodes.map(item => 
          item.id === id ? data : item
        )
      }));

      toast.success('Código tributário atualizado com sucesso');
      return data;
    } catch (err) {
      console.error('Error updating municipal tax code:', err);
      toast.error('Erro ao atualizar código tributário');
      throw err;
    }
  };

  // Remove a municipal tax code (soft delete)
  const removeMunicipalTaxCode = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_municipal_tax_codes')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        municipalTaxCodes: prev.municipalTaxCodes.filter(item => item.id !== id)
      }));

      toast.success('Código tributário removido com sucesso');
    } catch (err) {
      console.error('Error removing municipal tax code:', err);
      toast.error('Erro ao remover código tributário');
      throw err;
    }
  };

  // Add a new service item
  const addServiceItem = async (serviceItem: Omit<CompanyServiceItem, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('company_service_items')
        .insert(serviceItem)
        .select()
        .single();

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        serviceItems: [...prev.serviceItems, data]
      }));

      toast.success('Item de serviço adicionado com sucesso');
      return data;
    } catch (err) {
      console.error('Error adding service item:', err);
      toast.error('Erro ao adicionar item de serviço');
      throw err;
    }
  };

  // Update a service item
  const updateServiceItem = async (id: string, updates: Partial<CompanyServiceItem>) => {
    try {
      const { data, error } = await supabase
        .from('company_service_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        serviceItems: prev.serviceItems.map(item => 
          item.id === id ? data : item
        )
      }));

      toast.success('Item de serviço atualizado com sucesso');
      return data;
    } catch (err) {
      console.error('Error updating service item:', err);
      toast.error('Erro ao atualizar item de serviço');
      throw err;
    }
  };

  // Remove a service item (soft delete)
  const removeServiceItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('company_service_items')
        .update({ ativo: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setConfig(prev => ({
        ...prev,
        serviceItems: prev.serviceItems.filter(item => item.id !== id)
      }));

      toast.success('Item de serviço removido com sucesso');
    } catch (err) {
      console.error('Error removing service item:', err);
      toast.error('Erro ao remover item de serviço');
      throw err;
    }
  };

  // Load config when companyId changes
  useEffect(() => {
    if (companyId) {
      loadConfig(companyId);
    }
  }, [companyId]);

  return {
    config,
    loading,
    error,
    loadConfig,
    addMunicipalTaxCode,
    updateMunicipalTaxCode,
    removeMunicipalTaxCode,
    addServiceItem,
    updateServiceItem,
    removeServiceItem
  };
};
