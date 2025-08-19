// Script para atualizar status_processamento quando NFSe for cancelada
console.log('❌ ATUALIZANDO STATUS DE CANCELAMENTO\n');

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Função para atualizar status de NFSe cancelada
async function atualizarStatusCancelamento(referencia, motivo = 'Cancelamento solicitado') {
  console.log(`🔄 Atualizando status de cancelamento para referência: ${referencia}`);
  
  try {
    // 1. Atualizar na tabela nfse_emitidas
    const { data: nfseData, error: nfseError } = await supabase
      .from('nfse_emitidas')
      .update({
        status_processamento: 'cancelada',
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('referencia_rps', referencia)
      .select();

    if (nfseError) {
      console.log('❌ Erro ao atualizar nfse_emitidas:', nfseError.message);
    } else {
      console.log('✅ Status atualizado em nfse_emitidas:', nfseData?.length || 0, 'registros');
    }

    // 2. Atualizar na tabela notas_fiscais (se existir)
    const { data: notasData, error: notasError } = await supabase
      .from('notas_fiscais')
      .update({
        status: 'cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('referencia', referencia)
      .select();

    if (notasError) {
      console.log('⚠️ Erro ao atualizar notas_fiscais (pode não existir):', notasError.message);
    } else {
      console.log('✅ Status atualizado em notas_fiscais:', notasData?.length || 0, 'registros');
    }

    // 3. Registrar no histórico de cancelamentos
    const { data: historicoData, error: historicoError } = await supabase
      .from('historico_cancelamentos')
      .insert([{
        referencia: referencia,
        motivo: motivo,
        data_cancelamento: new Date().toISOString(),
        status: 'cancelado'
      }])
      .select();

    if (historicoError) {
      console.log('⚠️ Erro ao registrar histórico (pode já existir):', historicoError.message);
    } else {
      console.log('✅ Cancelamento registrado no histórico:', historicoData?.length || 0, 'registros');
    }

    return {
      success: true,
      nfseUpdated: nfseData?.length || 0,
      notasUpdated: notasData?.length || 0,
      historicoCreated: historicoData?.length || 0
    };

  } catch (error) {
    console.error('❌ Erro geral na atualização:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Função para verificar NFSe canceladas na API e sincronizar
async function sincronizarCancelamentos() {
  console.log('🔄 SINCRONIZANDO CANCELAMENTOS COM API FOCUS NFE\n');

  try {
    // Buscar todas as NFSe que não estão canceladas no banco
    const { data: nfsesAtivas, error } = await supabase
      .from('nfse_emitidas')
      .select('referencia_rps, status, status_processamento')
      .neq('status_processamento', 'cancelada')
      .limit(10); // Limitar para teste

    if (error) {
      console.log('❌ Erro ao buscar NFSe ativas:', error.message);
      return;
    }

    console.log(`📊 Encontradas ${nfsesAtivas?.length || 0} NFSe ativas para verificar`);

    if (!nfsesAtivas || nfsesAtivas.length === 0) {
      console.log('ℹ️ Nenhuma NFSe ativa encontrada para verificar');
      return;
    }

    // Verificar cada NFSe na API Focus NFe
    for (const nfse of nfsesAtivas) {
      console.log(`\n🔍 Verificando NFSe: ${nfse.referencia_rps}`);
      
      try {
        // Simular consulta à API (substitua pela consulta real)
        const response = await fetch(`https://fiscaly.fluxitech.com.br/api/nfse?referencia=${nfse.referencia_rps}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const apiData = await response.json();
          console.log(`   Status na API: ${apiData.status}`);

          // Se foi cancelada na API mas não no banco
          if (apiData.status === 'cancelado' && nfse.status_processamento !== 'cancelada') {
            console.log('   ⚠️ NFSe cancelada na API, atualizando banco...');
            
            const resultado = await atualizarStatusCancelamento(
              nfse.referencia_rps, 
              'Cancelamento detectado via sincronização com API'
            );

            if (resultado.success) {
              console.log('   ✅ Status sincronizado com sucesso');
            } else {
              console.log('   ❌ Erro na sincronização:', resultado.error);
            }
          } else {
            console.log('   ✅ Status consistente entre API e banco');
          }
        } else {
          console.log(`   ⚠️ Erro na consulta API: ${response.status}`);
        }

      } catch (apiError) {
        console.log(`   ❌ Erro ao consultar API: ${apiError.message}`);
      }

      // Aguardar um pouco entre consultas para não sobrecarregar a API
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Função para testar atualização de status
async function testarAtualizacao() {
  console.log('🧪 TESTANDO ATUALIZAÇÃO DE STATUS\n');

  // Buscar uma NFSe para testar
  const { data: nfsesTeste, error } = await supabase
    .from('nfse_emitidas')
    .select('referencia_rps, status, status_processamento')
    .limit(1);

  if (error || !nfsesTeste || nfsesTeste.length === 0) {
    console.log('⚠️ Nenhuma NFSe encontrada para teste');
    return;
  }

  const nfseTeste = nfsesTeste[0];
  console.log('📄 NFSe para teste:', nfseTeste);

  // Simular cancelamento
  console.log('\n🔄 Simulando cancelamento...');
  const resultado = await atualizarStatusCancelamento(
    nfseTeste.referencia_rps,
    'Teste de cancelamento via script'
  );

  console.log('📊 Resultado do teste:', resultado);

  // Reverter para não afetar dados reais
  if (resultado.success) {
    console.log('\n🔄 Revertendo alterações de teste...');
    
    await supabase
      .from('nfse_emitidas')
      .update({
        status_processamento: nfseTeste.status_processamento,
        status: nfseTeste.status,
        updated_at: new Date().toISOString()
      })
      .eq('referencia_rps', nfseTeste.referencia_rps);

    // Remover do histórico de teste
    await supabase
      .from('historico_cancelamentos')
      .delete()
      .eq('referencia', nfseTeste.referencia_rps)
      .eq('motivo', 'Teste de cancelamento via script');

    console.log('✅ Alterações de teste revertidas');
  }
}

async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--test')) {
    await testarAtualizacao();
  } else if (args.includes('--sync')) {
    await sincronizarCancelamentos();
  } else if (args.length > 0) {
    // Cancelar NFSe específica
    const referencia = args[0];
    const motivo = args[1] || 'Cancelamento via script';
    
    console.log(`❌ Cancelando NFSe: ${referencia}`);
    const resultado = await atualizarStatusCancelamento(referencia, motivo);
    console.log('📊 Resultado:', resultado);
  } else {
    console.log('📋 USO DO SCRIPT:');
    console.log('');
    console.log('🧪 Testar funcionalidade:');
    console.log('   node scripts/update-status-cancelamento.js --test');
    console.log('');
    console.log('🔄 Sincronizar com API:');
    console.log('   node scripts/update-status-cancelamento.js --sync');
    console.log('');
    console.log('❌ Cancelar NFSe específica:');
    console.log('   node scripts/update-status-cancelamento.js REFERENCIA "Motivo do cancelamento"');
    console.log('');
    console.log('📝 EXEMPLO:');
    console.log('   node scripts/update-status-cancelamento.js 535 "Erro nos dados"');
  }

  console.log('\n✅ SCRIPT CONCLUÍDO!');
}

// Executar
main().catch(console.error);
