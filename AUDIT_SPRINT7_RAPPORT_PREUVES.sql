-- ================================================================================
-- RAPPORT DE PREUVES SPRINT 7 - À EXÉCUTER DANS SUPABASE SQL EDITOR
-- ================================================================================
-- Date : 2025-12-10
-- Auditeur : Gemini
-- Environnement : Production
-- ================================================================================

-- ================================================================================
-- PREUVE N°1 : STRUCTURE DES TABLES (Conformité Schema)
-- ================================================================================
-- Objectif : Vérifier que les tables subscriptions et payments existent
--            et que paid_plans a été supprimé

SELECT 
    'PREUVE N°1 - TABLES EXISTANTES' as test_name,
    table_name,
    CASE 
        WHEN table_name IN ('subscriptions', 'payments') THEN '✅ CONFORME'
        WHEN table_name = 'paid_plans' THEN '🔴 ERREUR: Table obsolète encore présente'
        ELSE '⚠️  Table non attendue'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'payments', 'paid_plans')
ORDER BY table_name;

-- Détail du schéma de subscriptions
SELECT 
    'PREUVE N°1A - COLONNES SUBSCRIPTIONS' as test_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'plan_type', 'credits', 'credits_consumed', 
                             'valid_until', 'status', 'stripe_customer_id', 
                             'stripe_subscription_id', 'metadata', 'created_at', 'updated_at') 
        THEN '✅ CONFORME'
        ELSE '⚠️  Colonne non documentée'
    END as conformity
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'subscriptions'
ORDER BY ordinal_position;

-- Détail du schéma de payments
SELECT 
    'PREUVE N°1B - COLONNES PAYMENTS' as test_name,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_name IN ('id', 'user_id', 'stripe_customer_id', 'stripe_payment_intent_id',
                             'stripe_checkout_session_id', 'amount_cents', 'currency', 
                             'plan_type', 'credits', 'valid_until', 'status', 'raw_event', 
                             'created_at', 'updated_at') 
        THEN '✅ CONFORME'
        ELSE '⚠️  Colonne non documentée'
    END as conformity
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'payments'
ORDER BY ordinal_position;

-- ================================================================================
-- PREUVE N°2 : SÉCURITÉ RLS (Row Level Security)
-- ================================================================================
-- Objectif : Vérifier que les policies RLS sont actives et correctes

-- Vérification activation RLS
SELECT 
    'PREUVE N°2A - RLS ACTIVÉ' as test_name,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity = true THEN '✅ CONFORME'
        ELSE '🔴 ERREUR: RLS désactivé'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('subscriptions', 'payments');

-- Liste des policies RLS sur subscriptions
SELECT 
    'PREUVE N°2B - POLICIES SUBSCRIPTIONS' as test_name,
    policyname,
    cmd as command,
    qual as using_expression,
    with_check as check_expression,
    roles,
    CASE 
        WHEN policyname = 'service_role_full_access_subscriptions' THEN '✅ CONFORME: Service Role Full Access'
        WHEN policyname = 'user_select_own_subscriptions' THEN '✅ CONFORME: User SELECT own data'
        ELSE '⚠️  Policy non documentée'
    END as conformity
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'subscriptions'
ORDER BY policyname;

-- Liste des policies RLS sur payments
SELECT 
    'PREUVE N°2C - POLICIES PAYMENTS' as test_name,
    policyname,
    cmd as command,
    roles,
    CASE 
        WHEN policyname = 'service_role_full_access_payments' THEN '✅ CONFORME: Service Role Full Access'
        WHEN policyname = 'user_select_own_payments' THEN '✅ CONFORME: User SELECT own data'
        ELSE '⚠️  Policy non documentée'
    END as conformity
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'payments'
ORDER BY policyname;

-- ================================================================================
-- PREUVE N°4 : PREUVE DE VIE (Live Data)
-- ================================================================================
-- Objectif : Afficher les données réelles des subscriptions et paiements

-- Toutes les subscriptions actives
SELECT 
    'PREUVE N°4A - SUBSCRIPTIONS ACTIVES' as test_name,
    s.id,
    s.user_id,
    u.email,
    s.plan_type,
    s.credits,
    s.credits_consumed,
    s.valid_until,
    s.status,
    s.created_at,
    CASE 
        WHEN s.plan_type = 'FREE' AND s.credits = 0 THEN '✅ Plan FREE correct'
        WHEN s.plan_type = 'SINGLE' AND s.credits >= 0 AND s.credits <= 1 THEN '✅ Plan SINGLE correct'
        WHEN s.plan_type = 'PACK' AND s.credits >= 0 AND s.credits <= 5 THEN '✅ Plan PACK correct'
        WHEN s.plan_type = 'UNLIMITED' AND s.credits IS NULL THEN '✅ Plan UNLIMITED correct'
        ELSE '⚠️  Vérifier les crédits'
    END as validation
FROM public.subscriptions s
LEFT JOIN auth.users u ON u.id = s.user_id
ORDER BY s.created_at DESC
LIMIT 20;

-- Tous les paiements récents
SELECT 
    'PREUVE N°4B - PAIEMENTS RÉCENTS' as test_name,
    p.id,
    p.user_id,
    u.email,
    p.plan_type,
    p.amount_cents,
    p.currency,
    p.credits,
    p.status,
    p.stripe_checkout_session_id,
    p.created_at,
    CASE 
        WHEN p.plan_type = 'SINGLE' AND p.credits = 1 AND p.amount_cents = 490 THEN '✅ Paiement SINGLE correct'
        WHEN p.plan_type = 'PACK' AND p.credits = 5 AND p.amount_cents = 1490 THEN '✅ Paiement PACK correct'
        WHEN p.plan_type = 'UNLIMITED' AND p.credits IS NULL AND p.amount_cents = 5900 THEN '✅ Paiement UNLIMITED correct'
        ELSE '⚠️  Vérifier le montant/crédits'
    END as validation
FROM public.payments p
LEFT JOIN auth.users u ON u.id = p.user_id
ORDER BY p.created_at DESC
LIMIT 20;

-- ================================================================================
-- PREUVE N°4C : VÉRIFICATION FONCTION RPC
-- ================================================================================
-- Objectif : Confirmer que la fonction consume_credit existe

SELECT 
    'PREUVE N°4C - FONCTION RPC CONSUME_CREDIT' as test_name,
    routine_name,
    routine_type,
    data_type as return_type,
    security_type,
    CASE 
        WHEN routine_name = 'consume_credit' AND data_type = 'jsonb' THEN '✅ CONFORME'
        ELSE '⚠️  À vérifier'
    END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name = 'consume_credit';

-- ================================================================================
-- PREUVE N°4D : VÉRIFICATION TRIGGER AUTO-FREE
-- ================================================================================
-- Objectif : Confirmer que le trigger handle_new_user existe

SELECT 
    'PREUVE N°4D - TRIGGER AUTO-FREE' as test_name,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement,
    CASE 
        WHEN trigger_name = 'on_auth_user_created' THEN '✅ CONFORME'
        ELSE '⚠️  À vérifier'
    END as status
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' 
AND event_object_table = 'users'
AND trigger_name = 'on_auth_user_created';

-- ================================================================================
-- RÉSUMÉ FINAL
-- ================================================================================

SELECT 
    '🎯 RÉSUMÉ AUDIT SPRINT 7' as rapport,
    COUNT(*) FILTER (WHERE table_name = 'subscriptions') as table_subscriptions_ok,
    COUNT(*) FILTER (WHERE table_name = 'payments') as table_payments_ok,
    COUNT(*) FILTER (WHERE table_name = 'paid_plans') as table_paid_plans_obsolete,
    CASE 
        WHEN COUNT(*) FILTER (WHERE table_name = 'paid_plans') > 0 THEN '🔴 ÉCHEC: Table obsolète présente'
        WHEN COUNT(*) FILTER (WHERE table_name = 'subscriptions') = 0 THEN '🔴 ÉCHEC: Table subscriptions manquante'
        WHEN COUNT(*) FILTER (WHERE table_name = 'payments') = 0 THEN '🔴 ÉCHEC: Table payments manquante'
        ELSE '✅ SUCCÈS COMPLET'
    END as statut_final
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('subscriptions', 'payments', 'paid_plans');

