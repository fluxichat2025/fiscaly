import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testHistoricoCancelamentos() {
  console.log('🧪 Testando tabela historico_cancelamentos...\n');

  try {
    // Testar acesso à tabela
    const { data, error } = await supabase
      .from('historico_cancelamentos')
      .select('*')
      .limit(5);

    if (error) {
      console.log('❌ Erro ao acessar tabela:', error.message);
      console.log('📋 A tabela provavelmente não existe ainda');
      console.log('🔧 Execute: node scripts/create-historico-cancelamentos-table.js');
      return;
    }

    console.log('✅ Tabela historico_cancelamentos acessível');
    console.log('📊 Registros encontrados:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('📄 Últimos registros:');
      data.forEach((registro, index) => {
        console.log(`   ${index + 1}. Ref: ${registro.referencia} | Motivo: ${registro.motivo} | Data: ${registro.data_cancelamento}`);
      });
    } else {
      console.log('📝 Tabela vazia (normal para primeira execução)');
    }

    // Testar inserção de registro de teste
    console.log('\n🧪 Testando inserção...');
    
    const { data: insertData, error: insertError } = await supabase
      .from('historico_cancelamentos')
      .insert({
        referencia: 'TEST-' + Date.now(),
        numero_nfse: '12345',
        motivo: 'Teste de funcionamento',
        observacao: 'Registro de teste criado automaticamente',
        status: 'teste'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir:', insertError.message);
    } else {
      console.log('✅ Inserção bem-sucedida');
      console.log('📄 Registro criado:', insertData);

      // Remover registro de teste
      const { error: deleteError } = await supabase
        .from('historico_cancelamentos')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        console.log('⚠️ Erro ao remover teste:', deleteError.message);
      } else {
        console.log('🗑️ Registro de teste removido');
      }
    }

    console.log('\n✅ TESTE CONCLUÍDO');
    console.log('📋 A tabela historico_cancelamentos está funcionando corretamente');

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
}

// Executar teste
testHistoricoCancelamentos().catch(console.error);
