-- Criar tabela companies para prestadores de serviÃ§o
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cnpj_cpf TEXT NOT NULL UNIQUE,
  inscricao_estadual TEXT,
  inscricao_municipal TEXT,
  email TEXT,
  telefone TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  uf TEXT,
  cep TEXT,
  codigo_municipio TEXT,
  situacao_cadastral TEXT DEFAULT 'Ativa',
  optante_simples_nacional BOOLEAN DEFAULT false,
  incentivador_cultural BOOLEAN DEFAULT false,

  -- Campos Focus NFe
  focus_nfe_empresa_id TEXT,
  focus_nfe_token_homologacao TEXT,
  focus_nfe_token_producao TEXT,
  focus_nfe_habilitado BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar tabela para armazenar histÃ³rico de NFSe emitidas
CREATE TABLE IF NOT EXISTS public.nfse_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  focus_ref TEXT NOT NULL UNIQUE,
  numero_nfse TEXT,
  codigo_verificacao TEXT,
  status TEXT NOT NULL DEFAULT 'processando_autorizacao',
  data_emissao DATE,
  valor_total DECIMAL(10,2),
  tomador_nome TEXT,
  tomador_documento TEXT,
  servico_descricao TEXT,
  url_pdf TEXT,
  url_xml TEXT,
  mensagem_sefaz TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Criar Ã­ndices para melhor performance
CREATE INDEX IF NOT EXISTS idx_nfse_history_company_id ON public.nfse_history(company_id);
CREATE INDEX IF NOT EXISTS idx_nfse_history_focus_ref ON public.nfse_history(focus_ref);
CREATE INDEX IF NOT EXISTS idx_nfse_history_status ON public.nfse_history(status);
CREATE INDEX IF NOT EXISTS idx_nfse_history_data_emissao ON public.nfse_history(data_emissao);

-- Criar funÃ§Ã£o para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar trigger para atualizar updated_at na tabela nfse_history
CREATE TRIGGER update_nfse_history_updated_at 
    BEFORE UPDATE ON public.nfse_history 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) para a tabela nfse_history
ALTER TABLE public.nfse_history ENABLE ROW LEVEL SECURITY;

-- PolÃ­tica para permitir que usuÃ¡rios vejam apenas NFSe de suas empresas
CREATE POLICY "Users can view NFSe from their companies" ON public.nfse_history
    FOR SELECT USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE created_by = auth.uid()
        )
    );

-- PolÃ­tica para permitir que usuÃ¡rios insiram NFSe apenas em suas empresas
CREATE POLICY "Users can insert NFSe for their companies" ON public.nfse_history
    FOR INSERT WITH CHECK (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE created_by = auth.uid()
        )
    );

-- PolÃ­tica para permitir que usuÃ¡rios atualizem NFSe apenas de suas empresas
CREATE POLICY "Users can update NFSe from their companies" ON public.nfse_history
    FOR UPDATE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE created_by = auth.uid()
        )
    );

-- PolÃ­tica para permitir que usuÃ¡rios excluam NFSe apenas de suas empresas
CREATE POLICY "Users can delete NFSe from their companies" ON public.nfse_history
    FOR DELETE USING (
        company_id IN (
            SELECT id FROM public.companies 
            WHERE created_by = auth.uid()
        )
    );

-- ComentÃ¡rios para documentaÃ§Ã£o
COMMENT ON COLUMN public.companies.focus_nfe_empresa_id IS 'ID da empresa na Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_token_homologacao IS 'Token de homologaÃ§Ã£o da Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_token_producao IS 'Token de produÃ§Ã£o da Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_habilitado IS 'Indica se a empresa estÃ¡ habilitada para usar Focus NFe';

COMMENT ON TABLE public.nfse_history IS 'HistÃ³rico de NFSe emitidas atravÃ©s da Focus NFe';
COMMENT ON COLUMN public.nfse_history.focus_ref IS 'ReferÃªncia Ãºnica da NFSe na Focus NFe';
COMMENT ON COLUMN public.nfse_history.numero_nfse IS 'NÃºmero da NFSe autorizada';
COMMENT ON COLUMN public.nfse_history.codigo_verificacao IS 'CÃ³digo de verificaÃ§Ã£o da NFSe';
COMMENT ON COLUMN public.nfse_history.status IS 'Status da NFSe (processando_autorizacao, autorizado, erro_autorizacao, cancelado)';
COMMENT ON COLUMN public.nfse_history.tomador_nome IS 'Nome/RazÃ£o social do tomador do serviÃ§o';
COMMENT ON COLUMN public.nfse_history.tomador_documento IS 'CNPJ/CPF do tomador do serviÃ§o';
COMMENT ON COLUMN public.nfse_history.servico_descricao IS 'DescriÃ§Ã£o do serviÃ§o prestado';
COMMENT ON COLUMN public.nfse_history.url_pdf IS 'URL para download do PDF da NFSe';
COMMENT ON COLUMN public.nfse_history.url_xml IS 'URL para download do XML da NFSe';
