-- Adicionar campos para arquivos e certificado digital na tabela companies
ALTER TABLE public.companies 
ADD COLUMN xml_nfse_url TEXT,
ADD COLUMN cartao_cnpj_url TEXT,
ADD COLUMN cartao_inscricao_municipal_url TEXT,
ADD COLUMN certificado_digital_base64 TEXT,
ADD COLUMN senha_certificado TEXT,
ADD COLUMN focus_nfe_empresa_id INTEGER,
ADD COLUMN focus_nfe_token_homologacao TEXT,
ADD COLUMN focus_nfe_token_producao TEXT,
ADD COLUMN focus_nfe_habilitado BOOLEAN DEFAULT false;

-- Criar bucket para armazenar documentos das empresas
INSERT INTO storage.buckets (id, name, public) 
VALUES ('company-documents', 'company-documents', false);

-- Políticas para o bucket company-documents
CREATE POLICY "Authenticated users can view company documents" 
ON storage.objects 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can upload company documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can update their company documents" 
ON storage.objects 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND bucket_id = 'company-documents');

CREATE POLICY "Authenticated users can delete their company documents" 
ON storage.objects 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND bucket_id = 'company-documents');

-- Comentários para documentação
COMMENT ON COLUMN public.companies.xml_nfse_url IS 'URL do arquivo XML da NFSe para preenchimento automático';
COMMENT ON COLUMN public.companies.cartao_cnpj_url IS 'URL do arquivo do cartão CNPJ';
COMMENT ON COLUMN public.companies.cartao_inscricao_municipal_url IS 'URL do arquivo do cartão da Inscrição Municipal';
COMMENT ON COLUMN public.companies.certificado_digital_base64 IS 'Certificado digital em base64 para Focus NFe';
COMMENT ON COLUMN public.companies.senha_certificado IS 'Senha do certificado digital';
COMMENT ON COLUMN public.companies.focus_nfe_empresa_id IS 'ID da empresa no Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_token_homologacao IS 'Token de homologação do Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_token_producao IS 'Token de produção do Focus NFe';
COMMENT ON COLUMN public.companies.focus_nfe_habilitado IS 'Indica se a integração com Focus NFe está habilitada';