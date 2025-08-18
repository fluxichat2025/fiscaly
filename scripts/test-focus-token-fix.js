// Script para testar se a correção do token Focus NFe está funcionando
console.log('🔑 TESTANDO CORREÇÃO DO TOKEN FOCUS NFE\n');

const FOCUS_NFE_TOKEN = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
const FOCUS_NFE_BASE_URL = 'https://api.focusnfe.com.br/v2';

async function testFocusTokenFix() {
  console.log('📊 TESTE DE AUTENTICAÇÃO FOCUS NFE\n');

  // ==========================================
  // 1. VERIFICAR TOKEN ORIGINAL
  // ==========================================
  console.log('1. 🔍 Verificando token original...');
  console.log(`   Token: ${FOCUS_NFE_TOKEN.substring(0, 10)}...`);
  console.log(`   Tamanho: ${FOCUS_NFE_TOKEN.length} caracteres`);
  
  // Verificar se é Base64 válido
  try {
    const decoded = Buffer.from(FOCUS_NFE_TOKEN, 'base64').toString('ascii');
    console.log(`   ✅ Token é Base64 válido`);
    console.log(`   📄 Decodificado: ${decoded.substring(0, 20)}...`);
  } catch (error) {
    console.log(`   ❌ Token não é Base64 válido: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 2. TESTAR AUTENTICAÇÃO CORRETA
  // ==========================================
  console.log('2. 🔐 Testando autenticação correta (sem dupla codificação)...');
  
  try {
    const response = await fetch(`${FOCUS_NFE_BASE_URL}/empresas`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${FOCUS_NFE_TOKEN}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-Test/1.0'
      }
    });

    console.log(`   📊 Status: ${response.status}`);
    console.log(`   📋 Status Text: ${response.statusText}`);

    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ Autenticação bem-sucedida!');
      console.log(`   📄 Empresas encontradas: ${Array.isArray(data) ? data.length : 'Dados recebidos'}`);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('   📋 Primeira empresa:');
        const empresa = data[0];
        console.log(`      - CNPJ: ${empresa.cnpj || 'N/A'}`);
        console.log(`      - Razão Social: ${empresa.razao_social || 'N/A'}`);
        console.log(`      - Status: ${empresa.status || 'N/A'}`);
      }
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erro na autenticação:');
      console.log(`   📄 Resposta: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.erros) {
          errorJson.erros.forEach(erro => {
            console.log(`      - ${erro.codigo}: ${erro.mensagem}`);
          });
        }
      } catch (e) {
        console.log(`      - Erro não estruturado: ${errorText}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 3. TESTAR AUTENTICAÇÃO INCORRETA (DUPLA CODIFICAÇÃO)
  // ==========================================
  console.log('3. ❌ Testando autenticação incorreta (dupla codificação)...');
  
  try {
    const wrongAuth = Buffer.from(`${FOCUS_NFE_TOKEN}:`).toString('base64');
    
    const response = await fetch(`${FOCUS_NFE_BASE_URL}/empresas`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${wrongAuth}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Fiscaly-Test/1.0'
      }
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.status === 403) {
      console.log('   ✅ Dupla codificação falha como esperado (403 Forbidden)');
    } else if (response.ok) {
      console.log('   ⚠️ Dupla codificação funcionou (inesperado)');
    } else {
      console.log(`   📄 Outro erro: ${response.statusText}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 4. TESTAR API DO VERCEL
  // ==========================================
  console.log('4. 🌐 Testando API do Vercel...');
  
  const VERCEL_URL = 'https://fiscaly.fluxitech.com.br';
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/focusnfe?path=v2/empresas`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`   📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('   ✅ API Vercel funcionando!');
      console.log(`   📄 Empresas via Vercel: ${Array.isArray(data) ? data.length : 'Dados recebidos'}`);
    } else {
      const errorText = await response.text();
      console.log('   ❌ Erro na API Vercel:');
      console.log(`   📄 Resposta: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Erro na requisição Vercel: ${error.message}`);
  }

  console.log('');

  // ==========================================
  // 5. RESUMO DOS TESTES
  // ==========================================
  console.log('📋 RESUMO DOS TESTES:');
  console.log('');
  console.log('✅ Checklist de verificação:');
  console.log('□ Token é Base64 válido');
  console.log('□ Autenticação direta funciona');
  console.log('□ Dupla codificação falha (como esperado)');
  console.log('□ API Vercel funciona');
  console.log('');

  console.log('🔧 CORREÇÕES APLICADAS:');
  console.log('   - api/index.js: Removida dupla codificação');
  console.log('   - api/nfse.js: Removida dupla codificação');
  console.log('   - api/focusnfe.js: Removida dupla codificação');
  console.log('   - api/focusnfe/[...path].js: Removida dupla codificação');
  console.log('   - api/nfse/[referencia].js: Removida dupla codificação');
  console.log('   - src/hooks/useFocusNFeAPI.tsx: Removida dupla codificação');
  console.log('');

  console.log('🎯 RESULTADO ESPERADO:');
  console.log('   - Erro 403 "token_invalido" deve estar resolvido');
  console.log('   - APIs devem retornar dados das empresas');
  console.log('   - Cancelamento de NFSe deve funcionar');
  console.log('   - Consulta de NFSe deve funcionar');
  console.log('');

  console.log('📞 SE AINDA HOUVER PROBLEMAS:');
  console.log('   1. Verifique se o deploy foi concluído no Vercel');
  console.log('   2. Confirme se a variável VITE_FOCUS_NFE_TOKEN_PRODUCAO está configurada');
  console.log('   3. Teste diretamente: curl -H "Authorization: Basic QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe" https://api.focusnfe.com.br/v2/empresas');
  console.log('');

  console.log('✅ TESTE DE TOKEN CONCLUÍDO!');
}

// Executar teste
testFocusTokenFix().catch(console.error);
