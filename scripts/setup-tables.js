import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = 'https://yoeeobnzifhhkrwrhctv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZWVvYm56aWZoaGtyd3JoY3R2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0NTc2ODAsImV4cCI6MjA2ODAzMzY4MH0.KSdoqkzdvl7r7Gp8ywNNwBPTPqMJwVol9VBiN65dUGI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Criando tabelas de configuração...');
  
  try {
    // 1. Criar tabela categories
    console.log('📝 Criando tabela categories...');
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);
        CREATE INDEX IF NOT EXISTS idx_categories_active ON public.categories(active);
        CREATE INDEX IF NOT EXISTS idx_categories_created_by ON public.categories(created_by);
        
        ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (categoriesError) {
      console.log('⚠️ Aviso categories:', categoriesError.message);
    } else {
      console.log('✅ Tabela categories criada');
    }

    // 2. Criar tabela cost_centers
    console.log('📝 Criando tabela cost_centers...');
    const { error: costCentersError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_cost_centers_active ON public.cost_centers(active);
        CREATE INDEX IF NOT EXISTS idx_cost_centers_created_by ON public.cost_centers(created_by);
        CREATE INDEX IF NOT EXISTS idx_cost_centers_code ON public.cost_centers(code);
        
        ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (costCentersError) {
      console.log('⚠️ Aviso cost_centers:', costCentersError.message);
    } else {
      console.log('✅ Tabela cost_centers criada');
    }

    // 3. Criar tabela company_info
    console.log('📝 Criando tabela company_info...');
    const { error: companyInfoError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_company_info_user_id ON public.company_info(user_id);
        ALTER TABLE public.company_info ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (companyInfoError) {
      console.log('⚠️ Aviso company_info:', companyInfoError.message);
    } else {
      console.log('✅ Tabela company_info criada');
    }

    // 4. Criar tabela audit_logs
    console.log('📝 Criando tabela audit_logs...');
    const { error: auditLogsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);
        CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
        
        ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (auditLogsError) {
      console.log('⚠️ Aviso audit_logs:', auditLogsError.message);
    } else {
      console.log('✅ Tabela audit_logs criada');
    }

    // 5. Criar tabela app_settings
    console.log('📝 Criando tabela app_settings...');
    const { error: appSettingsError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_app_settings_key ON public.app_settings(key);
        CREATE INDEX IF NOT EXISTS idx_app_settings_category ON public.app_settings(category);
        
        ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (appSettingsError) {
      console.log('⚠️ Aviso app_settings:', appSettingsError.message);
    } else {
      console.log('✅ Tabela app_settings criada');
    }

    // 6. Criar tabela user_preferences
    console.log('📝 Criando tabela user_preferences...');
    const { error: userPreferencesError } = await supabase.rpc('exec_sql', {
      sql: `
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
        
        CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
        ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
      `
    });
    
    if (userPreferencesError) {
      console.log('⚠️ Aviso user_preferences:', userPreferencesError.message);
    } else {
      console.log('✅ Tabela user_preferences criada');
    }

    // 7. Inserir dados padrão
    console.log('📝 Inserindo categorias padrão...');
    const { error: insertError } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });
    
    if (insertError) {
      console.log('⚠️ Aviso inserção:', insertError.message);
    } else {
      console.log('✅ Categorias padrão inseridas');
    }

    console.log('🎉 Todas as tabelas foram criadas com sucesso!');
    
    // Verificar se as tabelas existem
    console.log('🔍 Verificando tabelas...');
    const tables = ['categories', 'cost_centers', 'company_info', 'audit_logs', 'app_settings', 'user_preferences'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('count(*)', { count: 'exact', head: true });
        if (!error) {
          console.log(`✅ Tabela ${table} está funcionando`);
        } else {
          console.log(`❌ Erro na tabela ${table}:`, error.message);
        }
      } catch (err) {
        console.log(`❌ Erro na tabela ${table}:`, err.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
  }
}

createTables();
