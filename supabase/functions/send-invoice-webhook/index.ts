import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { invoiceId, webhookUrl } = await req.json();

    if (!invoiceId) {
      return new Response(
        JSON.stringify({ error: 'Invoice ID é obrigatório' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!webhookUrl) {
      return new Response(
        JSON.stringify({ error: 'Webhook URL é obrigatória' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Sending invoice ${invoiceId} to webhook: ${webhookUrl}`);

    // Get invoice data with company information
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        companies (
          cnpj_cpf,
          razao_social,
          nome_fantasia,
          logradouro,
          numero,
          bairro,
          cidade,
          estado_uf,
          cep,
          inscricao_municipal,
          cnae,
          atividade_principal,
          aliquota,
          iss_retido,
          natureza_operacao,
          optante_simples_nacional
        )
      `)
      .eq('id', invoiceId)
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Erro ao buscar nota fiscal: ${invoiceError?.message}`);
    }

    // Prepare webhook payload
    const webhookPayload = {
      invoice: {
        id: invoice.id,
        numero_nota: invoice.numero_nota,
        valor_total: invoice.valor_total,
        descricao_servicos: invoice.descricao_servicos,
        data_emissao: invoice.data_emissao,
        status: invoice.status
      },
      company: invoice.companies,
      timestamp: new Date().toISOString(),
      source: 'fiscal-management-app'
    };

    // Send to N8n webhook
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    const webhookResult = {
      success: webhookResponse.ok,
      status: webhookResponse.status,
      statusText: webhookResponse.statusText,
      timestamp: new Date().toISOString()
    };

    // Try to get response body
    try {
      const responseText = await webhookResponse.text();
      if (responseText) {
        webhookResult.response = responseText;
      }
    } catch (e) {
      console.log('Could not parse webhook response body');
    }

    // Update invoice with webhook status
    const { error: updateError } = await supabase
      .from('invoices')
      .update({
        webhook_sent: webhookResponse.ok,
        webhook_sent_at: new Date().toISOString(),
        n8n_response: webhookResult,
        status: webhookResponse.ok ? 'emitida' : 'erro'
      })
      .eq('id', invoiceId);

    if (updateError) {
      console.error('Error updating invoice webhook status:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: webhookResponse.ok,
        webhookResult,
        message: webhookResponse.ok 
          ? 'Nota fiscal enviada com sucesso para o N8n' 
          : 'Erro ao enviar nota fiscal para o N8n'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-invoice-webhook function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Erro ao enviar webhook',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});