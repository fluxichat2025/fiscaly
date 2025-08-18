// Script para testar a correção do erro 404 no Vercel
console.log('🔧 TESTANDO CORREÇÃO DO ERRO 404 - NFSe NO VERCEL\n');

// CONFIGURAÇÃO - ALTERE PARA SUA URL
const VERCEL_URL = 'https://fiscaly.fluxitech.com.br'; // ✅ URL correta
const TEST_REFERENCIA = '400427A'; // Referência que estava dando erro

async function testNFSeFixVercel() {
  console.log('🌐 URL do Vercel:', VERCEL_URL);
  console.log('📝 Referência de teste:', TEST_REFERENCIA);
  console.log('');

  // ==========================================
  // 1. TESTAR NOVA API DE NFSe (Query Parameter)
  // ==========================================
  console.log('📄 1. Testando nova API de NFSe (query parameter)...');
  
  try {
    const nfseUrl = `${VERCEL_URL}/api/nfse?referencia=${TEST_REFERENCIA}`;
    console.log('📡 URL:', nfseUrl);
    
    const response = await fetch(nfseUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Resposta recebida com sucesso');
      console.log('📄 Dados:', JSON.stringify(data, null, 2));
    } else if (response.status === 404) {
      const data = await response.json();
      console.log('⏳ NFSe não encontrada (pode estar processando)');
      console.log('📄 Resposta:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Erro:', response.status, errorText);
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('');

  // ==========================================
  // 2. TESTAR API GERAL DE FOCUS NFE
  // ==========================================
  console.log('🏢 2. Testando API geral Focus NFe...');
  
  try {
    const empresasUrl = `${VERCEL_URL}/api/focusnfe?path=v2/empresas`;
    console.log('📡 URL:', empresasUrl);
    
    const response = await fetch(empresasUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    
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
  // 3. TESTAR ESTRUTURA ANTIGA (Deve dar 404)
  // ==========================================
  console.log('🔍 3. Testando estrutura antiga (deve dar 404)...');
  
  try {
    const oldUrl = `${VERCEL_URL}/api/nfse/${TEST_REFERENCIA}`;
    console.log('📡 URL antiga:', oldUrl);
    
    const response = await fetch(oldUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Status:', response.status);
    
    if (response.status === 404) {
      console.log('✅ Estrutura antiga corretamente removida (404 esperado)');
    } else {
      console.log('⚠️ Estrutura antiga ainda funciona');
    }
  } catch (error) {
    console.log('❌ Erro na requisição:', error.message);
  }

  console.log('');

  // ==========================================
  // 4. VERIFICAR LOGS E HEADERS
  // ==========================================
  console.log('🔍 4. Verificando headers de resposta...');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/nfse?referencia=${TEST_REFERENCIA}`, {
      method: 'GET'
    });

    console.log('📋 Headers de resposta:');
    response.headers.forEach((value, key) => {
      console.log(`   ${key}: ${value}`);
    });

    // Verificar CORS
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers'
    ];

    console.log('\n🌐 Verificação CORS:');
    corsHeaders.forEach(header => {
      const value = response.headers.get(header);
      console.log(`   ${header}: ${value || 'NÃO DEFINIDO'}`);
    });

  } catch (error) {
    console.log('❌ Erro ao verificar headers:', error.message);
  }

  console.log('');

  // ==========================================
  // 5. RESUMO E PRÓXIMOS PASSOS
  // ==========================================
  console.log('📋 RESUMO DOS TESTES:');
  console.log('');
  console.log('✅ Checklist de verificação:');
  console.log('□ Nova API /api/nfse?referencia=XXX responde');
  console.log('□ API geral /api/focusnfe?path=v2/empresas responde');
  console.log('□ Estrutura antiga /api/nfse/XXX retorna 404');
  console.log('□ Headers CORS configurados');
  console.log('□ Logs das funções disponíveis');
  console.log('');

  console.log('🎯 RESULTADO ESPERADO:');
  console.log('- Nova API deve responder com dados ou status "processando"');
  console.log('- Não deve mais aparecer erro 404 no console do navegador');
  console.log('- Sistema de emissão de NFSe deve funcionar normalmente');
  console.log('');

  console.log('🔧 SE AINDA HOUVER PROBLEMAS:');
  console.log('1. Verifique se o deploy foi concluído no Vercel');
  console.log('2. Confirme as variáveis de ambiente:');
  console.log('   - VITE_FOCUS_NFE_TOKEN_PRODUCAO');
  console.log('   - VITE_FOCUS_NFE_API_BASE');
  console.log('3. Verifique os logs das funções no Vercel Dashboard');
  console.log('4. Teste a emissão de NFSe no frontend');
  console.log('');

  console.log('📞 COMANDOS ÚTEIS:');
  console.log(`vercel logs ${VERCEL_URL}`);
  console.log('vercel env ls');
  console.log('');

  console.log('✅ TESTES CONCLUÍDOS!');
  console.log('Se todos os testes passaram, o erro 404 deve estar resolvido.');
}

// Executar testes
testNFSeFixVercel().catch(console.error);
