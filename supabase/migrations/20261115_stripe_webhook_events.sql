-- Evenements Stripe deja traites : idempotence des webhooks sur event.id.
--
-- Stripe peut renvoyer un meme evenement (nouvelle tentative, rejeu manuel
-- depuis le tableau de bord). /api/connect/webhook et /api/stripe/webhook
-- inserent event.id ici AVANT de traiter : une 2e insertion echoue (cle
-- primaire) et l'evenement est ignore — pas de double credit. En cas d'echec
-- du traitement, la ligne est supprimee pour que la tentative suivante passe.
--
-- A appliquer A LA MAIN dans le SQL Editor de Supabase. Le code tolere son
-- absence : sans elle, il traite l'evenement et s'appuie sur le garde-fou
-- secondaire (paiement deja enregistre : member_payments.stripe_payment_id).
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  event_id    text PRIMARY KEY,
  type        text,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- Ecrite uniquement par le serveur (cle de service) : RLS active, aucune
-- policy — inaccessible aux comptes connectes.
ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;
