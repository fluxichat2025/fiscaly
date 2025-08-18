// Script para diagnosticar erros de emissão de NFSe no Vercel
console.log('🔍 DIAGNÓSTICO DE ERROS DE NFSe NO VERCEL\n');

// ==========================================
// 1. PROBLEMAS COMUNS NO VERCEL
// ==========================================
console.log('🚨 1. PROBLEMAS MAIS COMUNS NO VERCEL:');
console.log('');

console.log('❌ PROBLEMA #1: CORS (Cross-Origin Resource Sharing)');
console.log('   - O Vercel não pode fazer proxy para APIs externas');
console.log('   - Chamadas diretas para api.focusnfe.com.br são bloqueadas');
console.log('   - Solução: Usar Serverless Functions');
console.log('');

console.log('❌ PROBLEMA #2: Proxy do Vite não funciona em produção');
console.log('   - vite.config.ts proxy só funciona em desenvolvimento');
console.log('   - URLs como /api/focusnfe não existem no Vercel');
console.log('   - Solução: Criar API routes no Vercel');
console.log('');

console.log('❌ PROBLEMA #3: Variáveis de ambiente');
console.log('   - VITE_FOCUS_NFE_TOKEN_PRODUCAO pode não estar configurada');
console.log('   - Tokens podem estar incorretos ou expirados');
console.log('   - Solução: Verificar configuração no Vercel Dashboard');
console.log('');

console.log('❌ PROBLEMA #4: Serverless Functions timeout');
console.log('   - Vercel tem limite de 10s para Hobby plan');
console.log('   - APIs da Focus NFe podem demorar mais que isso');
console.log('   - Solução: Implementar retry e timeout handling');

// ==========================================
// 2. VERIFICAR CONFIGURAÇÃO ATUAL
// ==========================================
console.log('\n🔧 2. VERIFICANDO CONFIGURAÇÃO ATUAL:');
console.log('');

console.log('📁 Estrutura esperada no Vercel:');
console.log('   /api/focusnfe/[...path].js - Serverless function');
console.log('   /api/nfse/[referencia].js - API de consulta');
console.log('   /api/empresas.js - API de empresas');
console.log('');

console.log('🔑 Variáveis de ambiente necessárias:');
console.log('   VITE_FOCUS_NFE_TOKEN_PRODUCAO=QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe');
console.log('   VITE_FOCUS_NFE_API_BASE=https://api.focusnfe.com.br/v2');
console.log('   VITE_USE_MOCK_DATA=false');

// ==========================================
// 3. SOLUÇÕES ESPECÍFICAS
// ==========================================
console.log('\n✅ 3. SOLUÇÕES PARA CADA PROBLEMA:');
console.log('');

console.log('🔧 SOLUÇÃO #1: Criar Serverless Function para Focus NFe');
console.log('   Arquivo: /api/focusnfe/[...path].js');
console.log('   Função: Fazer proxy das requisições para api.focusnfe.com.br');
console.log('');

console.log('🔧 SOLUÇÃO #2: Atualizar lógica de detecção de ambiente');
console.log('   Problema: isProduction detecta Vercel como produção');
console.log('   Solução: Usar variável de ambiente específica');
console.log('');

console.log('🔧 SOLUÇÃO #3: Implementar fallback para APIs');
console.log('   Se API falhar, usar dados do Supabase');
console.log('   Implementar retry automático');
console.log('');

console.log('🔧 SOLUÇÃO #4: Configurar timeout adequado');
console.log('   Aumentar timeout das requisições');
console.log('   Implementar loading states melhores');

// ==========================================
// 4. CHECKLIST DE VERIFICAÇÃO
// ==========================================
console.log('\n📋 4. CHECKLIST DE VERIFICAÇÃO:');
console.log('');

console.log('□ Verificar se existe /api/focusnfe/[...path].js no projeto');
console.log('□ Confirmar variáveis de ambiente no Vercel Dashboard');
console.log('□ Testar token da Focus NFe manualmente');
console.log('□ Verificar logs do Vercel Functions');
console.log('□ Confirmar se empresas estão cadastradas na Focus NFe');
console.log('□ Testar emissão em ambiente de homologação primeiro');

// ==========================================
// 5. COMANDOS PARA VERIFICAR
// ==========================================
console.log('\n🔍 5. COMANDOS PARA VERIFICAR:');
console.log('');

console.log('# Verificar se API está respondendo:');
console.log('curl -X GET "https://seu-app.vercel.app/api/focusnfe/v2/empresas" \\');
console.log('  -H "Authorization: Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6"');
console.log('');

console.log('# Testar token diretamente na Focus NFe:');
console.log('curl -X GET "https://api.focusnfe.com.br/v2/empresas" \\');
console.log('  -H "Authorization: Basic UWlDZ1EwZlFNdTVSRGZFcW5WTVdLcnVSamhKZVBDb2U6"');
console.log('');

console.log('# Verificar logs do Vercel:');
console.log('vercel logs https://seu-app.vercel.app');

// ==========================================
// 6. PRÓXIMOS PASSOS
// ==========================================
console.log('\n🚀 6. PRÓXIMOS PASSOS:');
console.log('');

console.log('1. 📁 Criar arquivo /api/focusnfe/[...path].js');
console.log('2. 🔑 Configurar variáveis de ambiente no Vercel');
console.log('3. 🧪 Testar em ambiente de homologação');
console.log('4. 📊 Implementar logs detalhados');
console.log('5. 🔄 Fazer deploy e testar');

console.log('\n📞 SUPORTE:');
console.log('Se o problema persistir:');
console.log('1. Compartilhe os logs do Vercel Functions');
console.log('2. Informe qual erro específico está aparecendo');
console.log('3. Teste se o token funciona diretamente na API da Focus NFe');

console.log('\n🎯 RESULTADO ESPERADO:');
console.log('Após implementar as correções, a emissão de NFSe deve funcionar');
console.log('normalmente no ambiente de produção do Vercel.');

console.log('\n✅ DIAGNÓSTICO CONCLUÍDO!');
console.log('Agora vamos implementar as correções necessárias...');
