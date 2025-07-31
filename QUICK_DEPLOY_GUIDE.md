# ðŸš€ Guia RÃ¡pido de Deploy - Sistema com Focus NFe

## âš¡ Deploy Imediato no Vercel (5 minutos)

### Passo 1: Acesse o Vercel
- **URL**: https://vercel.com/new
- **Login**: Use sua conta GitHub

### Passo 2: Importe o RepositÃ³rio
1. Clique em **"Import Git Repository"**
2. Selecione: `fluxichat2025/contabilidade-pulse-app`
3. Clique em **"Import"**

### Passo 3: Configure VariÃ¡veis de Ambiente
**IMPORTANTE**: Adicione estas variÃ¡veis antes do deploy:

```
VITE_SUPABASE_URL=https://fdkromzapsquvfyjjcyr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZka3JvbXphcHNxdXZmeWpqY3lyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI5NzQsImV4cCI6MjA1MDU0ODk3NH0.example
```

### Passo 4: Deploy
1. Clique em **"Deploy"**
2. Aguarde ~2-3 minutos
3. **URL gerada**: `https://contabilidade-pulse-app.vercel.app`

---

## ðŸ”§ ConfiguraÃ§Ã£o da Focus NFe no Sistema

### ApÃ³s o Deploy:

1. **Acesse** a URL gerada pelo Vercel
2. **Crie uma conta** ou faÃ§a login
3. **VÃ¡ em "Prestadores"** no menu lateral
4. **Clique no Ã­cone âš™ï¸** de configuraÃ§Ã£o de uma empresa
5. **Aba "ConfiguraÃ§Ã£o"**:
   - **Token HomologaÃ§Ã£o**: Cole seu token da Focus NFe
   - **Token ProduÃ§Ã£o**: Cole seu token de produÃ§Ã£o (se tiver)
   - **Certificado Digital**: FaÃ§a upload do arquivo .pfx/.p12
   - **Senha**: Digite a senha do certificado
   - **Teste a conexÃ£o**
   - **Salve**

### Tokens de Teste Focus NFe:
Se nÃ£o tiver tokens reais, use estes para teste:
```
HomologaÃ§Ã£o: SeuTokenDeHomologacaoAqui32Caracteres
ProduÃ§Ã£o: SeuTokenDeProducaoAqui32Caracteres
```

---

## ðŸ§ª Testando a EmissÃ£o de NFSe

### Dados de Teste:

**Tomador (Cliente):**
- Tipo: Pessoa JurÃ­dica
- CNPJ: 11.222.333/0001-81
- RazÃ£o Social: Empresa Teste Ltda
- Email: teste@empresa.com

**ServiÃ§o:**
- DescriÃ§Ã£o: Consultoria em Tecnologia da InformaÃ§Ã£o
- Quantidade: 1
- Valor UnitÃ¡rio: R$ 500,00
- AlÃ­quota ISS: 5%

### Passos:
1. **VÃ¡ em "Emitir NFSe"**
2. **Preencha** os dados do tomador
3. **Adicione** o serviÃ§o
4. **Clique em "Emitir NFSe"**
5. **Acompanhe** no Dashboard e HistÃ³rico

---

## ðŸ” Verificando se a IntegraÃ§Ã£o Funciona

### Checklist:

âœ… **PÃ¡gina de Prestadores** carrega sem erros  
âœ… **BotÃ£o de configuraÃ§Ã£o (âš™ï¸)** abre modal com abas  
âœ… **Aba "ConfiguraÃ§Ã£o"** mostra campos da Focus NFe  
âœ… **Aba "Emitir NFSe"** mostra formulÃ¡rio completo  
âœ… **Aba "Dashboard"** mostra estatÃ­sticas  
âœ…**Aba "HistÃ³rico"** mostra tabela de NFSe  

### Se algo nÃ£o funcionar:

1. **Abra o Console do Navegador** (F12)
2. **Veja se hÃ¡ erros** na aba Console
3. **Verifique** se as variÃ¡veis de ambiente estÃ£o corretas
4. **Teste** em modo incÃ³gnito

---

## ðŸŒ URLs Esperadas

ApÃ³s o deploy, vocÃª terÃ¡:

- **Vercel**: `https://contabilidade-pulse-app-fluxichat2025.vercel.app`
- **Ou similar**: `https://contabilidade-pulse-app-git-main-fluxichat2025.vercel.app`

---

## ðŸ†˜ Problemas Comuns

### "Supabase connection failed"
- Verifique se as variÃ¡veis VITE_SUPABASE_ª estÃ£o corretas
- Confirme se o projeto Supabase estÃ¡ ativo

### "Focus NFe nÃ£o aparece"
- Verifique se o build foi bem-sucedido
- Confirme se todos os arquivos foram enviados para o GitHub

### "BotÃµes nÃ£o funcionam"
- Abra o Console (F12) e veja os erros
- Verifique se hÃ¡ erros de JavaScript

### "Campos nÃ£o aparecem"
- Confirme se a migraÃ§Ã£o do banco foi executada
- Verifique se as tabelas existem no Supabase

---

## ðŸ“ž PrÃ³ximos Passos

1. **FaÃ§a o deploy** seguindo os passos acima
2. **Teste** a funcionalidade bÃ¡sica
3. **Configure** seus tokens reais da Focus NFe
4. **Execute** a migraÃ§Ã£o do banco no Supabase
5. **Teste** a emissÃ£o de NFSe

**ðŸŽ‰ Em 5 minutos vocÃª terÃ¡ o sistema funcionando online!**
