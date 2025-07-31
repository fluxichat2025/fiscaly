import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function createFocusHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${FOCUS_NFE_TOKEN}`,
  }
}

function parseFocusError(errorData: any): string {
  if (!errorData) return 'Erro desconhecido'
  
  const errorMessage = typeof errorData === 'string' 
    ? errorData 
    : errorData.message || errorData.erro || JSON.stringify(errorData)
  
  console.log('Focus NFe Error:', errorMessage)
  
  // Erros específicos de certificado
  if (errorMessage.includes('senha') || errorMessage.includes('password')) {
    return 'Senha do certificado digital incorreta. Verifique a senha e tente novamente.';
  }
  
  if (errorMessage.includes('vencido') || errorMessage.includes('expirado')) {
    return 'Certificado digital vencido. Renove seu certificado e tente novamente.';
  }
  
  if (errorMessage.includes('invalido') || errorMessage.includes('corrompido')) {
    return 'Certificado digital inválido ou corrompido. Verifique o arquivo e tente novamente.';
  }
  
  if (errorMessage.includes('certificado')) {
    return 'Erro no certificado digital. Verifique o arquivo e a senha.';
  }
  
  // Erros de CNPJ
  if (errorMessage.includes('cnpj')) {
    if (errorMessage.includes('ja existe') || errorMessage.includes('duplicado')) {
      return 'CNPJ já cadastrado na Focus NFe.';
    }
    if (errorMessage.includes('invalido')) {
      return 'CNPJ inválido. Verifique o número e tente novamente.';
    }
  }
  
  // Outros erros
  if (errorMessage.includes('token') || errorMessage.includes('unauthorized')) {
    return 'Token da Focus NFe inválido. Verifique suas credenciais.';
  }
  
  return `Erro na Focus NFe: ${errorMessage}`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Focus NFe API request received')
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { action, data } = await req.json()
    console.log('Action:', action, 'Data keys:', Object.keys(data || {}))

    if (action === 'validate_certificate') {
      const { certificado_base64, senha_certificado } = data
      
      if (!certificado_base64 || !senha_certificado) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Certificado e senha são obrigatórios'
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      console.log('Validating certificate...')

      // Criar empresa temporária para validar o certificado
      const tempCompanyData = {
        cnpj: '12345678000100', // CNPJ fictício para teste
        razao_social: 'Empresa Teste Certificado',
        certificado_base64,
        senha_certificado,
        ambiente: 'homologacao'
      }

      try {
        console.log('Creating temporary company to validate certificate...')
        
        const focusResponse = await fetch('https://api.focusnfe.com.br/v2/empresas', {
          method: 'POST',
          headers: createFocusHeaders(),
          body: JSON.stringify(tempCompanyData)
        })

        const responseData = await focusResponse.text()
        console.log('Focus NFe Response Status:', focusResponse.status)
        console.log('Focus NFe Response Body:', responseData)

        let parsedData
        try {
          parsedData = JSON.parse(responseData)
        } catch {
          parsedData = { message: responseData }
        }

        if (focusResponse.ok || focusResponse.status === 409) {
          // Sucesso ou empresa já existe (ambos indicam certificado válido)
          console.log('Certificate validation successful')
          
          // Tentar extrair informações do certificado
          let certificateInfo = {}
          if (parsedData.cnpj) {
            certificateInfo = {
              cnpj: parsedData.cnpj,
              razao_social: parsedData.razao_social,
              valid_until: parsedData.certificate_expires_at
            }
          }

          // Tentar deletar a empresa temporária (não é crítico se falhar)
          try {
            await fetch(`https://api.focusnfe.com.br/v2/empresas/${tempCompanyData.cnpj}`, {
              method: 'DELETE',
              headers: createFocusHeaders()
            })
            console.log('Temporary company deleted')
          } catch (error) {
            console.log('Failed to delete temporary company (not critical):', error)
          }

          return new Response(JSON.stringify({
            success: true,
            message: 'Certificado validado com sucesso',
            certificate_info: certificateInfo
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          // Erro na validação
          const errorMessage = parseFocusError(parsedData)
          console.log('Certificate validation failed:', errorMessage)
          
          return new Response(JSON.stringify({
            success: false,
            error: errorMessage
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }

      } catch (error) {
        console.error('Network error:', error)
        return new Response(JSON.stringify({
          success: false,
          error: 'Erro de conexão com a Focus NFe. Tente novamente.'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    throw new Error(`Ação não reconhecida: ${action}`)

  } catch (error) {
    console.error('Error in Focus NFe API:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Erro interno do servidor'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})