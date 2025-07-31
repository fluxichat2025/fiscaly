# 🚀 Guia de Deploy Automático - Sistema Fiscalia

## Opção 1: GitHub + Vercel (Recomendado)

### Passo 1: Criar Repositório no GitHub
1. Acesse [github.com](https://github.com) e faça login
2. Clique em "New repository"
3. Nome: `sistema-fiscalia` ou outro de sua escolha
4. Marque como "Public" ou "Private"
5. NÃO marque "Initialize with README" (já temos um)
6. Clique "Create repository"

### Passo 2: Subir o Código (Sem Git Local)
Como você não tem Git instalado, use uma dessas opções:

#### Opção A: GitHub Desktop (Mais Fácil)
1. Baixe [GitHub Desktop](https://desktop.github.com/)
2. Instale e faça login
3. Clique "Add an Existing Repository from your Hard Drive"
4. Selecione a pasta do projeto
5. Clique "Publish repository"

#### Opção B: Upload Direto no GitHub
1. No repositório criado, clique "uploading an existing file"
2. Arraste toda a pasta do projeto
3. Escreva uma mensagem: "Initial commit - Sistema Fiscalia"
4. Clique "Commit changes"

### Passo 3: Deploy no Vercel
1. Acesse [vercel.com](https://vercel.com)
2. Faça login com sua conta GitHub
3. Clique "New Project"
4. Selecione o repositório `sistema-fiscalia`
5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

### Passo 4: Configurar Variáveis de Ambiente
No painel do Vercel:
1. Vá em "Settings" > "Environment Variables"
2. Adicione:
   ```
   VITE_SUPABASE_URL = sua_url_do_supabase
   VITE_SUPABASE_ANON_KEY = sua_chave_do_supabase
   ```

### Passo 5: Deploy Automático Ativo! 🎉
- Qualquer mudança no GitHub = Deploy automático
- URL personalizada disponível
- HTTPS automático
- CDN global

---

## Opção 2: Netlify (Alternativa)

### Passo 1: Netlify Deploy
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `dist` (após `npm run build`)
3. Configure domínio personalizado
4. Conecte com GitHub para deploy automático

---

## Opção 3: Deploy Manual Rápido

### Usando Vercel CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Na pasta do projeto
vercel

# Seguir instruções
```

---

## 📋 Checklist Pré-Deploy

- ✅ Projeto compilando sem erros (`npm run build`)
- ✅ Variáveis de ambiente configuradas
- ✅ Supabase configurado
- ✅ Tabelas criadas no banco
- ✅ RLS (Row Level Security) ativo

---

## 🔧 Configurações Importantes

### Build Settings
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x

### Environment Variables
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_publica
```

### Custom Domain (Opcional)
1. Compre um domínio
2. Configure DNS no Vercel
3. SSL automático

---

## 🚀 Resultado Final

Após o deploy:
- ✅ Site online 24/7
- ✅ Deploy automático a cada mudança
- ✅ HTTPS automático
- ✅ CDN global (carregamento rápido)
- ✅ Monitoramento integrado
- ✅ Logs de deploy

---

## 📞 Suporte

Se precisar de ajuda:
1. Documentação Vercel: [vercel.com/docs](https://vercel.com/docs)
2. Documentação Supabase: [supabase.com/docs](https://supabase.com/docs)
3. GitHub Issues do projeto

---

**Tempo estimado**: 15-30 minutos para deploy completo! 🎯
