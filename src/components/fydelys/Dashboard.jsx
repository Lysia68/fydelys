"use client";

import React, { useState, useEffect, useContext } from "react";
import { createClient } from "@/lib/supabase";
import { AppCtx } from "./context";
import { C } from "./theme";
import { DISCIPLINES, SESSIONS_INIT, BOOKINGS_INIT, MEMBERS, PAYMENTS } from "./demoData";
import { IcoUsers2, IcoCalendar2, IcoBarChart2, IcoEuro2, IcoChevron, IcoCheck } from "./icons";
import { Card, SectionHead, Pill, KpiCard, MemberRow, DemoBanner, creditColor, CreditBadge } from "./ui";
import { PlanningAccordion } from "./accordion";
import { StatsPresences, useStatsPresences } from "./StatsPresences";
import { libelleSemaine } from "@/lib/stats-presences";

// ── PLANNING ACCORDION ────────────────────────────────────────────────────────

function stLbl(s) { return s==="confirmed"?"Confirmé":s==="waitlist"?"En attente":"Annulé"; }
function stStyle(s) {
  if (s==="confirmed") return { color:C.ok,    background:C.okBg    };
  if (s==="waitlist")  return { color:C.accent, background:C.accentBg };
  return { color:C.warn, background:C.warnBg };
}


function DashboardSessionCard({ sess, expandedId, bookings, onToggle, onChangeStatus, isDemo, discs }) {
  const allDiscs = (discs && discs.length) ? discs : DISCIPLINES;
  const disc  = allDiscs.find(d=>d.id===sess.disciplineId) || { name: sess.discipline_name || sess.disciplineId || "Discipline", color:"#C4956A" };
  const bl    = bookings[sess.id]||[];
  const booked= bl.length ? bl.filter(b=>b.st==="confirmed").length : sess.booked;
  const wait  = bl.length ? bl.filter(b=>b.st==="waitlist").length  : sess.waitlist;
  const pct   = booked/sess.spots;
  const isExp = !isDemo && expandedId===sess.id;
  return (
    <div style={{ borderBottom:`1px solid ${C.borderSoft}` }}>
      <div onClick={isDemo ? undefined : ()=>onToggle(sess.id)}
        style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 16px", cursor:isDemo?"default":"pointer", background:isExp?C.accentBg:C.surface, transition:"background .15s" }}
        onMouseEnter={e=>{ if(!isExp && !isDemo) e.currentTarget.style.background=C.surfaceWarm; }}
        onMouseLeave={e=>{ if(!isExp) e.currentTarget.style.background=C.surface; }}>
        <div style={{ fontSize:13, fontWeight:700, color:C.accent, width:36, flexShrink:0 }}>{sess.time}</div>
        <div style={{ width:3, height:28, background:disc.color, borderRadius:2, flexShrink:0 }}/>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{disc.name}</div>
          <div style={{ fontSize:12, color:C.textSoft, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{sess.teacher} · {sess.room} · {sess.duration}min</div>
        </div>
        <div style={{ textAlign:"right", flexShrink:0 }}>
          <div style={{ fontSize:15, fontWeight:700, color:pct>=1?C.warn:C.text }}>
            {booked}/{sess.spots}
            {wait>0 && <span style={{ fontSize:12, color:C.accent, marginLeft:3 }}>+{wait}</span>}
          </div>
          <div style={{ width:48, height:3, background:C.bgDeep, borderRadius:2, marginTop:3 }}>
            <div style={{ height:"100%", width:`${Math.min(pct*100,100)}%`, background:pct>=1?C.warn:pct>.75?C.accent:C.ok, borderRadius:2 }}/>
          </div>
        </div>
        <span style={{ flexShrink:0, display:"inline-flex", transition:"transform .2s", transform:isExp?"rotate(180deg)":"none" }}><IcoChevron s={16} c={C.textMuted}/></span>
      </div>
      {isExp && <PlanningAccordion sessId={sess.id} bookings={bookings} onChangeStatus={onChangeStatus}/>}
    </div>
  );
}

// ── PLANNING ──────────────────────────────────────────────────────────────────

function Dashboard({ isMobile }) {
  const p = isMobile?12:28;
  const { studioId, discs: ctxDiscs, setDiscs } = useContext(AppCtx);
  const [localDiscs, setLocalDiscs] = useState([]);
  const discs = localDiscs.length ? localDiscs : ctxDiscs;
  const [expandedId, setExpandedId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [bookings, setBookings] = useState({});
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);
  const stats = useStatsPresences(studioId);

  const handleToggle = (id) => setExpandedId(prev => prev===id ? null : id);
  const handleChangeStatus = (bid, sid, ns) => {
    setBookings(prev => { const nb={...prev}; nb[sid]=(nb[sid]||[]).map(b=>b.id===bid?{...b,st:ns}:b); return nb; });
  };

  useEffect(() => {
    if (!studioId) return;
    const sb = createClient();

    // Charger les dernières réservations (triées par created_at)
    sb.from("bookings")
      .select("id, created_at, status, member_id, guest_name, sessions!inner(session_date, session_time, discipline_id, disciplines(name, icon, color)), members!bookings_member_id_fkey(first_name, last_name)")
      .eq("sessions.studio_id", studioId)
      .eq("status", "confirmed")
      .order("created_at", { ascending: false })
      .limit(5)
      .then(({ data }) => {
        setRecentBookings((data || []).map(b => ({
          name: b.guest_name ? `${b.guest_name} (invité)` : b.members ? `${b.members.first_name||""} ${b.members.last_name||""}`.trim() : "—",
          discName: b.sessions?.disciplines?.name || "Séance",
          discIcon: b.sessions?.disciplines?.icon || "",
          discColor: b.sessions?.disciplines?.color || "#C4956A",
          date: b.sessions?.session_date || "",
          time: b.sessions?.session_time?.slice(0,5) || "",
          memberId: b.member_id,
          createdAt: b.created_at,
        })));
      });


    Promise.all([
      sb.from("sessions").select("id,discipline_id,teacher,room,duration_min,spots,session_date,session_time,status").eq("studio_id", studioId),
      sb.from("members").select("id,first_name,last_name,email,phone,status,joined_at,credits,credits_total,subscription_id,subscriptions(name)").eq("studio_id", studioId).is("deleted_at", null),
      sb.from("member_payments").select("id,amount,status,payment_date,payment_type,notes,members(first_name,last_name)").eq("studio_id", studioId),
      fetch(`/api/disciplines?studioId=${studioId}`).then(r=>r.json()).then(j=>({data:j.disciplines||[]})).catch(()=>sb.from("disciplines").select("id,name,color,icon").eq("studio_id", studioId)),
    ]).then(async ([sessRes, membRes, payRes, discRes]) => {
      const sessData = sessRes.data || [];
      const membData = membRes.data || [];
      const payData  = payRes.data  || [];
      const discData = discRes.data || [];

      if (sessData.length === 0 && membData.length === 0) {
        // Studio vide — pas de données démo, empty state
        setSessions([]);
        setBookings({});
        setMembers([]);
        setPayments([]);
        setIsDemo(false);
      } else {
        const mappedSessions = sessData.map(s=>({
          id: s.id, disciplineId: s.discipline_id,
          teacher: s.teacher||"", room: s.room||"",
          duration: s.duration_min||60, spots: s.spots||12,
          date: s.session_date, time: s.session_time?.slice(0,5)||"09:00",
          status: s.status||"scheduled", booked:0, waitlist:0,
        }));

        // Charger les bookings pour calculer le taux de remplissage
        const sessionIds = mappedSessions.map(s => s.id);
        let bkMap = {};
        if (sessionIds.length > 0) {
          const { data: bkData } = await sb.from("bookings")
            .select("session_id, status, attended, member_id, guest_name, host_member_id, members!bookings_member_id_fkey(first_name, last_name, email, phone)")
            .in("session_id", sessionIds);
          (bkData || []).forEach(b => {
            if (!bkMap[b.session_id]) bkMap[b.session_id] = [];
            const isGuest = !!b.guest_name;
            bkMap[b.session_id].push({
              id: b.member_id,
              st: b.status,
              attended: b.attended,
              fn: b.members?.first_name || "",
              ln: b.members?.last_name  || "",
              name: isGuest ? `${b.guest_name} (invité)` : `${b.members?.first_name||""} ${b.members?.last_name||""}`.trim() || "—",
              email: b.members?.email   || "",
              phone: b.members?.phone   || "",
              isGuest, hostMemberId: b.host_member_id || null,
            });
          });
        }

        setSessions(mappedSessions);
        setBookings(bkMap);
        setMembers(membData.map(m=>({
          ...m,
          firstName: m.first_name||"",
          lastName: m.last_name||"",
          email: m.email||"",
          phone: m.phone||"",
          subscription: m.subscriptions?.name||"—",
          joined: m.joined_at||"",
          avatar: (m.first_name?.[0]||"") + (m.last_name?.[0]||""),
          credits: m.credits ?? 0,
          credits_total: m.credits_total ?? 0,
        })));
        setPayments(payData.map(p=>({...p, date:p.payment_date, status:p.status, member: p.members ? `${p.members.first_name||""} ${p.members.last_name||""}`.trim() : "", payment_type: p.payment_type||"" })));
        if (discData.length > 0) {
          setLocalDiscs(discData);
          setDiscs(discData);
        }
        setIsDemo(false);
      }
      setLoading(false);
    });
  }, [studioId]);

  // Date du jour
  const today = new Date();
  const todayStr = today.toISOString().slice(0,10);
  const todayLabel = today.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"long"});
  const todaySessions = sessions.filter(s=>s.date===todayStr);

  // KPIs
  const monthStr = todayStr.slice(0,7);
  const activeMembers = members.filter(m=>m.status==="active"||m.status==="actif"||m.status==="Actif").length;
  const monthSessionsList = sessions.filter(s=>s.date?.startsWith(monthStr));
  const totalBooked = monthSessionsList.reduce((acc,s)=>{ const bks=bookings[s.id]||[]; return acc+(bks.length?bks.filter(b=>b.st==="confirmed").length:s.booked||0); },0);
  const totalCap = monthSessionsList.reduce((acc,s)=>acc+(s.spots||0),0);
  const fillRate = totalCap>0 ? Math.round(totalBooked/totalCap*100) : 0;
  const monthRevenue = payments.filter(p=>p.date?.startsWith(monthStr)&&(p.status==="payé"||p.status==="paid")).reduce((s,p)=>s+(p.amount||0),0);

  // Prochaine séance (future la plus proche)
  const nextSession = (() => {
    const now = new Date();
    const future = sessions
      .filter(s => s.status !== "cancelled" && s.date >= todayStr)
      .sort((a,b) => {
        if (a.date !== b.date) return a.date > b.date ? 1 : -1;
        return (a.time||"").localeCompare(b.time||"");
      })
      .find(s => {
        const [y,m,d] = (s.date||"").split("-").map(Number);
        const [h,mi] = (s.time||"00:00").split(":").map(Number);
        return new Date(y, m-1, d, h, mi) > now;
      });
    if (!future) return null;
    const allD = discs.length ? discs : localDiscs;
    const disc = allD.find(d => String(d.id) === String(future.disciplineId));
    const bk = (bookings[future.id]||[]).filter(b=>b.st==="confirmed").length;
    const [y,m,d] = (future.date||"").split("-").map(Number);
    const [h,mi] = (future.time||"00:00").split(":").map(Number);
    const sessDate = new Date(y, m-1, d, h, mi);
    const diffMs = sessDate - now;
    const diffH = Math.floor(diffMs / 3600000);
    const diffMin = Math.floor((diffMs % 3600000) / 60000);
    const countdown = diffH > 24 ? `dans ${Math.ceil(diffH/24)}j` : diffH > 0 ? `dans ${diffH}h${diffMin>0?String(diffMin).padStart(2,"0"):""}` : `dans ${diffMin} min`;
    return { ...future, discName: disc?.name||"Séance", discIcon: disc?.icon||"", discColor: disc?.color||C.accent, booked: bk, countdown };
  })();

  // Membres inactifs (pas de réservation confirmée depuis 30j)
  const inactiveMembers = (() => {
    if (isDemo || !members.length) return [];
    const d30ago = new Date(); d30ago.setDate(d30ago.getDate() - 30);
    const d30str = d30ago.toISOString().slice(0,10);
    // Collecter les member IDs qui ont un booking confirmé sur une session récente
    const activeIds = new Set();
    sessions.forEach(s => {
      if (s.date >= d30str) {
        (bookings[s.id]||[]).forEach(b => {
          if (b.st === "confirmed" && b.id) activeIds.add(b.id); // b.id = member_id dans le dashboard
        });
      }
    });
    return members
      .filter(m => (m.status === "actif" || m.status === "Actif" || m.status === "active") && !activeIds.has(m.id))
      .slice(0, 5);
  })();

  // Membres récents triés par date d'inscription
  const recentMembers = [...members].sort((a,b)=>{
    const da = a.joinedAt||a.joined_at||a.created_at||"";
    const db2 = b.joinedAt||b.joined_at||b.created_at||"";
    return db2.localeCompare(da);
  }).slice(0,3);

  const EmptyCard = ({label}) => (
    <div style={{padding:"28px 16px",textAlign:"center",color:C.textMuted,fontSize:14,fontStyle:"italic"}}>
      {label}
    </div>
  );

  // Guide de démarrage quand le studio est vide
  const isEmpty = !loading && sessions.length === 0 && members.length === 0;

  return (
    <div>
      <div style={{ padding:p }}>
        {isEmpty && (
          <Card style={{ marginBottom:20, borderLeft:`3px solid ${C.accent}`, background:"#FDFAF5" }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14 }}>
              <div style={{ fontSize:32, flexShrink:0 }}>🚀</div>
              <div>
                <div style={{ fontSize:16, fontWeight:800, color:C.text, marginBottom:6 }}>Bienvenue sur Fydelys !</div>
                <div style={{ fontSize:13, color:C.textSoft, lineHeight:1.7, marginBottom:14 }}>
                  Votre studio est prêt. Voici les prochaines étapes pour bien démarrer :
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {[
                    { icon:"🧘", label:"Créer vos disciplines",     page:"disciplines", desc:"Yoga, Pilates, Méditation..." },
                    { icon:"📅", label:"Planifier votre 1ère séance", page:"planning",    desc:"Séance unique ou récurrence" },
                    { icon:"👥", label:"Ajouter vos membres",        page:"members",     desc:"Import ou ajout manuel" },
                    { icon:"⚙",  label:"Configurer vos paramètres",  page:"settings",    desc:"Salles, paiements, SMS..." },
                  ].map(s => (
                    <div key={s.page} onClick={()=>window.dispatchEvent(new CustomEvent("fydelys:nav",{detail:s.page}))}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", borderRadius:10, border:`1px solid ${C.border}`, background:C.surface, cursor:"pointer", transition:"background .1s" }}
                      onMouseEnter={e=>e.currentTarget.style.background=C.accentBg}
                      onMouseLeave={e=>e.currentTarget.style.background=C.surface}>
                      <span style={{ fontSize:20 }}>{s.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:14, fontWeight:700, color:C.text }}>{s.label}</div>
                        <div style={{ fontSize:12, color:C.textMuted }}>{s.desc}</div>
                      </div>
                      <span style={{ fontSize:12, color:C.accent, fontWeight:600 }}>→</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        )}
        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr 1fr":"repeat(4,1fr)", gap:isMobile?8:14, marginBottom:isMobile?12:20 }}>
          <KpiCard icon={<IcoUsers2 s={isMobile?16:18} c={C.ok}/>}      label="Membres actifs" value={activeMembers>0?String(activeMembers):"—"}  delta={null} accentColor={C.ok}     isMobile={isMobile}/>
          {/* Présences VALIDÉES (pointées) du lundi au dimanche de la semaine ISO précédente, heure de Paris. */}
          <KpiCard icon={<IcoCheck s={isMobile?16:18} c="#6B9E7A"/>} label={stats.precedente ? `Validés semaine précédente (${libelleSemaine(stats.precedente)})` : "Validés semaine précédente"} value={stats.precedente===null?(stats.etat==="erreur"?"—":"…"):String(stats.precedente.valides)} delta={null} accentColor="#6B9E7A"  isMobile={isMobile}/>
          <KpiCard icon={<IcoBarChart2 s={isMobile?16:18} c="#6A8FAE"/>} label="Taux remplissage" value={totalCap>0?fillRate+" %":"—"}                 delta={null} accentColor="#6A8FAE"  isMobile={isMobile}/>
          <KpiCard icon={<IcoEuro2 s={isMobile?16:18} c={C.accent}/>}   label="CA du mois"        value={monthRevenue>0?monthRevenue.toLocaleString("fr-FR")+" €":"—"} delta={null} accentColor={C.accent} isMobile={isMobile}/>
        </div>

        {/* Prochaine séance + Derniers paiements */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:isMobile?12:16, marginBottom:isMobile?12:16 }}>
          {nextSession && (
            <Card style={{ borderLeft:`3px solid ${nextSession.discColor}` }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:C.textMuted, textTransform:"uppercase", letterSpacing:.5 }}>Prochaine séance</div>
                <span style={{ fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:8, background:C.accentBg, color:C.accent }}>{nextSession.countdown}</span>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${nextSession.discColor}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>{nextSession.discIcon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:16, fontWeight:700, color:C.text }}>{nextSession.discName}</div>
                  <div style={{ fontSize:13, color:C.textSoft }}>{new Date(nextSession.date+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})} · {nextSession.time}</div>
                  <div style={{ fontSize:12, color:C.textMuted, marginTop:2 }}>{nextSession.teacher} · {nextSession.room}</div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:18, fontWeight:800, color:nextSession.booked>=nextSession.spots?C.warn:C.ok }}>{nextSession.booked}/{nextSession.spots}</div>
                  <div style={{ fontSize:11, color:C.textMuted }}>inscrits</div>
                </div>
              </div>
            </Card>
          )}
          <Card noPad>
            <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}><IcoEuro2 s={15} c={C.accent}/>Derniers paiements</span></SectionHead>
            {payments.length === 0
              ? <EmptyCard label="Aucun paiement enregistré"/>
              : [...payments].sort((a,b)=>(b.date||"").localeCompare(a.date||"")).slice(0,5).map((p,i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", borderBottom:`1px solid ${C.borderSoft}` }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background:p.status==="payé"?C.okBg:C.warnBg, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <IcoEuro2 s={13} c={p.status==="payé"?C.ok:C.warn}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.member || "—"}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>{p.date ? new Date(p.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"}) : "—"}{p.payment_type ? ` · ${p.payment_type}` : ""}{p.notes ? ` · ${p.notes}` : ""}</div>
                  </div>
                  <div style={{ textAlign:"right", flexShrink:0 }}>
                    <div style={{ fontSize:14, fontWeight:800, color:p.status==="payé"?C.ok:C.warn }}>{parseFloat(p.amount||0).toFixed(2).replace(".",",")} €</div>
                    <div style={{ fontSize:10, fontWeight:600, color:p.status==="payé"?C.ok:C.warn }}>{p.status}</div>
                  </div>
                </div>
              ))
            }
          </Card>
        </div>

        {/* Dernières inscriptions + Nouveaux membres */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:isMobile?12:16, marginBottom:isMobile?12:16 }}>
          <Card noPad>
            <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}><IcoCalendar2 s={15} c={C.ok}/>Dernières inscriptions</span></SectionHead>
            {recentBookings.length === 0
              ? <EmptyCard label="Aucune inscription récente"/>
              : recentBookings.map((rb,i) => (
                <div key={i} onClick={()=>rb.memberId && window.dispatchEvent(new CustomEvent("fydelys:openMember",{detail:rb.memberId}))}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 16px", borderBottom:`1px solid ${C.borderSoft}`, cursor:rb.memberId?"pointer":"default" }}
                  onMouseEnter={e=>{if(rb.memberId)e.currentTarget.style.background=C.bg;}}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{ width:28, height:28, borderRadius:8, background:`${rb.discColor}18`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>{rb.discIcon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{rb.name}</div>
                    <div style={{ fontSize:11, color:C.textMuted }}>{rb.discName} · {new Date(rb.date+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})} · {rb.time}{rb.createdAt ? ` · ${(() => { const d=Math.floor((Date.now()-new Date(rb.createdAt).getTime())/60000); return d<60?`il y a ${d}min`:d<1440?`il y a ${Math.floor(d/60)}h`:`il y a ${Math.floor(d/1440)}j`; })()}` : ""}</div>
                  </div>
                </div>
              ))
            }
          </Card>
          <Card noPad>
            <SectionHead>Nouveaux membres</SectionHead>
            {loading
              ? <EmptyCard label="Chargement…"/>
              : recentMembers.length === 0
                ? <EmptyCard label="Aucun membre pour le moment"/>
                : recentMembers.map(m=><MemberRow key={m.id} m={m} onSelect={()=>window.dispatchEvent(new CustomEvent("fydelys:openMember",{detail:m.id}))} selected={false}/>)
            }
          </Card>
        </div>

        {/* Stats présences et validés (agrégats serveur, filtres Mois / Année) */}
        <StatsPresences stats={stats} isMobile={isMobile}/>

        {/* Sans réservation */}
        <div style={{ display:"grid", gridTemplateColumns:isMobile?"1fr":"1fr 1fr", gap:isMobile?12:16 }}>
          {inactiveMembers.length > 0 && (
            <Card noPad>
              <SectionHead><span style={{display:"flex",alignItems:"center",gap:6}}>😴 Sans réservation depuis 30j <span style={{fontSize:11,fontWeight:700,padding:"1px 7px",borderRadius:10,background:C.warnBg,color:C.warn}}>{inactiveMembers.length}</span></span></SectionHead>
              <div style={{ padding:"0 2px" }}>
                {inactiveMembers.map(m => (
                  <div key={m.id} onClick={()=>window.dispatchEvent(new CustomEvent("fydelys:openMember",{detail:m.id}))}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 14px", borderBottom:`1px solid ${C.borderSoft}`, cursor:"pointer" }}
                    onMouseEnter={e=>e.currentTarget.style.background=C.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background:C.accentBg, border:`1px solid #DFC0A0`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:C.accent, flexShrink:0 }}>
                      {(m.first_name||m.firstName||"?")[0]}{(m.last_name||m.lastName||"")[0]}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:C.text, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{m.first_name||m.firstName} {m.last_name||m.lastName}</div>
                      <div style={{ fontSize:11, color:C.textMuted }}>{m.email}</div>
                    </div>
                    <span style={{ fontSize:11, color:C.warn, fontWeight:600, flexShrink:0 }}>30j+</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CREDIT BADGE ─────────────────────────────────────────────────────────────
// Affiche "X/Y" avec couleur dégradée rouge→orange→vert selon % restant
// credits=null = forfait illimité (∞)

export { Dashboard, DashboardSessionCard };