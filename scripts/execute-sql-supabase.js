import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndCreateTables() {
  console.log('🚀 Iniciando verificação e criação de tabelas...');
  
  // Lista de tabelas que precisamos verificar
  const requiredTables = [
    'categories',
    'cost_centers', 
    'company_info',
    'audit_logs',
    'app_settings',
    'user_preferences',
    'finance_accounts',
    'finance_transactions'
  ];

  console.log('🔍 Verificando tabelas existentes...');
  
  // Verificar quais tabelas existem
  const existingTables = [];
  const missingTables = [];
  
  for (const table of requiredTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ Tabela ${table} não existe: ${error.message}`);
        missingTables.push(table);
      } else {
        console.log(`✅ Tabela ${table} existe`);
        existingTables.push(table);
      }
    } catch (err) {
      console.log(`❌ Erro ao verificar tabela ${table}: ${err.message}`);
      missingTables.push(table);
    }
  }

  console.log('\n📊 Resumo das tabelas:');
  console.log(`✅ Existentes (${existingTables.length}):`, existingTables);
  console.log(`❌ Faltando (${missingTables.length}):`, missingTables);

  // Se todas as tabelas necessárias existem, testar inserção
  if (missingTables.length === 0) {
    console.log('\n🎉 Todas as tabelas existem! Testando funcionalidades...');
    await testTableFunctionality();
    return;
  }

  // Tentar criar as tabelas usando a API REST do Supabase
  console.log('\n🔧 Tentando criar tabelas via API...');
  
  // Como não podemos executar SQL diretamente com a chave anon,
  // vamos tentar criar dados de teste para forçar a criação das tabelas
  await attemptTableCreation();
}

async function testTableFunctionality() {
  console.log('\n🧪 Testando funcionalidades das tabelas...');
  
  // Testar inserção de categoria
  try {
    console.log('📝 Testando inserção de categoria...');
    const { data: categoryData, error: categoryError } = await supabase
      .from('categories')
      .insert([{
        name: 'Teste Categoria',
        type: 'income',
        color: '#3b82f6',
        icon: 'folder',
        description: 'Categoria de teste'
      }])
      .select()
      .single();
    
    if (categoryError) {
      console.log('❌ Erro ao inserir categoria:', categoryError.message);
    } else {
      console.log('✅ Categoria inserida com sucesso:', categoryData.name);
      
      // Remover categoria de teste
      await supabase.from('categories').delete().eq('id', categoryData.id);
      console.log('🗑️ Categoria de teste removida');
    }
  } catch (err) {
    console.log('❌ Erro no teste de categoria:', err.message);
  }

  // Testar inserção de conta bancária
  try {
    console.log('📝 Testando inserção de conta bancária...');
    const { data: accountData, error: accountError } = await supabase
      .from('finance_accounts')
      .insert([{
        name: 'Conta Teste',
        opening_balance: 1000.00
      }])
      .select()
      .single();
    
    if (accountError) {
      console.log('❌ Erro ao inserir conta:', accountError.message);
    } else {
      console.log('✅ Conta inserida com sucesso:', accountData.name);
      
      // Remover conta de teste
      await supabase.from('finance_accounts').delete().eq('id', accountData.id);
      console.log('🗑️ Conta de teste removida');
    }
  } catch (err) {
    console.log('❌ Erro no teste de conta:', err.message);
  }

  // Testar carregamento de categorias
  try {
    console.log('📝 Testando carregamento de categorias...');
    const { data: categories, error: loadError } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (loadError) {
      console.log('❌ Erro ao carregar categorias:', loadError.message);
    } else {
      console.log(`✅ ${categories.length} categorias carregadas`);
      categories.forEach(cat => {
        console.log(`   - ${cat.name} (${cat.type})`);
      });
    }
  } catch (err) {
    console.log('❌ Erro no carregamento de categorias:', err.message);
  }
}

async function attemptTableCreation() {
  console.log('⚠️ Não é possível criar tabelas diretamente via API com chave anon.');
  console.log('📋 As tabelas precisam ser criadas via SQL Editor no Dashboard do Supabase.');
  console.log('');
  console.log('🔗 Acesse: https://supabase.com/dashboard/project/yoeeobnzifhhkrwrhctv/sql');
  console.log('');
  console.log('📝 Execute o SQL do arquivo EXECUTAR_SQL_AGORA.md');
  console.log('');
  console.log('🎯 Após executar o SQL, execute este script novamente para verificar.');
}

// Executar verificação
checkAndCreateTables().catch(console.error);
