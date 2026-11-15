"use client";

// ── Widget « Présences validées » ────────────────────────────────────────────
//
// Une seule série : les présences VALIDÉES (réservation confirmée + présence
// pointée). La série « inscrits » a été retirée le 15/11/2026, à la demande.
// Les agrégats viennent de /api/dashboard/stats-presences (calcul serveur,
// sous RLS) — voir src/lib/stats-presences.ts pour la définition exacte.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { C } from "./theme";
import { Card } from "./ui";
import { IcoBarChart2 } from "./icons";
import { aujourdhuiParis, libelleSemaine, infobulleSemaine } from "@/lib/stats-presences";

const MOIS = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const COUL_VALIDES = C.ok; // accent vert : présence validée

/**
 * Charge les stats du mois choisi. `precedente` (carte « Validés semaine
 * précédente » : semaine ISO + nombre de validés) garde la dernière valeur
 * connue pendant un rechargement.
 */
export function useStatsPresences(studioId) {
  const auj = aujourdhuiParis();
  const [periode, setPeriode] = useState({ annee: Number(auj.slice(0, 4)), mois: Number(auj.slice(5, 7)) });
  const [etat, setEtat] = useState("chargement"); // chargement | ok | erreur
  const [donnees, setDonnees] = useState(null);
  const [precedente, setPrecedente] = useState(null);
  const [essai, setEssai] = useState(0);
  const enCours = useRef(null);

  useEffect(() => {
    if (!studioId) return;
    enCours.current?.abort();
    const ctrl = new AbortController();
    enCours.current = ctrl;
    setEtat("chargement");
    fetch(`/api/dashboard/stats-presences?studioId=${encodeURIComponent(studioId)}&annee=${periode.annee}&mois=${periode.mois}`, { signal: ctrl.signal })
      .then(async r => {
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error || `Erreur ${r.status}`);
        return j;
      })
      .then(j => {
        setDonnees(j);
        setPrecedente(j.semainePrecedente ?? null);
        setEtat("ok");
      })
      .catch(e => {
        // Abandon (filtre change, ecran quitte) : on n'affiche rien.
        if (e?.name === "AbortError") return;
        setEtat("erreur");
      });
    return () => ctrl.abort();
  }, [studioId, periode.annee, periode.mois, essai]);

  const recharger = useCallback(() => setEssai(n => n + 1), []);
  return { etat, donnees, periode, setPeriode, recharger, precedente };
}

const selectStyle = {
  fontSize: 13, padding: "5px 8px", borderRadius: 8, border: `1px solid ${C.border}`,
  background: C.surface, color: C.text, cursor: "pointer",
};

function Message({ children, ton = "neutre", action }) {
  return (
    <div style={{ padding: "32px 16px", textAlign: "center" }}>
      <div style={{ fontSize: 14, color: ton === "erreur" ? C.warn : C.textMuted, fontStyle: ton === "erreur" ? "normal" : "italic" }}>{children}</div>
      {action}
    </div>
  );
}

function Graphique({ semaines, isMobile }) {
  const max = Math.max(1, ...semaines.map(s => s.valides));
  const H = isMobile ? 110 : 140;
  // Responsive : les colonnes se PARTAGENT la largeur (flex 1 1 0, minWidth 0)
  // au lieu d'imposer 56 px chacune ; et le libelle « S41 · 05–11/10 » passe
  // sur deux lignes (« S41 » / « 05–11/10 »). Sur une seule ligne, il
  // debordait de sa colonne sur mobile : libelles superposes et defilement
  // horizontal (capture du 15/11/2026).
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: isMobile ? 4 : 12, padding: "8px 0 0" }}>
      {semaines.map(s => {
        const info = `${infobulleSemaine(s)}\nPrésences validées : ${s.valides}`;
        const [numero, jours] = libelleSemaine(s).split(" · ");
        return (
          <div key={s.lundi} title={info} style={{ flex: "1 1 0", minWidth: 0, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: H + 18 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: C.ok, marginBottom: 2 }}>{s.valides}</span>
              <div style={{ width: isMobile ? 18 : 28, maxWidth: "70%", height: Math.round((s.valides / max) * H), minHeight: s.valides > 0 ? 2 : 0, background: COUL_VALIDES, borderRadius: "4px 4px 0 0" }} />
            </div>
            <div style={{ borderTop: `1px solid ${C.border}`, alignSelf: "stretch" }} />
            <div style={{ marginTop: 5, textAlign: "center", lineHeight: 1.25, cursor: "help", maxWidth: "100%" }}>
              <div style={{ fontSize: isMobile ? 10 : 11, fontWeight: 700, color: C.textMid }}>{numero}{s.tronquee ? "*" : ""}</div>
              {/* Sur mobile, sans « /MM » : le mois est celui du filtre (les semaines sont bornees au mois). */}
              <div style={{ fontSize: isMobile ? 10 : 11, color: C.textSoft, whiteSpace: "nowrap", textDecoration: s.tronquee ? "underline dotted" : "none" }}>{isMobile ? jours.replace(/\/\d{2}$/, "") : jours}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function StatsPresences({ stats, isMobile }) {
  const { etat, donnees, periode, setPeriode, recharger } = stats;
  const anneeCourante = Number(aujourdhuiParis().slice(0, 4));
  const annees = Array.from({ length: 5 }, (_, i) => anneeCourante - 4 + i);
  const semaines = donnees?.semaines || [];
  const totalV = semaines.reduce((a, s) => a + s.valides, 0);
  const tronquees = semaines.some(s => s.tronquee);

  return (
    <Card noPad style={{ marginBottom: isMobile ? 12 : 16 }}>
      <div style={{ padding: "12px 16px", borderBottom: `1.5px solid ${C.border}`, background: C.surfaceWarm, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, fontWeight: 700, color: C.text }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: C.bg, border: `1px solid ${C.border}`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <IcoBarChart2 s={15} c={C.ok} />
          </span>
          Présences validées
        </span>
        <span style={{ display: "flex", gap: 6 }}>
          <select aria-label="Mois" value={periode.mois} onChange={e => setPeriode(p => ({ ...p, mois: Number(e.target.value) }))} style={selectStyle}>
            {MOIS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select aria-label="Année" value={periode.annee} onChange={e => setPeriode(p => ({ ...p, annee: Number(e.target.value) }))} style={selectStyle}>
            {annees.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </span>
      </div>

      <div style={{ padding: isMobile ? "10px 12px 14px" : "14px 18px 18px" }}>
        {etat === "chargement" && <Message>Chargement…</Message>}
        {etat === "erreur" && (
          <Message ton="erreur" action={
            <button onClick={recharger} style={{ marginTop: 10, fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}40`, borderRadius: 7, padding: "6px 14px", cursor: "pointer" }}>
              Réessayer
            </button>
          }>
            Impossible de charger les statistiques.
          </Message>
        )}
        {/* Le graphique s'arrete a la semaine precedente : un mois futur, ou le
            debut du mois en cours, n'a encore aucune semaine terminee. */}
        {etat === "ok" && semaines.length === 0 && <Message>Aucune semaine terminée sur la période</Message>}
        {etat === "ok" && semaines.length > 0 && donnees?.nbSeances === 0 && <Message>Aucune séance sur la période</Message>}
        {etat === "ok" && semaines.length > 0 && donnees?.nbSeances > 0 && (
          <>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", fontSize: 12, color: C.textSoft, marginBottom: 6 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: COUL_VALIDES }} />Total du mois : <b style={{ color: C.ok }}>{totalV}</b>
              </span>
            </div>
            <Graphique semaines={semaines} isMobile={isMobile} />
            {tronquees && (
              <div style={{ fontSize: 11, color: C.textMuted, marginTop: 8 }}>
                * Semaine à cheval sur deux mois : seuls les jours de {MOIS[periode.mois - 1]} sont comptés (détail au survol).
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
}
