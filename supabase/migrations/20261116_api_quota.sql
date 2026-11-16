-- Compteur de quota partage entre les instances serverless (Albert, 16/11/2026).
--
-- La limite de debit en memoire (lib/rate-limit.ts) vit dans UNE instance
-- Vercel : d'une instance a l'autre, elle repart de zero. Ce compteur vit en
-- base, donc commun a toutes les instances.
--
-- consommer_quota(cle, fenetre_sec, max) : incremente atomiquement le compteur
-- de la fenetre en cours (fenetres fixes de `fenetre_sec` secondes) et renvoie
-- VRAI tant que le total ne depasse pas `max`.
--
-- A appliquer A LA MAIN dans le SQL Editor de Supabase. Le code tolere son
-- absence : il retombe alors sur la limite en memoire et journalise l'erreur.
CREATE TABLE IF NOT EXISTS public.api_quota (
  cle      text        NOT NULL,
  fenetre  timestamptz NOT NULL,
  nb       integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (cle, fenetre)
);

-- Ecrite uniquement par le serveur (cle de service) : RLS active, aucune policy.
ALTER TABLE public.api_quota ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.consommer_quota(p_cle text, p_fenetre_sec integer, p_max integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fenetre timestamptz := to_timestamp(floor(extract(epoch FROM now()) / p_fenetre_sec) * p_fenetre_sec);
  v_nb integer;
BEGIN
  INSERT INTO public.api_quota (cle, fenetre, nb) VALUES (p_cle, v_fenetre, 1)
  ON CONFLICT (cle, fenetre) DO UPDATE SET nb = public.api_quota.nb + 1
  RETURNING nb INTO v_nb;
  RETURN v_nb <= p_max;
END;
$$;

-- Seul le serveur l'appelle : personne d'autre ne peut consommer le quota d'un studio.
REVOKE EXECUTE ON FUNCTION public.consommer_quota(text, integer, integer) FROM PUBLIC, anon, authenticated;

-- Menage (facultatif, a lancer de temps en temps) :
--   DELETE FROM public.api_quota WHERE fenetre < now() - interval '2 days';
