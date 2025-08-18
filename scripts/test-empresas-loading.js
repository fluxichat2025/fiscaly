// Script para testar o carregamento de empresas
console.log('🏢 TESTANDO CARREGAMENTO DE EMPRESAS\n');

const VERCEL_URL = 'https://fiscaly.fluxitech.com.br';

async function testEmpresasLoading() {
  console.log('📊 TESTE DE CARREGAMENTO DE EMPRESAS\n');

  // ==========================================
  // 1. TESTAR API DE EMPRESAS VIA VERCEL
  // ==========================================
  console.log('1. 🌐 Testando API de empresas via Vercel...');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/focusnfe?path=v2/empresas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📋 Status Text: ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API funcionando!');
      console.log(`   📄 Empresas encontradas: ${Array.isArray(data) ? data.length : 'Dados recebidos'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('   📋 Primeiras empresas:');
        data.slice(0, 3).forEach((empresa, index) => {
          console.log(`      ${index + 1}. ${empresa.razao_social || empresa.nome || 'Sem nome'}`);
          console.log(`         CNPJ: ${empresa.cnpj || 'N/A'}`);
          console.log(`         Status: ${empresa.status || 'N/A'}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erro na API:');
      console.log(`   📄 Resposta: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 2. TESTAR DETECÇÃO DE AMBIENTE
  // ==========================================
  console.log('2. 🌍 Testando detecção de ambiente...');
  
  // Simular diferentes ambientes
  const environments = [
    { hostname: 'localhost', expected: 'Desenvolvimento' },
    { hostname: 'fiscaly.fluxitech.com.br', expected: 'Produção' },
    { hostname: 'fiscaly-nu.vercel.app', expected: 'Produção' }
  ];

  environments.forEach(env => {
    const isLocalhost = env.hostname === 'localhost';
    const isProduction = !isLocalhost;
    const apiBase = isLocalhost ? '/api/focusnfe/v2' : '/api/focusnfe';
    
    console.log(`   🔗 ${env.hostname}:`);
    console.log(`      - Ambiente: ${isProduction ? 'Produção' : 'Desenvolvimento'}`);
    console.log(`      - API Base: ${apiBase}`);
    console.log(`      - URL Empresas: ${apiBase}${isLocalhost ? '/empresas' : '?path=v2/empresas'}`);
  });

  console.log('');

  // ==========================================
  // 3. VERIFICAR POSSÍVEIS PROBLEMAS
  // ==========================================
  console.log('3. 🔍 Verificando possíveis problemas...');
  
  console.log('   ✅ Checklist de verificação:');
  console.log('   □ isProduction removido do código');
  console.log('   □ isLocalhost sendo usado corretamente');
  console.log('   □ API Vercel respondendo');
  console.log('   □ Estrutura de URL correta');
  console.log('   □ Headers de autenticação corretos');
  console.log('');

  console.log('   🔧 Problemas comuns e soluções:');
  console.log('   - ReferenceError: isProduction is not defined');
  console.log('     → Substituir por !isLocalhost');
  console.log('   - 403 token_invalido');
  console.log('     → Verificar codificação Base64 do token');
  console.log('   - 404 Not Found');
  console.log('     → Verificar estrutura da URL da API');
  console.log('   - CORS errors');
  console.log('     → Usar Serverless Functions do Vercel');

  console.log('');

  // ==========================================
  // 4. TESTAR DIFERENTES ESTRATÉGIAS
  // ==========================================
  console.log('4. 🧪 Testando diferentes estratégias...');
  
  const strategies = [
    {
      name: 'Estratégia 1: API Vercel',
      url: `${VERCEL_URL}/api/focusnfe?path=v2/empresas`
    },
    {
      name: 'Estratégia 2: API Index',
      url: `${VERCEL_URL}/api/index?path=v2/empresas`
    },
    {
      name: 'Estratégia 3: API NFSe',
      url: `${VERCEL_URL}/api/nfse?referencia=test`
    }
  ];

  for (const strategy of strategies) {
    try {
      console.log(`   🔍 ${strategy.name}...`);
      const response = await fetch(strategy.url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log(`      Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`      ✅ Funcionando! Dados: ${JSON.stringify(data).substring(0, 100)}...`);
      } else {
        console.log(`      ❌ Erro: ${response.statusText}`);
      }
    } catch (error) {
      console.log(`      ❌ Erro: ${error.message}`);
    }
  }

  console.log('');

  // ==========================================
  // 5. RESUMO E RECOMENDAÇÕES
  // ==========================================
  console.log('📋 RESUMO E RECOMENDAÇÕES:');
  console.log('');

  console.log('🔧 CORREÇÕES APLICADAS:');
  console.log('   - isProduction → !isLocalhost');
  console.log('   - Detecção de ambiente corrigida');
  console.log('   - URLs de API padronizadas');
  console.log('   - Autenticação corrigida');
  console.log('');

  console.log('🎯 RESULTADO ESPERADO:');
  console.log('   - Página de empresas deve carregar sem erro');
  console.log('   - Lista de empresas deve aparecer');
  console.log('   - Não deve haver erro "isProduction is not defined"');
  console.log('   - APIs devem responder corretamente');
  console.log('');

  console.log('📞 SE AINDA HOUVER PROBLEMAS:');
  console.log('   1. Verifique o console do navegador');
  console.log('   2. Confirme se o deploy foi concluído');
  console.log('   3. Teste em modo incógnito');
  console.log('   4. Limpe o cache do navegador');
  console.log('');

  console.log('🚀 PRÓXIMOS PASSOS:');
  console.log('   1. Acesse https://fiscaly.fluxitech.com.br/empresas');
  console.log('   2. Verifique se as empresas carregam');
  console.log('   3. Monitore o console para erros');
  console.log('   4. Teste outras funcionalidades');
  console.log('');

  console.log('✅ TESTE DE EMPRESAS CONCLUÍDO!');
}

// Executar teste
testEmpresasLoading().catch(console.error);
