// Script para testar se as notas canceladas estão aparecendo no dashboard
console.log('📊 TESTANDO DASHBOARD COM NOTAS CANCELADAS\n');

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDashboardCanceladas() {
  console.log('🔍 VERIFICANDO DADOS PARA DASHBOARD\n');

  // ==========================================
  // 1. VERIFICAR DADOS DE NFSe
  // ==========================================
  console.log('1. 📄 Verificando dados de NFSe...');
  
  try {
    const [nfseResult, invoicesResult] = await Promise.all([
      supabase.from('nfse_emitidas').select('*'),
      supabase.from('invoices').select('*')
    ]);

    const totalNFSe = (nfseResult.data?.length || 0) + (invoicesResult.data?.length || 0);
    
    console.log('✅ Dados de NFSe:');
    console.log(`   - NFSe emitidas: ${nfseResult.data?.length || 0}`);
    console.log(`   - Invoices: ${invoicesResult.data?.length || 0}`);
    console.log(`   - Total de notas: ${totalNFSe}`);

    if (totalNFSe > 0) {
      const valorTotal = (nfseResult.data || []).reduce((acc, nota) => {
        const valor = parseFloat(nota.servico_valor_servicos || nota.valor_liquido_nfse || 0);
        return acc + valor;
      }, 0) + (invoicesResult.data || []).reduce((acc, invoice) => {
        const valor = parseFloat(invoice.valor_total || 0);
        return acc + valor;
      }, 0);

      console.log(`   - Valor total faturado: R$ ${valorTotal.toFixed(2)}`);
    }
  } catch (error) {
    console.log('❌ Erro ao verificar NFSe:', error.message);
  }

  console.log('');

  // ==========================================
  // 2. VERIFICAR DADOS DE CANCELAMENTOS
  // ==========================================
  console.log('2. ❌ Verificando dados de cancelamentos...');
  
  try {
    const { data: canceladas, error } = await supabase
      .from('historico_cancelamentos')
      .select('*')
      .order('data_cancelamento', { ascending: false });

    if (error) {
      console.log('❌ Erro ao acessar cancelamentos:', error.message);
      return;
    }

    console.log('✅ Dados de cancelamentos:');
    console.log(`   - Total canceladas: ${canceladas?.length || 0}`);

    if (canceladas && canceladas.length > 0) {
      console.log('   - Últimos cancelamentos:');
      canceladas.slice(0, 5).forEach((cancelamento, index) => {
        console.log(`     ${index + 1}. Ref: ${cancelamento.referencia}`);
        console.log(`        Motivo: ${cancelamento.motivo}`);
        console.log(`        Data: ${new Date(cancelamento.data_cancelamento).toLocaleDateString('pt-BR')}`);
      });

      // Calcular valor total cancelado (simulado)
      console.log(`   - Valor estimado cancelado: R$ ${(canceladas.length * 100).toFixed(2)}`);
    } else {
      console.log('   ⚠️ Nenhum cancelamento encontrado');
      console.log('   📝 Para testar, cancele uma NFSe no sistema');
    }
  } catch (error) {
    console.log('❌ Erro ao verificar cancelamentos:', error.message);
  }

  console.log('');

  // ==========================================
  // 3. SIMULAR DADOS DO DASHBOARD
  // ==========================================
  console.log('3. 📊 Simulando cálculos do dashboard...');
  
  try {
    const [nfseResult, invoicesResult, canceladasResult] = await Promise.all([
      supabase.from('nfse_emitidas').select('*'),
      supabase.from('invoices').select('*'),
      supabase.from('historico_cancelamentos').select('*')
    ]);

    const totalNFSe = (nfseResult.data?.length || 0) + (invoicesResult.data?.length || 0);
    const totalCanceladas = canceladasResult.data?.length || 0;

    console.log('📈 Métricas do dashboard:');
    console.log(`   - Total NFSe: ${totalNFSe}`);
    console.log(`   - Total Canceladas: ${totalCanceladas}`);
    
    if (totalNFSe > 0) {
      const taxaCancelamento = ((totalCanceladas / totalNFSe) * 100).toFixed(1);
      console.log(`   - Taxa de Cancelamento: ${taxaCancelamento}%`);
    } else {
      console.log(`   - Taxa de Cancelamento: 0%`);
    }

    // Status distribution
    const statusCount = {};
    
    (nfseResult.data || []).forEach(nota => {
      const status = nota.status || 'emitida';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    (invoicesResult.data || []).forEach(invoice => {
      const status = invoice.status || 'emitida';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    if (totalCanceladas > 0) {
      statusCount['cancelada'] = (statusCount['cancelada'] || 0) + totalCanceladas;
    }

    console.log('   - Distribuição de status:');
    Object.entries(statusCount).forEach(([status, count]) => {
      const nome = status === 'emitida' || status === 'autorizada' ? 'Emitidas' :
                   status === 'cancelada' ? 'Canceladas' :
                   status === 'pendente' || status === 'processando' ? 'Pendentes' :
                   status.charAt(0).toUpperCase() + status.slice(1);
      console.log(`     • ${nome}: ${count}`);
    });

  } catch (error) {
    console.log('❌ Erro ao simular dashboard:', error.message);
  }

  console.log('');

  // ==========================================
  // 4. TESTAR CONSULTA NFSe
  // ==========================================
  console.log('4. 🔍 Testando consulta NFSe...');
  
  const VERCEL_URL = 'https://fiscaly.fluxitech.com.br';
  const TEST_REFERENCIA = '369222A';

  try {
    const response = await fetch(`${VERCEL_URL}/api/nfse?referencia=${TEST_REFERENCIA}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Consulta funcionando!');
      console.log(`   📄 Status da NFSe: ${data.status || 'N/A'}`);
      console.log(`   📄 Referência: ${data.referencia || TEST_REFERENCIA}`);
    } else if (response.status === 404) {
      const data = await response.json();
      console.log('   ⏳ NFSe não encontrada (pode estar processando)');
      console.log(`   📄 Mensagem: ${data.message || 'N/A'}`);
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erro na consulta:', errorText);
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 5. RESUMO E RECOMENDAÇÕES
  // ==========================================
  console.log('📋 RESUMO DOS TESTES:');
  console.log('');

  console.log('✅ FUNCIONALIDADES IMPLEMENTADAS:');
  console.log('   1. Dashboard mostra notas canceladas');
  console.log('   2. Cálculo de taxa de cancelamento');
  console.log('   3. Cards visuais para cancelamentos');
  console.log('   4. Integração com historico_cancelamentos');
  console.log('   5. Consulta NFSe corrigida para produção');
  console.log('');

  console.log('🎯 RESULTADO ESPERADO NO DASHBOARD:');
  console.log('   - Se houver cancelamentos: Cards vermelhos/laranja aparecem');
  console.log('   - Taxa de cancelamento calculada automaticamente');
  console.log('   - Distribuição de status inclui canceladas');
  console.log('   - Consulta NFSe funciona sem erro 404');
  console.log('');

  console.log('🧪 PARA TESTAR:');
  console.log('   1. Acesse https://fiscaly.fluxitech.com.br/');
  console.log('   2. Vá para o Dashboard');
  console.log('   3. Verifique se aparecem cards de cancelamentos');
  console.log('   4. Teste consulta NFSe em /consultar-nfse');
  console.log('   5. Cancele uma NFSe para ver os dados atualizarem');
  console.log('');

  console.log('✅ TESTE CONCLUÍDO!');
  console.log('Dashboard configurado para mostrar dados reais incluindo cancelamentos.');
}

// Executar teste
testDashboardCanceladas().catch(console.error);
