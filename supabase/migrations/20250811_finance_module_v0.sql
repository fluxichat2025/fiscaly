-- Finance Module V0 Migration
-- 1) Extend invoice_status enum to include 'pago'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'invoice_status' AND e.enumlabel = 'pago'
  ) THEN
    ALTER TYPE public.invoice_status ADD VALUE 'pago';
  END IF;
END$$;

-- 2) Create enums for finance
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_transaction_type') THEN
    CREATE TYPE public.finance_transaction_type AS ENUM ('entrada','saida','transferencia');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'finance_status') THEN
    CREATE TYPE public.finance_status AS ENUM ('previsto','realizado');
  END IF;
END $$;

-- 3) Add finance_settings to companies (JSONB) with default
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS finance_settings JSONB;

-- Set default D+15 when null (app logic will treat null as 15 if absent)
UPDATE public.companies
SET finance_settings = COALESCE(finance_settings, jsonb_build_object('default_receivable_terms_days', 15));

-- 4) Create finance_accounts table
CREATE TABLE IF NOT EXISTS public.finance_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  opening_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 5) Create finance_transactions table
CREATE TABLE IF NOT EXISTS public.finance_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type public.finance_transaction_type NOT NULL,
  status public.finance_status NOT NULL,
  account_id UUID NOT NULL REFERENCES public.finance_accounts(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  payment_date DATE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT,
  contact TEXT,
  notes TEXT,
  attachment_url TEXT,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  transfer_group_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_fin_tx_account ON public.finance_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_fin_tx_due_date ON public.finance_transactions(due_date);
CREATE INDEX IF NOT EXISTS idx_fin_tx_status ON public.finance_transactions(status);
CREATE INDEX IF NOT EXISTS idx_fin_tx_type ON public.finance_transactions(type);
CREATE INDEX IF NOT EXISTS idx_fin_tx_invoice ON public.finance_transactions(invoice_id);

-- 6) Create finance_rules table
CREATE TABLE IF NOT EXISTS public.finance_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_text TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- 7) Storage bucket for finance attachments (private)
-- If bucket exists, do nothing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'finance-attachments'
  ) THEN
    INSERT INTO storage.buckets (id, name, public) VALUES ('finance-attachments','finance-attachments', false);
  END IF;
END $$;

