-- Criar tabela para notícias contábeis
CREATE TABLE IF NOT EXISTS public.noticias_contabeis (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    resumo TEXT,
    conteudo TEXT,
    data_publicacao TIMESTAMP WITH TIME ZONE,
    link_original TEXT NOT NULL UNIQUE,
    imagem_url TEXT,
    categoria TEXT,
    autor TEXT,
    fonte TEXT DEFAULT 'Jornal Contábil',
    status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'arquivado')),
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_noticias_data_publicacao ON public.noticias_contabeis(data_publicacao DESC);
CREATE INDEX IF NOT EXISTS idx_noticias_status ON public.noticias_contabeis(status);
CREATE INDEX IF NOT EXISTS idx_noticias_categoria ON public.noticias_contabeis(categoria);

-- Criar tabela para tarefas
CREATE TABLE IF NOT EXISTS public.tarefas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    titulo TEXT NOT NULL,
    descricao TEXT,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'cancelada')),
    prioridade TEXT DEFAULT 'media' CHECK (prioridade IN ('baixa', 'media', 'alta', 'urgente')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    data_vencimento TIMESTAMP WITH TIME ZONE,
    data_conclusao TIMESTAMP WITH TIME ZONE,
    usuario_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    empresa_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    categoria TEXT,
    tags TEXT[],
    anexos JSONB DEFAULT '[]'::jsonb,
    comentarios JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para otimizar consultas de tarefas
CREATE INDEX IF NOT EXISTS idx_tarefas_usuario_id ON public.tarefas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_empresa_id ON public.tarefas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_tarefas_status ON public.tarefas(status);
CREATE INDEX IF NOT EXISTS idx_tarefas_data_vencimento ON public.tarefas(data_vencimento);
CREATE INDEX IF NOT EXISTS idx_tarefas_prioridade ON public.tarefas(prioridade);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_noticias_contabeis_updated_at 
    BEFORE UPDATE ON public.noticias_contabeis 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tarefas_updated_at 
    BEFORE UPDATE ON public.tarefas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.noticias_contabeis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notícias (leitura pública, escrita apenas para autenticados)
CREATE POLICY "Notícias são visíveis para todos" ON public.noticias_contabeis
    FOR SELECT USING (true);

CREATE POLICY "Apenas usuários autenticados podem inserir notícias" ON public.noticias_contabeis
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Apenas usuários autenticados podem atualizar notícias" ON public.noticias_contabeis
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Políticas RLS para tarefas (apenas o usuário proprietário pode ver/editar)
CREATE POLICY "Usuários podem ver suas próprias tarefas" ON public.tarefas
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem inserir suas próprias tarefas" ON public.tarefas
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas próprias tarefas" ON public.tarefas
    FOR UPDATE USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem deletar suas próprias tarefas" ON public.tarefas
    FOR DELETE USING (auth.uid() = usuario_id);

-- Inserir algumas notícias de exemplo para teste
INSERT INTO public.noticias_contabeis (titulo, resumo, data_publicacao, link_original, categoria) VALUES
('Novas regras do eSocial entram em vigor', 'Empresas devem se adequar às mudanças no eSocial que passam a valer a partir deste mês', NOW() - INTERVAL '1 day', 'https://exemplo.com/noticia1', 'eSocial'),
('Prazo para entrega da DIRF 2024', 'Receita Federal define prazo final para entrega da Declaração do Imposto de Renda Retido na Fonte', NOW() - INTERVAL '2 days', 'https://exemplo.com/noticia2', 'Impostos'),
('Mudanças na legislação trabalhista', 'Novas alterações na CLT afetam cálculos de folha de pagamento', NOW() - INTERVAL '3 days', 'https://exemplo.com/noticia3', 'Trabalhista');

-- Inserir algumas tarefas de exemplo para teste (será associado ao primeiro usuário que fizer login)
-- Estas serão inseridas via aplicação quando houver usuários autenticados

COMMENT ON TABLE public.noticias_contabeis IS 'Tabela para armazenar notícias contábeis coletadas automaticamente';
COMMENT ON TABLE public.tarefas IS 'Tabela para sistema de tarefas dos usuários';
