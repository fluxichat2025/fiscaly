-- Criar tabela para armazenar todas as NFSe emitidas com todos os campos da API
CREATE TABLE IF NOT EXISTS nfse_emitidas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Campos básicos
  referencia_rps TEXT UNIQUE NOT NULL,
  referencia_nfse TEXT,
  status TEXT NOT NULL,
  data_emissao TIMESTAMP WITH TIME ZONE,
  telefone TEXT,
  
  -- Dados RPS
  serie_dps TEXT,
  numero_dps TEXT,
  
  -- Dados do prestador
  cpf_cnpj_prestador TEXT,
  im_prestador TEXT,
  cod_mun_prestador TEXT,
  
  -- Dados do tomador
  cpf_cnpj_tomador TEXT,
  nome_tomador TEXT,
  nome_razao_social TEXT,
  email TEXT,
  
  -- Endereço do tomador
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  codigo_municipio TEXT,
  uf TEXT,
  cep TEXT,
  
  -- Dados do serviço
  discriminacao TEXT,
  valor_dos_servicos DECIMAL(15,2),
  aliquota DECIMAL(5,2),
  aliquota_percentual DECIMAL(5,2),
  iss_retido BOOLEAN DEFAULT FALSE,
  
  -- Códigos de atividade e tributação
  atividade_economica_principal TEXT,
  atividades_economicas_secundarias TEXT,
  item_lista_servico TEXT,
  codigo_tributario_municipio TEXT,
  
  -- Dados fiscais
  natureza_da_operacao TEXT,
  codigo_opcao_simples_nacional TEXT,
  regime_especial_tributacao TEXT,
  codigo_tributacao_nacional_iss TEXT,
  codigo_tributacao_municipal_iss TEXT,
  tributacao_iss TEXT,
  tipo_retencao_iss TEXT,
  optante_simples_nacional BOOLEAN DEFAULT FALSE,
  
  -- Arquivos e XMLs
  aquivo_danfse TEXT,
  arquivo_nfse TEXT,
  caminho_xml TEXT,
  
  -- Valores e cálculos
  desconto_incondicionado_rs DECIMAL(15,2),
  codigo_municipio_prestacao TEXT,
  municipio_prestacao TEXT,
  calculo_do_issqn TEXT,
  deducao_rs DECIMAL(15,2),
  desconto_condicionado_rs DECIMAL(15,2),
  base_calculo DECIMAL(15,2),
  valor_iss_rs DECIMAL(15,2),
  
  -- Impostos retidos
  pis DECIMAL(15,2),
  inss DECIMAL(15,2),
  csll DECIMAL(15,2),
  cofins DECIMAL(15,2),
  ir DECIMAL(15,2),
  
  -- Metadados
  empresa_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_referencia_rps ON nfse_emitidas(referencia_rps);
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_status ON nfse_emitidas(status);
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_empresa_id ON nfse_emitidas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_data_emissao ON nfse_emitidas(data_emissao);
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_cpf_cnpj_prestador ON nfse_emitidas(cpf_cnpj_prestador);
CREATE INDEX IF NOT EXISTS idx_nfse_emitidas_cpf_cnpj_tomador ON nfse_emitidas(cpf_cnpj_tomador);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_nfse_emitidas_updated_at 
    BEFORE UPDATE ON nfse_emitidas 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE nfse_emitidas IS 'Tabela para armazenar todas as NFSe emitidas com dados completos da API Focus NFe';
COMMENT ON COLUMN nfse_emitidas.referencia_rps IS 'Referência única do RPS usado na emissão';
COMMENT ON COLUMN nfse_emitidas.status IS 'Status da NFSe: autorizado, cancelado, erro_autorizacao, processando_autorizacao';
COMMENT ON COLUMN nfse_emitidas.valor_dos_servicos IS 'Valor total dos serviços prestados';
COMMENT ON COLUMN nfse_emitidas.iss_retido IS 'Indica se o ISS foi retido na fonte';
COMMENT ON COLUMN nfse_emitidas.optante_simples_nacional IS 'Indica se é optante do Simples Nacional';
