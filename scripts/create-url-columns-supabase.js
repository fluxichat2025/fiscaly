// Script para criar as colunas url e url_danfse automaticamente via Supabase
console.log('🔧 CRIANDO COLUNAS URL AUTOMATICAMENTE\n');

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createUrlColumns() {
  console.log('📊 CRIANDO COLUNAS URL NA TABELA nfse_emitidas\n');

  try {
    // 1. Verificar se as colunas já existem
    console.log('1. 🔍 Verificando colunas existentes...');
    
    const { data: existingData, error: selectError } = await supabase
      .from('nfse_emitidas')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro ao verificar tabela:', selectError.message);
      return false;
    }

    if (existingData && existingData.length > 0) {
      const columns = Object.keys(existingData[0]);
      const hasUrl = columns.includes('url');
      const hasUrlDanfse = columns.includes('url_danfse');
      
      console.log(`📋 Status das colunas:`);
      console.log(`   - url: ${hasUrl ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`   - url_danfse: ${hasUrlDanfse ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasUrl && hasUrlDanfse) {
        console.log('\n🎉 Ambas as colunas já existem! Nada a fazer.');
        return true;
      }
    }

    // 2. Tentar criar as colunas via RPC (se existir função)
    console.log('\n2. 🔧 Tentando criar colunas via RPC...');
    
    try {
      // Tentar executar SQL via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: `
          ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url TEXT;
          ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url_danfse TEXT;
          
          COMMENT ON COLUMN nfse_emitidas.url IS 'URL de autenticação da NFSe no portal da prefeitura';
          COMMENT ON COLUMN nfse_emitidas.url_danfse IS 'URL do PDF da DANFSE no S3 da Focus NFe';
        `
      });

      if (rpcError) {
        console.log('⚠️ RPC não disponível:', rpcError.message);
      } else {
        console.log('✅ Colunas criadas via RPC!');
        return true;
      }
    } catch (rpcErr) {
      console.log('⚠️ RPC não funcionou:', rpcErr.message);
    }

    // 3. Tentar via SQL direto (se tiver permissões)
    console.log('\n3. 🔧 Tentando executar SQL direto...');
    
    try {
      // Método alternativo: tentar inserir dados de teste para forçar criação de colunas
      const testData = {
        referencia_rps: 'TEST_COLUMNS_' + Date.now(),
        url: 'https://test.url.com',
        url_danfse: 'https://test.danfse.com',
        status_processamento: 'teste'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('nfse_emitidas')
        .insert([testData])
        .select();

      if (insertError) {
        if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
          console.log('❌ Colunas ainda não existem. Criação via API não é possível.');
          console.log('📝 É necessário executar SQL manualmente no Supabase Dashboard.');
          return false;
        } else {
          console.log('❌ Erro na inserção de teste:', insertError.message);
          return false;
        }
      } else {
        console.log('✅ Colunas existem! Dados de teste inseridos.');
        
        // Limpar dados de teste
        await supabase
          .from('nfse_emitidas')
          .delete()
          .eq('referencia_rps', testData.referencia_rps);
        
        console.log('🧹 Dados de teste removidos.');
        return true;
      }
    } catch (directError) {
      console.log('❌ Erro na execução direta:', directError.message);
    }

    return false;

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

async function verifyColumns() {
  console.log('\n4. ✅ VERIFICANDO SE AS COLUNAS FORAM CRIADAS\n');
  
  try {
    const { data, error } = await supabase
      .from('nfse_emitidas')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ Erro na verificação:', error.message);
      return false;
    }

    if (data && data.length > 0) {
      const columns = Object.keys(data[0]);
      const hasUrl = columns.includes('url');
      const hasUrlDanfse = columns.includes('url_danfse');
      
      console.log('📋 Resultado final:');
      console.log(`   - url: ${hasUrl ? '✅ CRIADA' : '❌ NÃO CRIADA'}`);
      console.log(`   - url_danfse: ${hasUrlDanfse ? '✅ CRIADA' : '❌ NÃO CRIADA'}`);
      
      return hasUrl && hasUrlDanfse;
    }

    return false;
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    return false;
  }
}

async function showManualInstructions() {
  console.log('\n📝 INSTRUÇÕES PARA CRIAÇÃO MANUAL:\n');
  
  console.log('🔧 Execute os seguintes comandos no Supabase Dashboard:');
  console.log('   (Dashboard > SQL Editor > New Query)\n');
  
  console.log('-- Adicionar colunas URL');
  console.log('ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url TEXT;');
  console.log('ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url_danfse TEXT;');
  console.log('');
  console.log('-- Adicionar comentários');
  console.log("COMMENT ON COLUMN nfse_emitidas.url IS 'URL de autenticação da NFSe no portal da prefeitura';");
  console.log("COMMENT ON COLUMN nfse_emitidas.url_danfse IS 'URL do PDF da DANFSE no S3 da Focus NFe';");
  console.log('');
  console.log('-- Verificar criação');
  console.log('SELECT column_name, data_type, is_nullable');
  console.log('FROM information_schema.columns');
  console.log("WHERE table_name = 'nfse_emitidas'");
  console.log("AND column_name IN ('url', 'url_danfse')");
  console.log('ORDER BY column_name;');
}

async function main() {
  const created = await createUrlColumns();
  
  if (created) {
    const verified = await verifyColumns();
    
    if (verified) {
      console.log('\n🎉 SUCESSO! Colunas criadas e verificadas.');
      console.log('✅ O sistema agora pode salvar os URLs das NFSe automaticamente.');
    } else {
      console.log('\n⚠️ Colunas podem ter sido criadas, mas verificação falhou.');
    }
  } else {
    console.log('\n❌ Não foi possível criar as colunas automaticamente.');
    await showManualInstructions();
  }
  
  console.log('\n📋 PRÓXIMOS PASSOS:');
  console.log('   1. Se as colunas foram criadas: Testar emissão de NFSe');
  console.log('   2. Se não foram criadas: Executar SQL manual no Supabase');
  console.log('   3. Verificar se URLs são salvos corretamente');
  
  console.log('\n✅ SCRIPT CONCLUÍDO!');
}

// Executar
main().catch(console.error);
