import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
  console.log('🔍 Testando acesso às tabelas...');
  
  try {
    // Testar tabela categories
    console.log('📝 Testando tabela categories...');
    const { data: categoriesData, error: categoriesError } = await supabase
      .from('categories')
      .select('count(*)', { count: 'exact', head: true });
    
    if (categoriesError) {
      console.log('❌ Tabela categories não existe:', categoriesError.message);
    } else {
      console.log('✅ Tabela categories existe');
    }

    // Testar tabela finance_accounts
    console.log('📝 Testando tabela finance_accounts...');
    const { data: accountsData, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('count(*)', { count: 'exact', head: true });
    
    if (accountsError) {
      console.log('❌ Tabela finance_accounts não existe:', accountsError.message);
    } else {
      console.log('✅ Tabela finance_accounts existe');
    }

    // Testar tabela company_info
    console.log('📝 Testando tabela company_info...');
    const { data: companyData, error: companyError } = await supabase
      .from('company_info')
      .select('count(*)', { count: 'exact', head: true });
    
    if (companyError) {
      console.log('❌ Tabela company_info não existe:', companyError.message);
    } else {
      console.log('✅ Tabela company_info existe');
    }

    // Testar tabela cost_centers
    console.log('📝 Testando tabela cost_centers...');
    const { data: costCentersData, error: costCentersError } = await supabase
      .from('cost_centers')
      .select('count(*)', { count: 'exact', head: true });
    
    if (costCentersError) {
      console.log('❌ Tabela cost_centers não existe:', costCentersError.message);
    } else {
      console.log('✅ Tabela cost_centers existe');
    }

    // Testar inserção de categoria (se a tabela existir)
    if (!categoriesError) {
      console.log('📝 Testando inserção de categoria...');
      const { data: insertData, error: insertError } = await supabase
        .from('categories')
        .insert([{
          name: 'Teste',
          type: 'income',
          color: '#3b82f6',
          icon: 'folder',
          description: 'Categoria de teste'
        }])
        .select()
        .single();
      
      if (insertError) {
        console.log('❌ Erro ao inserir categoria:', insertError.message);
      } else {
        console.log('✅ Categoria inserida com sucesso:', insertData);
        
        // Remover categoria de teste
        await supabase.from('categories').delete().eq('id', insertData.id);
        console.log('🗑️ Categoria de teste removida');
      }
    }

    // Testar inserção de conta bancária (se a tabela existir)
    if (!accountsError) {
      console.log('📝 Testando inserção de conta bancária...');
      const { data: insertAccountData, error: insertAccountError } = await supabase
        .from('finance_accounts')
        .insert([{
          name: 'Conta Teste',
          opening_balance: 0
        }])
        .select()
        .single();
      
      if (insertAccountError) {
        console.log('❌ Erro ao inserir conta:', insertAccountError.message);
      } else {
        console.log('✅ Conta inserida com sucesso:', insertAccountData);
        
        // Remover conta de teste
        await supabase.from('finance_accounts').delete().eq('id', insertAccountData.id);
        console.log('🗑️ Conta de teste removida');
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

testTables();
