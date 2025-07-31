import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    const payload = await req.json();
    console.log('Focus NFe Webhook received:', payload);

    // Processar webhook do Focus NFe
    if (payload.evento === 'empresa_criada') {
      const { empresa_id, cnpj, token_homologacao, token_producao } = payload.dados;

      // Atualizar a empresa no banco com os tokens
      const { error } = await supabaseClient
        .from('companies')
        .update({
          focus_nfe_empresa_id: empresa_id,
          focus_nfe_token_homologacao: token_homologacao,
          focus_nfe_token_producao: token_producao,
          focus_nfe_habilitado: true,
          updated_at: new Date().toISOString()
        })
        .eq('cnpj_cpf', cnpj);

      if (error) {
        console.error('Erro ao atualizar empresa:', error);
        throw error;
      }

      console.log(`Empresa ${cnpj} atualizada com tokens Focus NFe`);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processado' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Erro no webhook Focus NFe:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Erro interno do servidor',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});