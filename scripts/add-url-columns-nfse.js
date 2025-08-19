// Script para adicionar colunas url e url_danfse na tabela nfse_emitidas
console.log('🔧 ADICIONANDO COLUNAS URL NA TABELA NFSE_EMITIDAS\n');

import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addUrlColumns() {
  console.log('📊 VERIFICANDO ESTRUTURA ATUAL DA TABELA\n');

  try {
    // 1. Verificar estrutura atual
    console.log('1. 🔍 Verificando colunas existentes...');
    
    const { data: existingData, error: selectError } = await supabase
      .from('nfse_emitidas')
      .select('*')
      .limit(1);

    if (selectError) {
      console.log('❌ Erro ao verificar tabela:', selectError.message);
      return;
    }

    if (existingData && existingData.length > 0) {
      const columns = Object.keys(existingData[0]);
      console.log('✅ Colunas existentes:');
      columns.forEach(col => console.log(`   - ${col}`));
      
      const hasUrl = columns.includes('url');
      const hasUrlDanfse = columns.includes('url_danfse');
      
      console.log(`\n📋 Status das colunas:`);
      console.log(`   - url: ${hasUrl ? '✅ Existe' : '❌ Não existe'}`);
      console.log(`   - url_danfse: ${hasUrlDanfse ? '✅ Existe' : '❌ Não existe'}`);
      
      if (hasUrl && hasUrlDanfse) {
        console.log('\n🎉 Ambas as colunas já existem! Nada a fazer.');
        return;
      }
    }

    console.log('\n2. 📝 INSTRUÇÕES PARA ADICIONAR COLUNAS NO SUPABASE:\n');
    
    console.log('🔧 Execute os seguintes comandos SQL no Supabase Dashboard:');
    console.log('   (Dashboard > SQL Editor > New Query)\n');
    
    if (!existingData?.[0]?.url) {
      console.log('-- Adicionar coluna url');
      console.log('ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url TEXT;');
      console.log('COMMENT ON COLUMN nfse_emitidas.url IS \'URL de autenticação da NFSe no portal da prefeitura\';');
      console.log('');
    }
    
    if (!existingData?.[0]?.url_danfse) {
      console.log('-- Adicionar coluna url_danfse');
      console.log('ALTER TABLE nfse_emitidas ADD COLUMN IF NOT EXISTS url_danfse TEXT;');
      console.log('COMMENT ON COLUMN nfse_emitidas.url_danfse IS \'URL do PDF da DANFSE no S3 da Focus NFe\';');
      console.log('');
    }
    
    console.log('-- Verificar se as colunas foram criadas');
    console.log('SELECT column_name, data_type, is_nullable');
    console.log('FROM information_schema.columns');
    console.log('WHERE table_name = \'nfse_emitidas\'');
    console.log('AND column_name IN (\'url\', \'url_danfse\')');
    console.log('ORDER BY column_name;');
    
    console.log('\n📋 APÓS EXECUTAR OS COMANDOS SQL:');
    console.log('   1. Execute este script novamente para verificar');
    console.log('   2. Teste a inserção de dados com as novas colunas');
    console.log('   3. Atualize o código para salvar os URLs');

  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

async function testUrlColumns() {
  console.log('\n3. 🧪 TESTANDO INSERÇÃO COM NOVAS COLUNAS\n');
  
  try {
    // Dados de exemplo baseados no retorno da API
    const dadosExemplo = {
      referencia: 'TEST_URL_' + Date.now(),
      cnpj_prestador: '49956185000100',
      numero_rps: '204',
      serie_rps: '72',
      tipo_rps: '1',
      status: 'autorizado',
      numero_nfse: '198',
      codigo_verificacao: 'ydwAKw9o1',
      data_emissao: '2025-08-19T09:17:21-03:00',
      url: 'https://notafiscal.sorocaba.sp.gov.br/notafiscal-ws/servico/notafiscal/autenticacao/cpfCnpj/49956185000100/inscricaoMunicipal/415515/numeroNota/198/codigoVerificacao/ydwAKw9o1',
      url_danfse: 'https://focusnfe.s3.sa-east-1.amazonaws.com/arquivos/49956185000100_119953/202508/DANFSEs/NFSe499561850001003552205-415515-198-ydwAKw9o1.pdf',
      caminho_xml_nota_fiscal: '/arquivos/49956185000100_119953/202508/XMLsNFSe/499561850001003552205-415515-198-ydwAKw9o1-nfse.xml',
      status_processamento: 'autorizado'
    };

    console.log('📤 Tentando inserir dados de teste...');
    
    const { data, error } = await supabase
      .from('nfse_emitidas')
      .insert([dadosExemplo])
      .select();

    if (error) {
      console.log('❌ Erro na inserção:', error.message);
      
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        console.log('\n⚠️ As colunas ainda não foram criadas!');
        console.log('   Execute os comandos SQL mostrados acima primeiro.');
      }
    } else {
      console.log('✅ Dados inseridos com sucesso!');
      console.log('📄 Dados salvos:', data[0]);
      
      // Limpar dados de teste
      await supabase
        .from('nfse_emitidas')
        .delete()
        .eq('referencia', dadosExemplo.referencia);
      
      console.log('🧹 Dados de teste removidos.');
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

async function main() {
  await addUrlColumns();
  
  // Perguntar se deve testar (simulado)
  console.log('\n❓ Deseja testar a inserção com as novas colunas?');
  console.log('   (Execute: node scripts/add-url-columns-nfse.js test)');
  
  // Se passou 'test' como argumento
  if (process.argv.includes('test')) {
    await testUrlColumns();
  }
  
  console.log('\n✅ SCRIPT CONCLUÍDO!');
  console.log('📋 Próximos passos:');
  console.log('   1. Execute os comandos SQL no Supabase Dashboard');
  console.log('   2. Atualize o código de emissão para salvar os URLs');
  console.log('   3. Implemente a atualização de status_processamento');
}

// Executar
main().catch(console.error);
