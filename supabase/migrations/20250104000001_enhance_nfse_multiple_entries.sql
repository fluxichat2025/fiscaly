-- Migration to enhance NFSe configuration with multiple municipal tax codes and service items
-- This migration adds support for multiple entries while maintaining backward compatibility

-- First, let's create separate tables for the multiple entries
CREATE TABLE IF NOT EXISTS public.company_municipal_tax_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  codigo_tributario_municipio TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_service_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  item_lista_servico TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company_municipal_tax_codes_company_id ON public.company_municipal_tax_codes(company_id);
CREATE INDEX IF NOT EXISTS idx_company_service_items_company_id ON public.company_service_items(company_id);
CREATE INDEX IF NOT EXISTS idx_company_municipal_tax_codes_ativo ON public.company_municipal_tax_codes(ativo);
CREATE INDEX IF NOT EXISTS idx_company_service_items_ativo ON public.company_service_items(ativo);

-- Add RLS policies
ALTER TABLE public.company_municipal_tax_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_service_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for company_municipal_tax_codes
CREATE POLICY "Users can view their company municipal tax codes" ON public.company_municipal_tax_codes
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company municipal tax codes" ON public.company_municipal_tax_codes
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their company municipal tax codes" ON public.company_municipal_tax_codes
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company municipal tax codes" ON public.company_municipal_tax_codes
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

-- RLS policies for company_service_items
CREATE POLICY "Users can view their company service items" ON public.company_service_items
  FOR SELECT USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can insert their company service items" ON public.company_service_items
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update their company service items" ON public.company_service_items
  FOR UPDATE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete their company service items" ON public.company_service_items
  FOR DELETE USING (
    company_id IN (
      SELECT id FROM public.companies WHERE created_by = auth.uid()
    )
  );

-- Create a function to migrate existing data from the single fields to the new tables
CREATE OR REPLACE FUNCTION migrate_existing_nfse_data()
RETURNS void AS $$
DECLARE
  company_record RECORD;
BEGIN
  -- Migrate existing municipal tax codes
  FOR company_record IN 
    SELECT id, codigo_tributario_municipio 
    FROM public.companies 
    WHERE codigo_tributario_municipio IS NOT NULL AND codigo_tributario_municipio != ''
  LOOP
    INSERT INTO public.company_municipal_tax_codes (company_id, codigo_tributario_municipio, descricao)
    VALUES (company_record.id, company_record.codigo_tributario_municipio, 'Migrado automaticamente')
    ON CONFLICT DO NOTHING;
  END LOOP;

  -- Migrate existing service items
  FOR company_record IN 
    SELECT id, item_lista_servico 
    FROM public.companies 
    WHERE item_lista_servico IS NOT NULL AND item_lista_servico != ''
  LOOP
    INSERT INTO public.company_service_items (company_id, item_lista_servico, descricao)
    VALUES (company_record.id, company_record.item_lista_servico, 'Migrado automaticamente')
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration function
SELECT migrate_existing_nfse_data();

-- Drop the migration function as it's no longer needed
DROP FUNCTION migrate_existing_nfse_data();

-- Add comments for documentation
COMMENT ON TABLE public.company_municipal_tax_codes IS 'Stores multiple municipal tax codes for each company';
COMMENT ON TABLE public.company_service_items IS 'Stores multiple service list items for each company';
COMMENT ON COLUMN public.company_municipal_tax_codes.codigo_tributario_municipio IS 'Municipal tax code (CNAE municipal)';
COMMENT ON COLUMN public.company_service_items.item_lista_servico IS 'Service list item code (6 digits)';
