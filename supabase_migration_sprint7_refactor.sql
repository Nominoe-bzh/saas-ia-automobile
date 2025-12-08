-- ================================================================================
-- MIGRATION SPRINT 7 - REFACTORING MONÉTISATION
-- ================================================================================
-- Objectif : Remplacer paid_plans par subscriptions + logique conforme au BP
-- Date : 2025-12-08
-- ================================================================================

-- ================================================================================
-- ÉTAPE 1 : NETTOYAGE DES ANCIENNES TABLES
-- ================================================================================

-- Supprimer les anciennes tables non conformes
DROP TABLE IF EXISTS public.paid_plans CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;

-- ================================================================================
-- ÉTAPE 2 : CRÉATION DE LA TABLE SUBSCRIPTIONS
-- ================================================================================

CREATE TABLE public.subscriptions (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    stripe_customer_id        text,
    stripe_subscription_id    text,
    plan_type         text NOT NULL CHECK (plan_type IN ('FREE', 'SINGLE', 'PACK', 'UNLIMITED')),
    credits           integer,            -- NULL pour les plans illimités
    credits_consumed  integer NOT NULL DEFAULT 0,
    valid_until       timestamptz,        
    status            text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'incomplete', 'past_due', 'trialing', 'expired')),
    metadata          jsonb DEFAULT '{}'::jsonb,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions (user_id);
CREATE INDEX idx_subscriptions_plan_type ON public.subscriptions (plan_type);
CREATE INDEX idx_subscriptions_status ON public.subscriptions (status);

-- ================================================================================
-- ÉTAPE 3 : TRIGGER AUTO-CRÉATION PLAN FREE
-- ================================================================================

-- Fonction trigger pour créer automatiquement un plan FREE à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_type, credits, status)
  VALUES (new.id, 'FREE', 0, 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger sur auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================================================================
-- ÉTAPE 4 : CRÉATION DE LA TABLE PAYMENTS (REFACTORISÉE)
-- ================================================================================

CREATE TABLE public.payments (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
    stripe_customer_id     text,
    stripe_payment_intent_id   text,
    stripe_checkout_session_id text,
    amount_cents           integer NOT NULL,
    currency               text NOT NULL DEFAULT 'eur',
    plan_type              text NOT NULL CHECK (plan_type IN ('SINGLE', 'PACK', 'UNLIMITED')),
    credits                integer,          
    valid_until            timestamptz,      
    status                 text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
    raw_event              jsonb DEFAULT '{}'::jsonb,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);

-- Index
CREATE INDEX idx_payments_user_id ON public.payments (user_id);
CREATE INDEX idx_payments_stripe_session ON public.payments (stripe_checkout_session_id);

-- ================================================================================
-- ÉTAPE 5 : FONCTION RPC CONSUME_CREDIT (CONSOMMATION ATOMIQUE)
-- ================================================================================

CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sub public.subscriptions%ROWTYPE;
BEGIN
  -- Verrouillage de la ligne pour éviter les race conditions
  SELECT * INTO v_sub FROM public.subscriptions WHERE user_id = p_user_id FOR UPDATE;

  -- Si aucun abonnement trouvé
  IF NOT FOUND THEN
     RETURN jsonb_build_object('success', false, 'error', 'Aucun abonnement trouvé');
  END IF;

  -- 1. Cas ILLIMITÉ valide
  IF v_sub.plan_type = 'UNLIMITED' AND (v_sub.valid_until IS NULL OR v_sub.valid_until > now()) THEN
     -- Incrémenter le compteur de consommation mais ne pas décrémenter de crédits
     UPDATE public.subscriptions 
     SET credits_consumed = credits_consumed + 1,
         updated_at = now()
     WHERE user_id = p_user_id;
     RETURN jsonb_build_object('success', true, 'message', 'Plan illimité', 'unlimited', true);
  END IF;

  -- 2. Cas CRÉDITS (Single/Pack/Free)
  IF v_sub.credits IS NOT NULL AND v_sub.credits > 0 THEN
     UPDATE public.subscriptions 
     SET credits = credits - 1, 
         credits_consumed = credits_consumed + 1,
         updated_at = now()
     WHERE user_id = p_user_id;
     RETURN jsonb_build_object('success', true, 'remaining', v_sub.credits - 1, 'unlimited', false);
  END IF;

  -- 3. Échec : pas de crédits
  RETURN jsonb_build_object('success', false, 'error', 'Crédits insuffisants', 'remaining', 0);
END;
$$;

-- ================================================================================
-- ÉTAPE 6 : ACTIVATION RLS (ROW LEVEL SECURITY)
-- ================================================================================

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments      ENABLE ROW LEVEL SECURITY;

-- ================================================================================
-- ÉTAPE 7 : POLITIQUES RLS POUR SUBSCRIPTIONS
-- ================================================================================

-- Service Role : Accès complet (pour les webhooks et API backend)
CREATE POLICY "service_role_full_access_subscriptions" ON public.subscriptions
AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Users : Lecture seule de leur propre abonnement
CREATE POLICY "user_select_own_subscriptions" ON public.subscriptions
AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ================================================================================
-- ÉTAPE 8 : POLITIQUES RLS POUR PAYMENTS
-- ================================================================================

-- Service Role : Accès complet
CREATE POLICY "service_role_full_access_payments" ON public.payments
AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated Users : Lecture seule de leurs propres paiements
CREATE POLICY "user_select_own_payments" ON public.payments
AS PERMISSIVE FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ================================================================================
-- FIN DE LA MIGRATION
-- ================================================================================

-- Commentaires pour documentation
COMMENT ON TABLE public.subscriptions IS 'Table des abonnements utilisateurs avec gestion des crédits et validité';
COMMENT ON TABLE public.payments IS 'Table des paiements Stripe pour traçabilité';
COMMENT ON FUNCTION public.consume_credit IS 'Fonction RPC pour consommer un crédit de manière atomique (évite race conditions)';

