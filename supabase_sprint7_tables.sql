-- ========================================
-- SPRINT 7 : TABLES POUR MONÉTISATION
-- ========================================
-- À exécuter dans le SQL Editor de Supabase
-- Tables pour gérer les crédits payants et paiements Stripe

-- ========================================
-- Table paid_plans : Crédits payants par email
-- ========================================
CREATE TABLE IF NOT EXISTS public.paid_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('single', 'pack5', 'pack30')),
  credits_remaining INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour lookup rapide par email
CREATE INDEX IF NOT EXISTS idx_paid_plans_email ON public.paid_plans(email);

-- Activer RLS
ALTER TABLE public.paid_plans ENABLE ROW LEVEL SECURITY;

-- Policy : Accès via SERVICE ROLE uniquement (pas de lecture client)
CREATE POLICY "paid_plans_service_role_only"
ON public.paid_plans
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- ========================================
-- Table payments : Historique des paiements Stripe
-- ========================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'eur',
  plan_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index pour lookup par email
CREATE INDEX IF NOT EXISTS idx_payments_email ON public.payments(email);

-- Activer RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Policy : Accès via SERVICE ROLE uniquement
CREATE POLICY "payments_service_role_only"
ON public.payments
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- ========================================
-- Fonction trigger pour updated_at
-- ========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour paid_plans
DROP TRIGGER IF EXISTS update_paid_plans_updated_at ON public.paid_plans;
CREATE TRIGGER update_paid_plans_updated_at
BEFORE UPDATE ON public.paid_plans
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Vérification
-- ========================================
-- Exécuter ces requêtes après pour vérifier que tout est OK :
-- SELECT * FROM public.paid_plans LIMIT 1;
-- SELECT * FROM public.payments LIMIT 1;

