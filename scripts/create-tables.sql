-- Script para criar tabelas de configuração diretamente no Supabase
-- Execute este SQL no SQL Editor do Supabase Dashboard

-- 1) Create categories table for income/expense categorization
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

-- 2) Create cost_centers table
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

-- 3) Create company_info table for user company information
CREATE TABLE IF NOT EXISTS public.company_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Dados básicos
  razao_social TEXT,
  nome_fantasia TEXT,
  cnpj TEXT,
  logo_url TEXT,
  
  -- Endereço
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  
  -- Contatos
  telefone TEXT,
  email_corporativo TEXT,
  website TEXT,
  
  -- Dados fiscais
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  
  -- Dados bancários
  banco_principal TEXT,
  agencia TEXT,
  conta TEXT,
  
  -- Informações adicionais
  atividade_principal TEXT,
  capital_social DECIMAL(15,2),
  data_abertura DATE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  UNIQUE(user_id)
);

-- 4) Create audit_logs table for system audit trail
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

-- 5) Create app_settings table for application configuration
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

-- 6) Create user_preferences table for user-specific settings
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
CREATE INDEX IF NOT EXISTS idx_categories_created_by ON public.categories(created_by);

CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON public.cost_centers(active);
CREATE INDEX IF NOT EXISTS idx_cost_centers_created_by ON public.cost_centers(created_by);
CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON public.cost_centers(code);

CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON public.company_info(user_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);

CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Insert default categories
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

-- Insert default app settings
INSERT INTO public.app_settings (key, value, description, category, is_public) VALUES
  ('app_name', '"Fiscalia"', 'Nome da aplicação', 'general', true),
  ('app_version', '"2.0.0"', 'Versão da aplicação', 'general', true),
  ('maintenance_mode', 'false', 'Modo de manutenção', 'system', false),
  ('max_file_size', '10485760', 'Tamanho máximo de arquivo em bytes (10MB)', 'uploads', false),
  ('allowed_file_types', '["pdf", "jpg", "jpeg", "png", "doc", "docx", "xls", "xlsx"]', 'Tipos de arquivo permitidos', 'uploads', false)
ON CONFLICT (key) DO NOTHING;
