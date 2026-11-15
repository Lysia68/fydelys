"use client";

// ── Membres sans réservation depuis plus de 30 jours ─────────────────────────
//
// Carte du tableau de bord (les 5 plus anciens + le TOTAL réel) et vue
// complète. Nombre de jours exact, calculé côté serveur :
// /api/dashboard/membres-inactifs (définitions dans src/lib/membres-inactifs.ts).
// Orange jusqu'à un an, rouge au-delà.

import React, { useState, useEffect, useCallback } from "react";
import { C } from "./theme";
import { Card, SectionHead } from "./ui";
import { IcoX } from "./icons";

const COULEURS = {
  orange: { c: "#C2620A", bg: "#FFF1E6", bd: "#F5D3B3" },
  rouge:  { c: "#C43A3A", bg: "#FDE8E8", bd: "#F5C2C2" },
};

const jjmmaaaa = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : "";

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

/** Pastille « 312 j » / « Jamais réservé », orange ou rouge. */
function Duree({ m }) {
  const k = COULEURS[m.niveau];
  return (
    <span title={m.niveau === "rouge" ? "Plus d'un an" : "Moins d'un an"}
      style={{ fontSize: 12, fontWeight: 800, color: k.c, background: k.bg, border: `1px solid ${k.bd}`, padding: "3px 9px", borderRadius: 10, flexShrink: 0, whiteSpace: "nowrap" }}>
      {m.jours !== null ? `${m.jours} j` : "Jamais réservé"}
    </span>
  );
}

function Ligne({ m, detail }) {
  const ouvrir = () => window.dispatchEvent(new CustomEvent("fydelys:openMember", { detail: m.id }));
  const sousTitre = m.jours !== null
    ? `Dernière réservation le ${jjmmaaaa(m.derniereReservation)}`
    : m.inscritDepuis !== null ? `Inscrit il y a ${m.inscritDepuis} j` : "Date d'inscription inconnue";
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
        <div style={{ fontSize: 11, color: C.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{detail ? sousTitre : m.email}</div>
      </div>
      <Duree m={m} />
    </div>
  );
}

function Pastille({ n }) {
  return <span style={{ fontSize: 11, fontWeight: 700, padding: "1px 7px", borderRadius: 10, background: C.warnBg, color: C.warn }}>{n}</span>;
}

/** Vue complète, en surimpression (plein écran sur mobile). */
function VueComplete({ donnees, onClose, isMobile }) {
  const [filtre, setFiltre] = useState("tous"); // tous | orange | rouge
  const liste = donnees.membres.filter(m => filtre === "tous" || m.niveau === filtre);
  const nb = k => donnees.membres.filter(m => m.niveau === k).length;
  const onglet = (k, lbl) => (
    <button key={k} onClick={() => setFiltre(k)}
      style={{ fontSize: 12, padding: "5px 12px", borderRadius: 16, border: `1px solid ${filtre === k ? C.accent : C.border}`, background: filtre === k ? C.accent : C.surface, color: filtre === k ? "#fff" : C.textMid, fontWeight: 600, cursor: "pointer" }}>
      {lbl}
    </button>
  );
  return (
    <div onClick={e => e.target === e.currentTarget && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(42,31,20,.45)", zIndex: 800, display: "flex", alignItems: isMobile ? "stretch" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 }}>
      <div role="dialog" aria-label="Membres sans réservation"
        style={{ background: C.surface, borderRadius: isMobile ? 0 : 16, width: "100%", maxWidth: 640, maxHeight: isMobile ? "100%" : "85vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: `1.5px solid ${C.border}`, background: C.surfaceWarm, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: C.text, display: "flex", alignItems: "center", gap: 6 }}>
            😴 Sans réservation depuis plus de 30 jours <Pastille n={donnees.total} />
          </span>
          <button onClick={onClose} aria-label="Fermer" style={{ background: "none", border: `1.5px solid ${C.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", display: "flex" }}><IcoX s={16} c={C.textSoft} /></button>
        </div>
        <div style={{ padding: "10px 16px", display: "flex", gap: 6, flexWrap: "wrap", borderBottom: `1px solid ${C.borderSoft}` }}>
          {onglet("tous", `Tous (${donnees.total})`)}
          {onglet("orange", `Moins d'un an (${nb("orange")})`)}
          {onglet("rouge", `Plus d'un an (${nb("rouge")})`)}
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {liste.length === 0
            ? <div style={{ padding: "28px 16px", textAlign: "center", color: C.textMuted, fontSize: 14, fontStyle: "italic" }}>Aucun membre dans cette catégorie</div>
            : liste.map(m => <Ligne key={m.id} m={m} detail />)}
        </div>
      </div>
    </div>
  );
}

export function MembresInactifs({ inactifs, isMobile }) {
  const [ouvert, setOuvert] = useState(false);
  const { etat, total, membres, recharger } = inactifs;

  if (etat === "chargement" || (etat === "ok" && total === 0)) return null; // comme avant : carte absente sans inactif
  return (
    <>
      <Card noPad>
        <SectionHead action={etat === "ok" ? (
          <button onClick={() => setOuvert(true)} style={{ fontSize: 12, fontWeight: 700, color: C.accent, background: C.accentBg, border: `1px solid ${C.accent}40`, borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}>
            Voir tout ({total})
          </button>
        ) : null}>
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>😴 Sans réservation depuis 30j {etat === "ok" && <Pastille n={total} />}</span>
        </SectionHead>
        {etat === "erreur" ? (
          <div style={{ padding: "18px 16px", textAlign: "center", fontSize: 13, color: C.warn }}>
            Impossible de charger la liste.{" "}
            <button onClick={recharger} style={{ fontSize: 12, fontWeight: 700, color: C.accent, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Réessayer</button>
          </div>
        ) : membres.slice(0, 5).map(m => <Ligne key={m.id} m={m} />)}
      </Card>
      {ouvert && <VueComplete donnees={{ total, membres }} onClose={() => setOuvert(false)} isMobile={isMobile} />}
    </>
  );
}
