# 🔧 Instruções para Configuração do Sistema

## ❌ Problemas Identificados

Durante a análise do sistema, foram identificados os seguintes problemas que impedem o cadastro de bancos, contas, categorias, etc.:

### 1. **Tabelas Faltantes no Banco de Dados**
As seguintes tabelas não existem no Supabase e precisam ser criadas:
- ❌ `categories` (categorias de receita/despesa)
- ❌ `cost_centers` (centros de custo)
- ❌ `company_info` (informações da empresa)
- ❌ `audit_logs` (logs de auditoria)
- ❌ `app_settings` (configurações do app)
- ❌ `user_preferences` (preferências do usuário)

### 2. **Funções de CRUD Implementadas** ✅
As funções para criar, editar e excluir foram implementadas:
- ✅ `createAccount()` - Criar conta bancária
- ✅ `createCategory()` - Criar categoria
- ✅ `deleteAccount()` - Excluir conta bancária
- ✅ `deleteCategory()` - Excluir categoria
- ✅ Botões conectados com as funções

### 3. **Integração de Categorias no FluxoDeCaixa** ✅
- ✅ Campo categoria substituído por Select estruturado
- ✅ Filtragem por tipo (receita/despesa) baseado no tipo da transação
- ✅ Carregamento automático das categorias

## 🚀 Solução: Criar Tabelas no Supabase

### **Passo 1: Acessar o Dashboard do Supabase**
1. Acesse: https://supabase.com/dashboard
2. Faça login na sua conta
3. Selecione o projeto: **Nota Sistema Fiscal**

### **Passo 2: Executar SQL no Editor**
1. No menu lateral, clique em **SQL Editor**
2. Clique em **New Query**
3. Cole o SQL abaixo e execute:

```sql
-- 1) Criar tabela categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  icon TEXT NOT NULL DEFAULT 'folder',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Criar tabela cost_centers
CREATE TABLE IF NOT EXISTS public.cost_centers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  code TEXT UNIQUE,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Criar tabela company_info
CREATE TABLE IF NOT EXISTS public.company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  logo_url TEXT,
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  email_corporativo TEXT,
  website TEXT,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  banco_principal TEXT,
  agencia TEXT,
  conta TEXT,
  atividade_principal TEXT,
  capital_social DECIMAL(15,2),
  data_abertura DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4) Criar tabela audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Criar tabela app_settings
CREATE TABLE IF NOT EXISTS public.app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6) Criar tabela user_preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  language TEXT DEFAULT 'pt-BR',
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  notifications_enabled BOOLEAN DEFAULT true,
  email_notifications BOOLEAN DEFAULT true,
  dashboard_layout JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON public.cost_centers(active);
CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON public.company_info(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Habilitar RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Inserir categorias padrão
INSERT INTO public.categories (name, type, color, icon, description, created_by) VALUES
  ('Vendas', 'income', '#10b981', 'dollar-sign', 'Receitas de vendas de produtos/serviços', null),
  ('Serviços', 'income', '#3b82f6', 'briefcase', 'Receitas de prestação de serviços', null),
  ('Juros', 'income', '#8b5cf6', 'trending-up', 'Receitas financeiras e juros', null),
  ('Outras Receitas', 'income', '#06b6d4', 'plus-circle', 'Outras receitas diversas', null),
  ('Fornecedores', 'expense', '#ef4444', 'truck', 'Pagamentos a fornecedores', null),
  ('Impostos', 'expense', '#f59e0b', 'file-text', 'Impostos e taxas', null),
  ('Salários', 'expense', '#84cc16', 'users', 'Folha de pagamento', null),
  ('Aluguel', 'expense', '#6366f1', 'home', 'Aluguel e condomínio', null),
  ('Marketing', 'expense', '#ec4899', 'megaphone', 'Despesas de marketing e publicidade', null),
  ('Outras Despesas', 'expense', '#64748b', 'minus-circle', 'Outras despesas diversas', null)
ON CONFLICT DO NOTHING;
```

### **Passo 3: Configurar Políticas RLS**
Execute este SQL adicional para configurar as políticas de segurança:

```sql
-- Políticas para categories
CREATE POLICY "Users can manage their own categories" ON public.categories
  FOR ALL USING (created_by = auth.uid() OR created_by IS NULL);

-- Políticas para cost_centers
CREATE POLICY "Users can manage their own cost centers" ON public.cost_centers
  FOR ALL USING (created_by = auth.uid());

-- Políticas para company_info
CREATE POLICY "Users can manage their own company info" ON public.company_info
  FOR ALL USING (user_id = auth.uid());

-- Políticas para user_preferences
CREATE POLICY "Users can manage their own preferences" ON public.user_preferences
  FOR ALL USING (user_id = auth.uid());

-- Políticas para audit_logs
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (user_id = auth.uid());

-- Políticas para app_settings
CREATE POLICY "Users can view public app settings" ON public.app_settings
  FOR SELECT USING (is_public = true);
```

## ✅ Após Executar o SQL

Depois de executar o SQL acima, o sistema estará funcionando completamente:

### **Funcionalidades Habilitadas:**
1. ✅ **Cadastro de Contas Bancárias** - Página Configurações → Financeiro
2. ✅ **Cadastro de Categorias** - Receita e Despesa com cores e ícones
3. ✅ **Integração no Fluxo de Caixa** - Campo categoria agora é um Select estruturado
4. ✅ **Dados da Empresa** - Formulário completo funcionando
5. ✅ **Exclusão de Registros** - Botões de lixeira funcionando

### **Melhorias Implementadas:**
- 🔄 **Campo Categoria Inteligente**: Filtra automaticamente receitas/despesas baseado no tipo da transação
- 🎨 **Categorias com Cores**: Cada categoria tem cor e ícone personalizados
- 🔒 **Segurança RLS**: Cada usuário só acessa seus próprios dados
- 📊 **Dados Padrão**: 10 categorias pré-configuradas para começar

## 🎯 Próximos Passos

1. **Execute o SQL no Supabase Dashboard**
2. **Teste o cadastro de contas bancárias**
3. **Teste o cadastro de categorias**
4. **Verifique a integração no Fluxo de Caixa**
5. **Configure os dados da sua empresa**

## 🆘 Suporte

Se encontrar algum problema:
1. Verifique se todas as tabelas foram criadas no Supabase
2. Confirme se as políticas RLS foram aplicadas
3. Teste com um usuário logado no sistema
4. Verifique o console do navegador para erros JavaScript

**Status**: ✅ **Solução Completa Implementada** - Aguardando execução do SQL no Supabase
