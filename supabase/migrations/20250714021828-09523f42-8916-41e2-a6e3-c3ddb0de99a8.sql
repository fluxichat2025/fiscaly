-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'colaborador');

-- Create enum for company types
CREATE TYPE public.company_type AS ENUM ('ME', 'EPP', 'MEI', 'LTDA', 'SA', 'EIRELI');

-- Create enum for tax regimes
CREATE TYPE public.tax_regime AS ENUM ('simples_nacional', 'lucro_presumido', 'lucro_real', 'mei');

-- Create enum for invoice status
CREATE TYPE public.invoice_status AS ENUM ('rascunho', 'emitida', 'cancelada', 'erro');

-- Create profiles table for user management
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'colaborador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create companies/prestadores table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cnpj_cpf TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  socios TEXT[], -- Array of partner names
  data_abertura DATE,
  cep TEXT,
  tipo_logradouro TEXT,
  logradouro TEXT,
  numero TEXT,
  bairro TEXT,
  cidade TEXT,
  estado_uf TEXT,
  codigo_municipio TEXT,
  inscricao_municipal TEXT,
  cnae TEXT,
  atividade_principal TEXT,
  company_type company_type,
  situacao_cadastral TEXT,
  descricao TEXT,
  servicos TEXT[], -- Array of up to 7 services
  tributacao_nacional TEXT,
  aliquota DECIMAL(5,2),
  iss_retido BOOLEAN DEFAULT false,
  natureza_operacao TEXT,
  regime_especial_tributacao TEXT,
  optante_simples_nacional BOOLEAN DEFAULT false,
  incentivador_cultural BOOLEAN DEFAULT false,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_nota TEXT NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  valor_total DECIMAL(12,2) NOT NULL,
  descricao_servicos TEXT NOT NULL,
  data_emissao DATE NOT NULL DEFAULT CURRENT_DATE,
  status invoice_status NOT NULL DEFAULT 'rascunho',
  webhook_sent BOOLEAN DEFAULT false,
  webhook_sent_at TIMESTAMP WITH TIME ZONE,
  n8n_response JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create security definer function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Only authenticated users can insert profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Companies policies (only admins can create, all authenticated users can view)
CREATE POLICY "All authenticated users can view companies" 
ON public.companies 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Only admins can create companies" 
ON public.companies 
FOR INSERT 
TO authenticated 
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can update companies" 
ON public.companies 
FOR UPDATE 
TO authenticated 
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Only admins can delete companies" 
ON public.companies 
FOR DELETE 
TO authenticated 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Invoices policies (all authenticated users can manage invoices)
CREATE POLICY "All authenticated users can view invoices" 
ON public.invoices 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can create invoices" 
ON public.invoices 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "All authenticated users can update invoices" 
ON public.invoices 
FOR UPDATE 
TO authenticated 
USING (true);

CREATE POLICY "All authenticated users can delete invoices" 
ON public.invoices 
FOR DELETE 
TO authenticated 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Usuário'),
    NEW.email,
    CASE 
      WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin'::public.user_role
      ELSE 'colaborador'::public.user_role
    END
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_companies_cnpj_cpf ON public.companies(cnpj_cpf);
CREATE INDEX idx_companies_created_by ON public.companies(created_by);
CREATE INDEX idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX idx_invoices_created_by ON public.invoices(created_by);
CREATE INDEX idx_invoices_data_emissao ON public.invoices(data_emissao);
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);