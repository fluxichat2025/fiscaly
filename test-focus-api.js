// Teste simples para verificar conectividade com a API Focus NFe
const TOKEN_PRODUCAO = 'QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe';
const FOCUS_NFE_API_BASE = 'https://api.focusnfe.com.br/v2';

async function testFocusAPI() {
  console.log('🔍 Testando conectividade com API Focus NFe...');
  console.log('Token:', TOKEN_PRODUCAO.substring(0, 10) + '...');
  console.log('Base URL:', FOCUS_NFE_API_BASE);

  try {
    const auth = btoa(`${TOKEN_PRODUCAO}:`);
    console.log('Auth header:', auth.substring(0, 20) + '...');

    const response = await fetch(`${FOCUS_NFE_API_BASE}/empresas`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log('✅ API funcionando! Dados recebidos:', data);
      console.log('Número de empresas:', Array.isArray(data) ? data.length : 'Não é array');
    } else {
      const errorText = await response.text();
      console.log('❌ Erro na API:', errorText);
    }
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
  }
}

// Executar teste se for chamado diretamente
if (typeof window === 'undefined') {
  testFocusAPI();
}

// Exportar para uso no browser
if (typeof window !== 'undefined') {
  window.testFocusAPI = testFocusAPI;
}
