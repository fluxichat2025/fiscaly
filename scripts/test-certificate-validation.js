// Script de teste para validação de certificado digital
// Execute: node scripts/test-certificate-validation.js

const fetch = require('node-fetch');

// Configuração
const SUPABASE_URL = 'https://fdkromzapsquvfyjjcyr.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/focus-nfe-api`;

const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';

// Função para testar validação de certificado
async function testValidateCertificate(certificateBase64, password) {
  console.log('🦠 Testando validação de certificado...');

  const testData = {
    action: 'validate_certificate',
    data: {
      certificado_base64: certificateBase64,
      senha_certificado: password
    }
  };

  try {
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test-key'}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Teste passou!');
      console.log('Resultado:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Teste falhou!');
      console.log('Erro:', JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error('🚨 Erro no teste:', error);
  }
}

// Função para testar diretamente a API Focus NFe
async function testFocusNFeDirect() {
  console.log('🚠 Testando API Focus NFe diretamente...');

  const testData = {
    cnpj: '12345678000190',
    razao_social: 'Teste Validação Certificado',
    nome_fantasia: 'Teste Validação',
    logradouro: 'Rua Teste, 123',
    numero: '123',
    bairro: 'Centro',
    município: 'São Paulo',
    uf: 'SP',
    cep: '01000000',
    codigo_município: '3550308',
    codigo_uf: '35',
    codigo_pais: '1058',
    email: 'teste@example.com',
    regime_tributario: '1',
    arquivo_certificado_base64: 'test-base64-data',
    senha_certificado: 'test-password',
    habilita_nfse: true
  };

  try {
    const response = await fetch('https://homologacao.focusnfe.com.br/v2/empresas', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(FOCUS_NFE_TOKEN + ':').toString('base64')}`
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(result, null, 2));

    if (response.status === 401) {
      console.log('❌ Token inválido ou expirado');
    } else if (response.status === 400) {
      console.log('❌ Dados inválidos ou certificado com problema');
    } else if (response.ok) {
      console.log('‌ Conexão com Focus NFe funcionando!');
    }
  > catch (error) {
    console.error('Erro na conexão com Focus NFe:', error);
  }
}

// Função para testar conexão com Supabase
async function testSupabaseConnection() {
  console.log('🚠 Testando conexão com Supabase...');

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || 'test-key',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test-key'}`
      }
    });

    if (response.ok) {
      console.log('✅ Conexão com Supabase funcionando!');
    } else {
      console.log(`❌ Erro na conexão com Supabase: ${response.status}`);
    }
  } catch (error) {
    console.error('Erro na conexão com Supabase:', error);
  }
}

// Função principal de teste
async function runTests() {
  console.log('🦠 Iniciando testes de validação de certificado digital...\n');

  // Teste 1: Conexão com Supabase
  console.log('1. Teste de conexão com Supabase');
  await testSupabaseConnection();
  console.log('');

  // Teste 2: Conexão direta com Focus NFe
  console.log('2. Teste de conexão com Focus NFe');
  await testFocusNFeDirect();
  console.log('');

  // Teste 3: Validação de certificado via Supabase
  console.log('3. Teste de validação de certificado via Supabase');
  await testValidateCertificate('test-base64-data', 'test-password');
  console.log('');

  // Teste 4: Teste com dados inválidos
  console.log('4. Teste com dados inválidos');
  await testValidateCertificate('', '');
  console.log('');

  console.log('🎯 Testes concluídos!');
  console.log('Verifique os resultados acima para identificar possíveis problemas.');
}

// Executar testes
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  testValidateCertificate,
  testFocusNFeDirect,
  testSupabaseConnection,
  runTests
};