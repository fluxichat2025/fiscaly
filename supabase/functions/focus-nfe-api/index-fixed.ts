import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Token da Focus NFe configurado
const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para criar headers da Focus NFe
function createFocusHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(FOCUS_NFE_TOKEN + ':')}`
  };
}

// Função para tratar erros da Focus NFe
function parseFocusError(errorData: any): string {
  if (!errorData) return 'Erro desconhecido';
  
  const errorMessage = errorData.mensagem || errorData.erro || errorData.message || '';
  
  // Erros específicos de certificado
  if (errorMessage.includes('senha') || errorMessage.includes('password')) {
    return 'Senha do certificado digital incorreta. Verifique a senha e tente novamente.';
  }
  >
  if (errorMessage.includes('vencido') || errorMessage.includes('expirado')) {
    return 'Certificado digital vencido. Renove seu certificado e tente novamente.';
  }
  
  if (errorMessage.includes('invalido') || errorMessage.includes('corrompido')) {
    return 'Certificado digital inválido ou corrompido. Verifique o arquivo e tente novamente.';
  }
  
  if (errorMessage.includes('certificado')) {
    return 'Erro no certificado digital. Verifique o arquivo e a senha.';
  }
  
  if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
    return 'Token da Focus NFe inválido. Verifique suas credenciais.';
  }
  
  // Se tem array de erros
  if (errorData.erros && Array.isArray(errorData.erros)) {
    const errors = errorData.erros.map((err: any) => err.mensagem || err.message).join('; ');
    return `Erros de validação: ${errors}`;
  }
  
  return errorMessage || 'Erro na validação do certificado';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, data } = await req.json();
    console.log('Focus NFe API action:', action);

    switch (action) {
      case 'validate_certificate': {
        const { certificado_base64, senha_certificado } = data;
        
        console.log('Validating certificate...');
        
        // Validar certificado criando uma empresa temporária
        const testData = {
          cnpj: '12345678000190',
          razao_social: 'Teste Validação Certificado',
          nome_fantasia: 'Teste Validação',
          logradouro: 'Rua Teste, 123',
          numero: '123',
          bairro: 'Centro',
          municipio: 'São Paulo',
          uf: 'SP',
          cep: '01000000',
          codigo_municipio: '3550308',
          codigo_uf: '35',
          codigo_pais: '1058',
          email: 'teste@example.com',
          regime_tributario: '1',
          arquivo_certificado_base64: certificado_base64,
          senha_certificado: senha_certificado,
          habilita_nfse: true
        };

        // Tentar criar empresa de teste para validar certificado
        const focusResponse = await fetch('https://homologacao.focusnfe.com.br/v2/empresas', {
          method: 'POST',
          headers: createFocusHeaders(),
          body: JSON.stringify(testData)
        });

        const result = await focusResponse.json();
        console.log('Certificate validation result:', result);

        if (!focusResponse.ok) {
          const errorMessage = parseFocusError(result);
          return new Response(
            JSON.stringify({ 
              success: false, 
              error: errorMessage
            }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 400 
            }
          );
        }
        
        // Se chegou até aqui, o certificado é válido
        const certInfo = {
          cnpj: result.cnpj || testData.cnpj,
          razao_social: result.razao_social || result.nome || testData.razao_social,
          valid_until: result.certificado_valido_ate || result.valido_ate || '2025-12-31'
        };

        // Remover empresa de teste
        try {
          await fetch(`https://homologacao.focusnfe.com.br/v2/empresas/${testData.cnpj}`, {
            method: 'DELETE',
            headers: createFocusHeaders()
          });
        } catch (e) {
          console.log('Erro ao remover empresa de teste:', e);
        }
        
        return new Response(
          JSON.stringify({ 
            success: true,
            cnpj: certInfo.cnpj,
            razao_social: certInfo.razao_social,
            valid_until: certInfo.valid_until,
            message: 'Certificado validado com sucesso'
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200 
          }
        );
      }

      default:
        throw new Error('Ação não reconhecida');
    }

  } catch (error) {
    console.error('Erro na API Focus NFe:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});