import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
}

function createFocusHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${btoa(FOCUS_NFE_TOKEN + ':')}`
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Focus Empresas API request received:', req.method, req.url)
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    if (req.method === 'GET') {
      // Listar empresas
      console.log('Fetching companies from Focus NFe...')
      
      try {
        const focusResponse = await fetch('https://api.focusnfe.com.br/v2/empresas', {
          method: 'GET',
          headers: createFocusHeaders()
        })

        console.log('Focus NFe Response Status:', focusResponse.status)

        if (focusResponse.ok) {
          const empresas = await focusResponse.json()
          console.log('Companies fetched successfully:', empresas.length || 0)
          
          return new Response(JSON.stringify(empresas), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        } else {
          const errorText = await focusResponse.text()
          console.log('Focus NFe Error:', errorText)
          
          // Se a API Focus NFe falhar, tentar carregar do Supabase
          console.log('Focus NFe failed, trying Supabase fallback...')
          
          const { data: empresasSupabase, error } = await supabase
            .from('companies')
            .select('*')
            .order('razao_social')

          if (error) {
            throw error
          }

          // Converter formato do Supabase para formato Focus NFe
          const empresasFormatadas = empresasSupabase.map(empresa => ({
            id: empresa.id,
            nome: empresa.razao_social,
            nome_fantasia: empresa.nome_fantasia || empresa.razao_social,
            cnpj: empresa.cnpj,
            email: empresa.email,
            telefone: empresa.telefone,
            endereco: empresa.endereco,
            cidade: empresa.cidade,
            estado: empresa.estado,
            cep: empresa.cep
          }))

          return new Response(JSON.stringify(empresasFormatadas), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          })
        }
      } catch (networkError) {
        console.log('Network error, using Supabase fallback:', networkError)
        
        // Fallback para Supabase em caso de erro de rede
        const { data: empresasSupabase, error } = await supabase
          .from('companies')
          .select('*')
          .order('razao_social')

        if (error) {
          throw error
        }

        // Converter formato do Supabase para formato Focus NFe
        const empresasFormatadas = empresasSupabase.map(empresa => ({
          id: empresa.id,
          nome: empresa.razao_social,
          nome_fantasia: empresa.nome_fantasia || empresa.razao_social,
          cnpj: empresa.cnpj,
          email: empresa.email,
          telefone: empresa.telefone,
          endereco: empresa.endereco,
          cidade: empresa.cidade,
          estado: empresa.estado,
          cep: empresa.cep
        }))

        return new Response(JSON.stringify(empresasFormatadas), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
    }

    return new Response(JSON.stringify({
      error: 'Method not allowed'
    }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in Focus Empresas API:', error)
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
