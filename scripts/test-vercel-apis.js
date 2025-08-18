// Script para testar as APIs do Vercel após deploy
console.log('🧪 TESTANDO APIs DO VERCEL\n');

// Configuração - SUBSTITUA PELA SUA URL DO VERCEL
const VERCEL_URL = 'https://seu-app.vercel.app'; // ⚠️ ALTERE AQUI
const TEST_REFERENCIA = 'test-' + Date.now();

async function testVercelAPIs() {
  console.log('🔗 URL do Vercel:', VERCEL_URL);
  console.log('📝 Referência de teste:', TEST_REFERENCIA);
  console.log('');

  // ==========================================
  // 1. TESTAR API DE EMPRESAS
  // ==========================================
  console.log('🏢 1. Testando API de empresas...');
  
  try {
    const empresasUrl = `${VERCEL_URL}/api/focusnfe/v2/empresas`;
    console.log('📡 URL:', empresasUrl);
    
    const response = await fetch(empresasUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Empresas encontradas:', Array.isArray(data) ? data.length : 'Dados recebidos');
      console.log('📄 Preview:', JSON.stringify(data).substring(0, 200) + '...');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('');

  // ==========================================
  // 2. TESTAR API DE CONSULTA NFSe
  // ==========================================
  console.log('📄 2. Testando API de consulta NFSe...');
  
  try {
    const nfseUrl = `${VERCEL_URL}/api/nfse/${TEST_REFERENCIA}`;
    console.log('📡 URL:', nfseUrl);
    
    const response = await fetch(nfseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta recebida');
      console.log('📄 Dados:', JSON.stringify(data, null, 2));
    } else if (response.status === 404) {
      const data = await response.json();
      console.log('⏳ NFSe não encontrada (esperado para teste)');
      console.log('📄 Resposta:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', errorText);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('');

  // ==========================================
  // 3. TESTAR CORS
  // ==========================================
  console.log('🌐 3. Testando CORS...');
  
  try {
    const corsUrl = `${VERCEL_URL}/api/focusnfe/v2/empresas`;
    
    // Fazer requisição OPTIONS (preflight)
    const optionsResponse = await fetch(corsUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://example.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    console.log('📊 OPTIONS Status:', optionsResponse.status);
    console.log('🔧 CORS Headers:');
    
    const corsHeaders = [
      'Access-Control-Allow-Origin',
      'Access-Control-Allow-Methods',
      'Access-Control-Allow-Headers',
      'Access-Control-Max-Age'
    ];

    corsHeaders.forEach(header => {
      const value = optionsResponse.headers.get(header);
      console.log(`   ${header}: ${value || 'NÃO DEFINIDO'}`);
    });

    if (optionsResponse.status === 200) {
      console.log('✅ CORS configurado corretamente');
    } else {
      console.log('❌ Problema com CORS');
    }
  } catch (error) {
    console.log('❌ Erro no teste CORS:', error.message);
  }

  console.log('');

  // ==========================================
  // 4. TESTAR TIMEOUT
  // ==========================================
  console.log('⏱️ 4. Testando timeout das APIs...');
  
  try {
    const startTime = Date.now();
    const timeoutUrl = `${VERCEL_URL}/api/focusnfe/v2/empresas`;
    
    const response = await fetch(timeoutUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('⏱️ Tempo de resposta:', duration + 'ms');
    
    if (duration < 5000) {
      console.log('✅ Resposta rápida (< 5s)');
    } else if (duration < 10000) {
      console.log('⚠️ Resposta lenta (5-10s)');
    } else {
      console.log('❌ Resposta muito lenta (> 10s)');
    }
  } catch (error) {
    console.log('❌ Erro no teste de timeout:', error.message);
  }

  console.log('');

  // ==========================================
  // 5. RESUMO DOS TESTES
  // ==========================================
  console.log('📋 RESUMO DOS TESTES:');
  console.log('');
  console.log('✅ Checklist de verificação:');
  console.log('□ API de empresas responde');
  console.log('□ API de consulta NFSe responde');
  console.log('□ CORS configurado corretamente');
  console.log('□ Timeout dentro do limite');
  console.log('□ Headers corretos nas respostas');
  console.log('');

  console.log('🔧 Se algum teste falhou:');
  console.log('1. Verifique se o deploy foi feito corretamente');
  console.log('2. Confirme as variáveis de ambiente no Vercel');
  console.log('3. Verifique os logs das funções no Vercel Dashboard');
  console.log('4. Teste o token diretamente na API Focus NFe');
  console.log('');

  console.log('📞 Comandos úteis:');
  console.log(`vercel logs ${VERCEL_URL}`);
  console.log('vercel env ls');
  console.log('vercel --prod');
  console.log('');

  console.log('🎯 Próximos passos:');
  console.log('1. Se todos os testes passaram, teste a emissão de NFSe no frontend');
  console.log('2. Se houver erros, verifique os logs e corrija as configurações');
  console.log('3. Configure as variáveis de ambiente se necessário');
  console.log('');

  console.log('✅ TESTES CONCLUÍDOS!');
}

// Verificar se a URL foi configurada
if (VERCEL_URL === 'https://seu-app.vercel.app') {
  console.log('⚠️ ATENÇÃO: Altere a variável VERCEL_URL no script!');
  console.log('Substitua "https://seu-app.vercel.app" pela URL real do seu app no Vercel.');
  console.log('');
} else {
  // Executar testes
  testVercelAPIs().catch(console.error);
}
