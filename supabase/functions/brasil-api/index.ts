import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CNPJData {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: string;
  data_inicio_atividade: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
  tipo_logradouro?: string;
  logradouro?: string;
  numero?: string;
  bairro?: string;
  municipio?: string;
  uf?: string;
  cep?: string;
  codigo_municipio?: string;
  porte: string;
  natureza_juridica: string;
  situacao_especial?: string;
  opcao_pelo_simples?: boolean;
  opcao_pelo_mei?: boolean;
  capital_social?: string;
  socios?: Array<{
    nome: string;
    qualificacao: string;
  }>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cnpj } = await req.json();

    if (!cnpj) {
      return new Response(
        JSON.stringify({ error: 'CNPJ é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Remove formatting from CNPJ
    const cleanCNPJ = cnpj.replace(/[^\d]/g, '');

    if (cleanCNPJ.length !== 14) {
      return new Response(
        JSON.stringify({ error: 'CNPJ deve ter 14 dígitos' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Consultando CNPJ: ${cleanCNPJ}`);

    // Call Brasil API
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    
    if (!response.ok) {
      throw new Error(`Brasil API error: ${response.status}`);
    }

    const data: CNPJData = await response.json();

    // Transform the data to match our database structure
    const transformedData = {
      cnpj_cpf: data.cnpj,
      razao_social: data.razao_social,
      nome_fantasia: data.nome_fantasia || '',
      situacao_cadastral: data.situacao_cadastral,
      data_abertura: data.data_inicio_atividade,
      cnae: data.cnae_fiscal,
      atividade_principal: data.cnae_fiscal_descricao,
      tipo_logradouro: data.tipo_logradouro || '',
      logradouro: data.logradouro || '',
      numero: data.numero || '',
      bairro: data.bairro || '',
      cidade: data.municipio || '',
      estado_uf: data.uf || '',
      cep: data.cep || '',
      codigo_municipio: data.codigo_municipio || '',
      company_type: getCompanyType(data.porte, data.natureza_juridica),
      optante_simples_nacional: data.opcao_pelo_simples || false,
      socios: data.socios ? data.socios.map(socio => socio.nome) : [],
      // Default values for required fields
      tributacao_nacional: '',
      aliquota: 0,
      iss_retido: false,
      natureza_operacao: '',
      regime_especial_tributacao: '',
      incentivador_cultural: false,
      servicos: [],
      descricao: ''
    };

    return new Response(
      JSON.stringify(transformedData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in brasil-api function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao consultar CNPJ',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function getCompanyType(porte: string, naturezaJuridica: string): string {
  // Map Brasil API company types to our enum
  if (naturezaJuridica.includes('MEI') || porte === 'MEI') return 'MEI';
  if (porte === 'ME') return 'ME';
  if (porte === 'EPP') return 'EPP';
  if (naturezaJuridica.includes('LTDA')) return 'LTDA';
  if (naturezaJuridica.includes('S/A') || naturezaJuridica.includes('SA')) return 'SA';
  if (naturezaJuridica.includes('EIRELI')) return 'EIRELI';
  return 'LTDA'; // Default
}