-- Receivables Module V0 Migration
-- 1) Create enums for receivables
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'receivable_status') THEN
    CREATE TYPE public.receivable_status AS ENUM ('aguardando','vencendo','atrasado','pago','parcelado','cancelado');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_method_type') THEN
    CREATE TYPE public.payment_method_type AS ENUM ('pix','boleto','manual','ted','cartao');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'collection_method') THEN
    CREATE TYPE public.collection_method AS ENUM ('whatsapp','email');
  END IF;
END $$;

-- 2) Create receivables table
CREATE TABLE IF NOT EXISTS public.receivables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  due_date DATE NOT NULL,
  gross_amount NUMERIC(12,2) NOT NULL CHECK (gross_amount >= 0),
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  interest_amount NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (interest_amount >= 0),
  net_amount NUMERIC(12,2) GENERATED ALWAYS AS (gross_amount - discount_amount + interest_amount) STORED,
  status public.receivable_status NOT NULL DEFAULT 'aguardando',
  payment_method public.payment_method_type,
  payment_link TEXT,
  qr_code TEXT,
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3) Create payment_collections table (histórico de cobranças)
CREATE TABLE IF NOT EXISTS public.payment_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
  sent_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  method public.collection_method NOT NULL,
  template_used TEXT,
  status TEXT DEFAULT 'sent',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4) Create payment_receipts table (comprovantes de pagamento)
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receivable_id UUID NOT NULL REFERENCES public.receivables(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount_received NUMERIC(12,2) NOT NULL CHECK (amount_received >= 0),
  fees NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (fees >= 0),
  attachment_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5) Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_receivables_status ON public.receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_due_date ON public.receivables(due_date);
CREATE INDEX IF NOT EXISTS idx_receivables_customer ON public.receivables(customer_name);
CREATE INDEX IF NOT EXISTS idx_receivables_invoice ON public.receivables(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_collections_receivable ON public.payment_collections(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_receivable ON public.payment_receipts(receivable_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_date ON public.payment_receipts(payment_date);

-- 6) Create trigger to update updated_at on receivables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_receivables_updated_at') THEN
    CREATE TRIGGER update_receivables_updated_at
      BEFORE UPDATE ON public.receivables
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
