"use client"
import { useEffect, useState } from "react"
import StudioIntrouvable from "@/components/StudioIntrouvable"

// La VITRINE d'un studio, rendue a son adresse propre.
//
// ── Pourquoi cette route existe ───────────────────────────
// Jusqu'au 31/10/2026 ce composant vivait dans `src/app/page.tsx` et n'etait
// atteint qu'APRES hydratation : la page lisait `window.location.hostname`
// dans un `useEffect`, puis remplacait la landing par la vitrine.
//
// Donc, sur `<studio>.fydelys.fr`, le HTML servi etait la landing
// COMMERCIALE. Une adherente venue reserver son cours recevait d'abord 75 Ko
// d'argumentaire de vente — « essai gratuit », « tarifs », « votre studio » —
// avant que le JavaScript ne reprenne la main. Sur un reseau lent, ou si le
// script echouait, elle n'en sortait pas.
//
// Mot d'une adherente, le 29/10/2026 : « je tombe sur une page Fydelys qui
// essaie de me vendre un truc comme si j'etais prof de yoga ». Elle etait la
// deuxieme a le signaler.
//
// Le middleware reecrit desormais `/` vers `/studio/<slug>` sur un
// sous-domaine de studio : le serveur rend la vitrine du premier coup. La
// landing de `fydelys.fr` reste prerendue statiquement, ce qu'elle aurait
// perdu si `/` avait du lire l'hote a la demande.

// ── Icônes SVG inline ───────────────────────────────────────────────────────
const IcoPin   = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
const IcoCal   = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...(p.style||{})}}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/></svg>
const IcoClock = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IcoUser  = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const IcoDoor  = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
const IcoPhone = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0,...(p.style||{})}}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.77 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17z"/></svg>
const IcoMail  = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
const IcoGlobe = (p:any) => <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke={p.color||"currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{display:"inline-block",verticalAlign:"middle",flexShrink:0}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>

export default function StudioVitrine({ slug }: { slug: string }) {
  const [studio, setStudio] = useState<any>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/studio-public?slug=${slug}`)
      .then(r => r.json())
      .then(d => {
        if (d.redirect_login) { window.location.replace("/login"); return; }
        if (d.studio) { setStudio(d.studio); setSessions(d.sessions || []) }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#F4EFE8", fontFamily:"'Helvetica Neue',Arial,sans-serif" }}>
      <div style={{ fontSize:14, color:"#8C7B6C" }}>Chargement…</div>
    </div>
  )

  // Meme bloc que `/login` sur un sous-domaine inconnu, et volontairement le
  // MEME composant : les deux portes d'entree d'un studio doivent dire la meme
  // chose a qui se trompe d'adresse.
  if (!studio) return <StudioIntrouvable/>

  const accent = studio.accent_color || "#B07848"
  const accentBg = accent + "18"
  const today = new Date().toISOString().slice(0, 10)
  const upcomingSessions = sessions.filter((s: any) => s.session_date >= today).slice(0, 8)

  return (
    <div style={{ minHeight:"100vh", background:"#F4EFE8", fontFamily:"'Helvetica Neue',Arial,sans-serif", color:"#2A1F14" }}>
      {/* Header */}
      <div style={{ background: studio.cover_photo_url ? "none" : "#2A1F14", position:"relative", overflow:"hidden", minHeight: studio.cover_photo_url ? 320 : "auto" }}>
        {studio.cover_photo_url && (
          <img src={studio.cover_photo_url} alt={studio.name} loading="eager" decoding="async" fetchPriority="high"
            style={{ position:"absolute", inset:0, width:"100%", height:"100%", objectFit:"cover", objectPosition:"center 30%", filter:"brightness(.45)" }}/>
        )}
        <div style={{ position:"relative", padding:"80px 24px 72px", maxWidth:720, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:32, fontWeight:800, color:"#fff", letterSpacing:-0.5, marginBottom:8 }}>{studio.name}</div>
          {studio.city && <div style={{ fontSize:14, color:"rgba(255,255,255,.65)", marginBottom:16 }}><IcoPin size={14} color="rgba(255,255,255,.65)"/> <span style={{marginLeft:4}}>{studio.city}</span></div>}
          {studio.description && (
            <div style={{ fontSize:15, color:"rgba(255,255,255,.8)", lineHeight:1.7, maxWidth:500, margin:"0 auto 24px" }}>
              {studio.description}
            </div>
          )}
          <a href="/login" style={{ display:"inline-block", padding:"12px 32px", borderRadius:12, background:accent, color:"#fff", fontSize:15, fontWeight:700, textDecoration:"none", boxShadow:"0 4px 20px rgba(0,0,0,.2)" }}>
            Je réserve →
          </a>
        </div>
      </div>

      {/* Prochaines séances */}
      <div style={{ maxWidth:720, margin:"0 auto", padding:"32px 24px" }}>
        {upcomingSessions.length > 0 && (
          <>
            <div style={{ fontSize:18, fontWeight:800, color:"#2A1F14", marginBottom:16 }}><IcoCal size={18} color="#A06838" style={{marginRight:8}}/> Prochaines séances</div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {upcomingSessions.map((s: any) => {
                const dateStr = new Date(s.session_date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" })
                return (
                  <div key={s.id} style={{ background:"#fff", borderRadius:12, padding:"14px 18px", border:"1px solid #DDD5C8", display:"flex", alignItems:"center", gap:14, boxShadow:"0 2px 8px rgba(42,31,20,.06)" }}>
                    <div style={{ width:48, height:48, borderRadius:10, background:accentBg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>
                      {s.disciplines?.icon || "🧘"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:15, fontWeight:700 }}>{s.disciplines?.name || "Séance"}</div>
                      <div style={{ fontSize:12, color:"#8C7B6C", marginTop:2, textTransform:"capitalize" }}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:4}}><IcoCal size={11} color="#B0A090"/> {dateStr}</span>
                        {" · "}<span style={{display:"inline-flex",alignItems:"center",gap:4}}><IcoClock size={11} color="#B0A090"/> {s.session_time?.slice(0,5)}</span>
                        {" · "}{s.duration_min} min
                      </div>
                      {s.teacher && <div style={{ fontSize:12, color:"#8C7B6C" }}><IcoUser size={11} color="#8C7B6C"/> {s.teacher}{s.room ? <><span style={{margin:"0 3px"}}>·</span><IcoDoor size={11} color="#8C7B6C"/> {s.room}</> : ""}</div>}
                    </div>
                    <div style={{ textAlign:"right", flexShrink:0 }}>
                      <div style={{ fontSize:13, fontWeight:700, color: s.spots - (s.booked||0) <= 0 ? "#D97706" : accent }}>
                        {s.spots - (s.booked||0) <= 0 ? "Complet" : `${s.spots - (s.booked||0)} places`}
                      </div>
                      <a href="/login" style={{ fontSize:12, color:accent, fontWeight:600, textDecoration:"none" }}>Réserver →</a>
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ textAlign:"center", marginTop:20 }}>
              <a href="/login" style={{ display:"inline-block", padding:"11px 28px", borderRadius:10, background:accent, color:"#fff", fontSize:14, fontWeight:700, textDecoration:"none" }}>
                Voir tout le planning →
              </a>
            </div>
          </>
        )}

        {/* Infos contact */}
        {(studio.phone || studio.email || studio.website) && (
          <div style={{ marginTop:32, padding:"20px 24px", background:"#fff", borderRadius:12, border:"1px solid #DDD5C8" }}>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:12 }}><IcoPhone size={16} color="#A06838" style={{marginRight:6}}/> Contact</div>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {studio.phone && <div style={{ fontSize:14, color:"#5C4A38", display:"flex", alignItems:"center", gap:8 }}><IcoPhone size={14} color="#8C7B6C"/>{studio.phone}</div>}
              {studio.email && <a href={`mailto:${studio.email}`} style={{ fontSize:14, color:accent, textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}><IcoMail size={14} color="#A06838"/>{studio.email}</a>}
              {studio.website && <a href={studio.website} target="_blank" rel="noopener noreferrer" style={{ fontSize:14, color:accent, textDecoration:"none", display:"flex", alignItems:"center", gap:8 }}><IcoGlobe size={14} color="#A06838"/>{studio.website}</a>}
            </div>
          </div>
        )}

        <div style={{ textAlign:"center", marginTop:32, paddingTop:24, borderTop:"1px solid #DDD5C8" }}>
          <div style={{ fontSize:11, color:"#B0A090" }}>
            Géré avec <a href="https://fydelys.fr" style={{ color:accent, textDecoration:"none", fontWeight:600 }}>Fydelys</a>
          </div>
        </div>
      </div>
    </div>
  )
}
