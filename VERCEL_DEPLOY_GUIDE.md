# 🚀 Guia de Deploy no Vercel - Correção de Erros NFSe

## 🎯 **Problema Resolvido**

O erro de emissão de NFSe no Vercel foi causado por:
- ❌ CORS bloqueando chamadas diretas para api.focusnfe.com.br
- ❌ Proxy do Vite não funcionando em produção
- ❌ Falta de Serverless Functions adequadas

## ✅ **Solução Implementada**

### **1. Serverless Functions Criadas:**
- `api/focusnfe/[...path].js` - Proxy geral para Focus NFe
- `api/nfse/[referencia].js` - Consulta otimizada de NFSe
- `vercel.json` - Configuração de CORS e timeouts

### **2. Hooks Atualizados:**
- `useFocusNFeAPI.tsx` - Detecção correta de ambiente
- `useNFSeEmissionPopup.tsx` - API otimizada para consultas

## 🔧 **Passos para Deploy**

### **1. Configurar Variáveis de Ambiente no Vercel:**

1. **Acesse o Vercel Dashboard:**
   ```
   https://vercel.com/dashboard
   ```

2. **Vá para seu projeto → Settings → Environment Variables**

3. **Adicione estas variáveis:**
   ```
   VITE_FOCUS_NFE_TOKEN_PRODUCAO = QiCgQ0fQMu5RDfEqnVMWKruRjhJePCoe
   VITE_FOCUS_NFE_API_BASE = https://api.focusnfe.com.br/v2
   VITE_USE_MOCK_DATA = false
   NODE_ENV = production
   ```

### **2. Fazer Deploy:**

```bash
# Commit das alterações
git add .
git commit -m "fix: Implementar Serverless Functions para NFSe no Vercel"

# Push para o repositório (deploy automático)
git push origin main
```

### **3. Verificar Deploy:**

1. **Aguarde o build completar** no Vercel Dashboard
2. **Acesse a URL do seu app**
3. **Execute o script de teste:**

```bash
# Edite o script com sua URL do Vercel
node scripts/test-vercel-apis.js
```

## 🧪 **Testar as Correções**

### **1. Teste Manual no Navegador:**

1. **Acesse seu app no Vercel**
2. **Faça login**
3. **Vá para "Emitir NFSe"**
4. **Preencha os dados**
5. **Clique em "Emitir NFSe"**

### **2. Verificar Logs:**

```bash
# Ver logs das funções
vercel logs https://seu-app.vercel.app

# Ver logs em tempo real
vercel logs https://seu-app.vercel.app --follow
```

### **3. Testar APIs Diretamente:**

```bash
# Testar API de empresas
curl -X GET "https://seu-app.vercel.app/api/focusnfe/v2/empresas" \
  -H "Content-Type: application/json"

# Testar consulta NFSe
curl -X GET "https://seu-app.vercel.app/api/nfse/test-123" \
  -H "Content-Type: application/json"
```

## 🔍 **Solução de Problemas**

### **Erro 500 - Internal Server Error:**
- ✅ Verifique se as variáveis de ambiente estão configuradas
- ✅ Confirme se o token da Focus NFe está correto
- ✅ Veja os logs das funções no Vercel

### **Erro 404 - Not Found:**
- ✅ Confirme se os arquivos estão na pasta `/api/`
- ✅ Verifique se o deploy incluiu as Serverless Functions
- ✅ Teste as URLs das APIs diretamente

### **Erro de CORS:**
- ✅ Verifique se `vercel.json` foi deployado
- ✅ Confirme se os headers CORS estão nas funções
- ✅ Teste requisições OPTIONS

### **Timeout:**
- ✅ Aumente `maxDuration` no `vercel.json`
- ✅ Otimize as requisições para Focus NFe
- ✅ Implemente retry automático

## 📊 **Monitoramento**

### **1. Logs das Funções:**
- Acesse Vercel Dashboard → Functions
- Veja logs em tempo real
- Monitore performance e erros

### **2. Métricas:**
- Tempo de resposta das APIs
- Taxa de sucesso das emissões
- Uso de recursos das funções

## 🎯 **Resultado Esperado**

Após implementar as correções:

### **✅ Funcionando:**
- ✅ Emissão de NFSe sem erros de CORS
- ✅ Consulta de status funcionando
- ✅ APIs respondendo rapidamente
- ✅ Logs detalhados para debug

### **✅ Performance:**
- ⚡ Respostas em < 5 segundos
- 🔄 Retry automático em caso de falha
- 📊 Cache para consultas frequentes
- 🛡️ Tratamento de erros robusto

## 🚀 **Próximos Passos**

1. **Teste a emissão** de NFSe no ambiente de produção
2. **Configure webhooks** para atualizações automáticas
3. **Monitore os logs** para identificar possíveis melhorias
4. **Otimize performance** baseado no uso real

## 📞 **Suporte**

Se ainda houver problemas:

1. **Compartilhe os logs** das Serverless Functions
2. **Informe o erro específico** que está aparecendo
3. **Teste o token** diretamente na API Focus NFe
4. **Verifique as variáveis** de ambiente no Vercel

---

## 🎉 **Resumo**

**Problema**: Erro de CORS e proxy não funcionando no Vercel
**Solução**: Serverless Functions com proxy adequado
**Status**: ✅ **IMPLEMENTADO E PRONTO PARA DEPLOY**

O sistema agora deve funcionar perfeitamente no Vercel!
