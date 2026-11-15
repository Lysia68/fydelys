"use client";

// ── Membres avec du crédit, pas venus depuis plus d'un an ────────────────────
//
// Carte du tableau de bord (à la place de « Prochaine séance » depuis le
// 15/11/2026 : les 5 plus anciens + le TOTAL réel) et vue complète, avec le
// MÊME filtre. Calcul serveur : /api/dashboard/membres-inactifs ; définitions
// dans src/lib/membres-inactifs.ts (« venir » = présence pointée ; crédit > 0 ;
// plus de 365 jours ; jamais venu : inscrit depuis plus d'un an).

import React, { useState, useEffect, useCallback } from "react";
import { C } from "./theme";
import { Card, SectionHead } from "./ui";
import { IcoX } from "./icons";

const ROUGE = { c: "#C43A3A", bg: "#FDE8E8", bd: "#F5C2C2" }
const TITRE = "Sans venir depuis plus d'un an";

const jjmmaaaa = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";
const seances = n => `${n} séance${n > 1 ? "s" : ""}`;

export function useMembresInactifs(studioId) {
  const [etat, setEtat] = useState("chargement"); // chargement | ok | erreur
  const [donnees, setDonnees] = useState({ total: 0, membres: [] });
  const [essai, setEssai] = useState(0);

  useEffect(() => {
    if (!studioId) return;
    const ctrl = new AbortController();
    setEtat("chargement");
    fetch(`/api/dashboard/membres-inactifs?studioId=${encodeURIComponent(studioId)}`, { signal: ctrl.signal })
      .then(async r => { const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error); return j; })
      .then(j => { setDonnees({ total: j.total || 0, membres: j.membres || [] }); setEtat("ok"); })
      .catch(e => { if (e?.name !== "AbortError") setEtat("erreur"); }); // abandon : rien à afficher
    return () => ctrl.abort();
  }, [studioId, essai]);

  return { etat, ...donnees, recharger: useCallback(() => setEssai(n => n + 1), []) };
}

/** Pastille « 412 j » / « Jamais venu ». Toujours rouge : plus d'un an par définition. */
function Duree({ m }) {
  return (
    <span style={{ fontSize: 12, fontWeight: 800, color: ROUGE.c, background: ROUGE.bg, border: `1px solid ${ROUGE.bd}`, padding: "3px 9px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
      {m.jours !== null ? `${m.jours} j` : "Jamais venu"}
    </span>
  );
}

function Ligne({ m, detail }) {
  const ouvrir = () => window.dispatchEvent(new CustomEvent("fydelys:openMember", { detail: m.id }));
  const quand = m.jours !== null
    ? `Dernière présence le ${jjmmaaaa(m.dernierePresence)}`
    : `Inscrit il y a ${m.inscritDepuis} j`;
  return (
    <div onClick={ouvrir} role="button" tabIndex={0} onKeyDown={e => e.key === "Enter" && ouvrir()}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderBottom: `1px solid ${C.borderSoft}`, cursor: "pointer" }}
      onMouseEnter={e => e.currentTarget.style.background = C.bg}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: C.accentBg, border: "1px solid #DFC0A0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: C.accent, flexShrink: 0 }}>
        {(m.prenom || "?")[0]}{(m.nom || "")[0]}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.prenom} {m.nom}</div>
        <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {seances(m.credits)} restante{m.credits > 1 ? "s" : ""}{detail ? ` · ${quand}` : ""}
        </div>
      </div>
      <Duree m={m} />
    </div>
  );
}

function Pastille({ n }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: ROUGE.bg, color: ROUGE.c }}>{n}</span>;
}

function Vide({ children }) {
  return <div style={{ padding: "28px 16px", textAlign: "center", color: C.textMuted, fontSize: 14, fontStyle: "italic" }}>{children}</div>;
}

/** Vue complète, en surimpression (plein écran sur mobile) — même liste que la carte. */
function VueComplete({ donnees, onClose, isMobile }) {
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(42,31,20,.45)", zIndex: 800, display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }}>
      <div role="dialog" aria-label={TITRE}
        style={{ background: C.surface, borderRadius: isMobile ? 0 : 16, width: "100%", maxWidth: 640, maxHeight: isMobile ? "100%" : "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1.5px solid ${C.border}`, background: C.surfaceWarm, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
            {TITRE} <Pastille n={donnees.total} />
          </span>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex" }}><IcoX s={16} c={C.textSoft} /></button>
        </div>
        <div style={{ padding: "8px 16px", fontSize: 12, color: C.textSoft, borderBottom: `1px solid ${C.borderSoft}` }}>
          Membres actifs avec des séances restantes, sans présence pointée depuis plus d'un an.
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {donnees.membres.map(m => <Ligne key={m.id} m={m} detail />)}
        </div>
      </div>
    </div>
  );
}

export function MembresInactifs({ inactifs, isMobile }) {
  const [ouvert, setOuvert] = useState(false);
  const { etat, total, membres, recharger } = inactifs;

  return (
    <>
      <Card noPad>
        <SectionHead action={etat === "ok" && total > 0 ? (
          <button onClick={() => setOuvert(true)} style={{ fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}40`, borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>
            Voir tout ({total})
          </button>
        ) : null}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>{TITRE} {etat === "ok" && total > 0 && <Pastille n={total} />}</span>
        </SectionHead>
        {etat === "chargement" && <Vide>Chargement…</Vide>}
        {etat === "erreur" && (
          <div style={{ padding: "18px 16px", textAlign: "center", fontSize: 13, color: C.warn }}>
            Impossible de charger la liste.{" "}
            <button onClick={recharger} style={{ fontSize: 12, fontWeight: 700, color: C.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Réessayer</button>
          </div>
        )}
        {etat === "ok" && total === 0 && <Vide>Aucun membre avec des séances restantes absent depuis plus d'un an</Vide>}
        {etat === "ok" && membres.slice(0, 5).map(m => <Ligne key={m.id} m={m} />)}
      </Card>
      {ouvert && <VueComplete donnees={{ total, membres }} onClose={() => setOuvert(false)} isMobile={isMobile} />}
    </>
  );
}
