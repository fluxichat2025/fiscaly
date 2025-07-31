-- Criar tabela para histórico de cancelamentos de NFSe
CREATE TABLE IF NOT EXISTS historico_cancelamentos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  referencia TEXT NOT NULL,
  numero_nfse TEXT,
  motivo TEXT NOT NULL,
  justificativa TEXT NOT NULL,
  data_cancelamento TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('processando', 'cancelado', 'erro')),
  mensagem_erro TEXT,
  usuario TEXT NOT NULL,
  empresa_id UUID REFERENCES companies(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_referencia ON historico_cancelamentos(referencia);
CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_numero_nfse ON historico_cancelamentos(numero_nfse);
CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_data ON historico_cancelamentos(data_cancelamento);
CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_status ON historico_cancelamentos(status);
CREATE INDEX IF NOT EXISTS idx_historico_cancelamentos_empresa_id ON historico_cancelamentos(empresa_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE historico_cancelamentos ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas as operações para usuários autenticados
CREATE POLICY "Permitir todas as operações para usuários autenticados" ON historico_cancelamentos
  FOR ALL USING (auth.role() = 'authenticated');

-- Comentários para documentação
COMMENT ON TABLE historico_cancelamentos IS 'Histórico de cancelamentos de NFSe realizados no sistema';
COMMENT ON COLUMN historico_cancelamentos.referencia IS 'Referência da NFSe cancelada';
COMMENT ON COLUMN historico_cancelamentos.numero_nfse IS 'Número da NFSe cancelada (quando disponível)';
COMMENT ON COLUMN historico_cancelamentos.motivo IS 'Motivo do cancelamento selecionado pelo usuário';
COMMENT ON COLUMN historico_cancelamentos.justificativa IS 'Justificativa detalhada do cancelamento';
COMMENT ON COLUMN historico_cancelamentos.status IS 'Status do cancelamento: processando, cancelado ou erro';
COMMENT ON COLUMN historico_cancelamentos.mensagem_erro IS 'Mensagem de erro quando o cancelamento falha';
COMMENT ON COLUMN historico_cancelamentos.usuario IS 'Usuário que solicitou o cancelamento';
COMMENT ON COLUMN historico_cancelamentos.empresa_id IS 'ID da empresa que emitiu a NFSe';
