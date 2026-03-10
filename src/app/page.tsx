"use client"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

function FleurDeLys({ size = 46 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none">
      <path d="M40 8 C37 14 34 20 34 28 C34 34 36 38 40 42 C44 38 46 34 46 28 C46 20 43 14 40 8Z" fill="url(#gc)"/>
      <ellipse cx="40" cy="9" rx="5" ry="5" fill="#F7D060"/>
      <path d="M34 30 C28 26 20 24 14 26 C10 28 9 33 12 37 C16 41 24 40 30 36 C34 33 34 30 34 30Z" fill="url(#gs)"/>
      <ellipse cx="11" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M46 30 C52 26 60 24 66 26 C70 28 71 33 68 37 C64 41 56 40 50 36 C46 33 46 30 46 30Z" fill="url(#gs)"/>
      <ellipse cx="69" cy="30" rx="4" ry="4" fill="#F5C842"/>
      <path d="M34 38 C33 42 33 46 33 46 L47 46 C47 46 47 42 46 38 C44 40 40 41 40 41 C40 41 36 40 34 38Z" fill="#E8A830"/>
      <rect x="28" y="46" width="24" height="5" rx="2.5" fill="#D4922A"/>
      <path d="M36 51 C36 57 37 62 40 66 C43 62 44 57 44 51Z" fill="#C4822A"/>
      <defs>
        <linearGradient id="gc" x1="40" y1="8" x2="40" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F7D060"/>
          <stop offset="55%" stopColor="#E8A830"/>
          <stop offset="100%" stopColor="#C47820"/>
        </linearGradient>
        <linearGradient id="gs" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#F0BC3A"/>
          <stop offset="100%" stopColor="#D4902A"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

const FEATURES = [
  { icon: "🗓️", title: "Planning intelligent", desc: "Gérez vos séances, créneaux et récurrences en quelques clics. Coachs et adhérents accèdent à leur planning en temps réel." },
  { icon: "👥", title: "Gestion des membres", desc: "Fiches adhérents, crédits, abonnements, historique de présence. Tout pour un suivi personnalisé." },
  { icon: "💳", title: "Paiements intégrés", desc: "Encaissez abonnements et séances sans friction. Stripe sécurise chaque transaction." },
  { icon: "🏠", title: "Votre espace dédié", desc: "Un sous-domaine à votre image — nom.fydelys.fr. Coachs et membres s'y connectent directement." },
  { icon: "📊", title: "Tableaux de bord", desc: "CA, taux de remplissage, tendances. Pilotez votre studio avec des données claires." },
  { icon: "✉️", title: "Invitations & rôles", desc: "Invitez vos coachs par email. Vos adhérents s'inscrivent librement depuis votre URL." },
]

const PLANS = [
  { name: "Essentiel", price: "9",  desc: "Pour démarrer",           features: ["50 adhérents", "2 coachs", "Planning", "Paiements"], popular: false },
  { name: "Standard",  price: "29", desc: "Pour les studios actifs", features: ["200 adhérents", "5 coachs", "Statistiques", "Support email"], popular: true },
  { name: "Pro",       price: "69", desc: "Pour les grands studios", features: ["Adhérents illimités", "Coachs illimités", "Tout Standard +", "Support prioritaire"], popular: false },
]

function StepsAnimated() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          ref.current?.querySelectorAll(".step").forEach((s, i) => {
            setTimeout(() => s.classList.add("visible"), i * 150)
          })
          observer.disconnect()
        }
      })
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{ display:"flex", flexDirection:"column", gap:0, marginTop:40 }}>
      {[
        { n:"1", title:"Créez votre studio",   desc:"Nom, URL personnalisée (nom.fydelys.fr). Prêt en 2 minutes." },
        { n:"2", title:"Invitez vos coachs",   desc:"Un email d'invitation — ils accèdent directement à leur espace." },
        { n:"3", title:"Accueillez vos membres", desc:"Partagez votre URL. Inscription, réservation, paiement en autonomie." },
      ].map((s, i) => (
        <div key={i} className="step" style={{ display:"flex", gap:20, alignItems:"flex-start", padding:"24px 0", borderBottom:"1px solid rgba(160,104,56,.12)", opacity:0, transform:"translateX(-16px)", transition:"opacity .5s, transform .5s" }}>
          <div style={{ flexShrink:0, width:40, height:40, borderRadius:"50%", background:"linear-gradient(145deg,#B88050,#9A6030)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"Georgia,serif", fontSize:18, fontWeight:700, color:"#fff", boxShadow:"0 2px 8px rgba(154,96,48,.25)" }}>{s.n}</div>
          <div>
            <div style={{ fontSize:16, fontWeight:700, color:"#2A1F14", marginBottom:5 }}>{s.title}</div>
            <div style={{ fontSize:14, color:"#8C7B6C", lineHeight:1.6 }}>{s.desc}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", fn)
    return () => window.removeEventListener("scroll", fn)
  }, [])

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#F4EFE8;--bg2:#EDE7DD;--surface:#FDFAF7;--border:rgba(160,104,56,.15);
          --text:#2A1F14;--mid:#5C4A38;--soft:#8C7B6C;--muted:#B0A090;
          --accent:#A06838;--gold:#C4922A;
          --btn:linear-gradient(145deg,#B88050,#9A6030);
          --display:'Cormorant Garamond',Georgia,serif;
          --body:'DM Sans',system-ui,sans-serif;
        }
        html{scroll-behavior:smooth;}
        body{background:var(--bg);color:var(--text);font-family:var(--body);line-height:1.6;}
        .step.visible{opacity:1!important;transform:translateX(0)!important;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .hero-tag{animation:fadeUp .6s ease both;}
        .hero-h1{animation:fadeUp .6s .1s ease both;}
        .hero-sub{animation:fadeUp .6s .2s ease both;}
        .hero-btns{animation:fadeUp .6s .3s ease both;}
        .hero-note{animation:fadeUp .6s .4s ease both;}
        @media(max-width:640px){
          .how-grid{grid-template-columns:1fr!important;}
          .plans-grid{grid-template-columns:1fr!important;}
          nav .nav-links a:not(.nav-cta){display:none;}
        }
        @media(max-width:860px){
          .how-grid{grid-template-columns:1fr!important;}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, height:64, padding:"0 40px", display:"flex", alignItems:"center", justifyContent:"space-between", transition:"background .3s, box-shadow .3s", background: scrolled ? "rgba(244,239,232,.92)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", boxShadow: scrolled ? "0 1px 0 rgba(160,104,56,.12)" : "none" }}>
        <a href="/" style={{ display:"flex", alignItems:"center", gap:10, textDecoration:"none" }}>
          <FleurDeLys size={32}/>
          <span style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:700, color:"#2A1F14", letterSpacing:"-.3px" }}>Fydelys</span>
        </a>
        <div className="nav-links" style={{ display:"flex", alignItems:"center", gap:6 }}>
          <a href="#fonctionnalites" style={{ padding:"8px 14px", borderRadius:8, fontSize:14, fontWeight:500, color:"#5C4A38", textDecoration:"none" }}>Fonctionnalités</a>
          <a href="#tarifs" style={{ padding:"8px 14px", borderRadius:8, fontSize:14, fontWeight:500, color:"#5C4A38", textDecoration:"none" }}>Tarifs</a>
          <a href="/login" style={{ padding:"8px 16px", borderRadius:8, fontSize:14, fontWeight:500, color:"#5C4A38", textDecoration:"none" }}>Connexion</a>
          <a href="/login?tab=register" style={{ padding:"9px 20px", background:"linear-gradient(145deg,#B88050,#9A6030)", borderRadius:9, fontSize:14, fontWeight:600, color:"#fff", textDecoration:"none", boxShadow:"0 2px 8px rgba(154,96,48,.3)" }}>Créer mon studio</a>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"100px 24px 80px", position:"relative", overflow:"hidden", textAlign:"center" }}>
        {/* BG */}
        <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse 70% 50% at 20% 30%, rgba(196,146,42,.12) 0%, transparent 60%), radial-gradient(ellipse 50% 60% at 80% 70%, rgba(160,104,56,.1) 0%, transparent 55%)" }}/>
        {/* Orbs */}
        <div style={{ position:"absolute", width:280, height:280, top:"5%", left:"-8%", borderRadius:"50%", background:"radial-gradient(circle, rgba(196,146,42,.15) 0%, transparent 70%)", animation:"float 16s ease-in-out infinite", pointerEvents:"none" }}/>
        <div style={{ position:"absolute", width:160, height:160, bottom:"12%", right:"2%", borderRadius:"50%", background:"radial-gradient(circle, rgba(160,104,56,.12) 0%, transparent 70%)", animation:"float 20s ease-in-out infinite", animationDelay:"5s", pointerEvents:"none" }}/>

        <div className="hero-tag" style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"5px 14px", background:"rgba(196,146,42,.1)", border:"1px solid rgba(196,146,42,.25)", borderRadius:20, fontSize:11, fontWeight:700, color:"#C4922A", letterSpacing:".8px", textTransform:"uppercase", marginBottom:28 }}>
          ✦ Plateforme de gestion · Studios & Bien-être
        </div>

        <h1 className="hero-h1" style={{ fontFamily:"var(--display)", fontSize:"clamp(48px,8vw,88px)", fontWeight:700, lineHeight:1.05, letterSpacing:"-2px", color:"#2A1F14", maxWidth:800, marginBottom:24 }}>
          Gérez votre studio<br/>avec <em style={{ fontStyle:"italic", color:"#A06838" }}>sérénité</em>
        </h1>

        <p className="hero-sub" style={{ fontSize:"clamp(16px,2vw,19px)", color:"#8C7B6C", maxWidth:520, lineHeight:1.65, marginBottom:44 }}>
          Planning, membres, paiements — tout ce dont votre studio de yoga, pilates ou bien-être a besoin, dans une plateforme élégante et intuitive.
        </p>

        <div className="hero-btns" style={{ display:"flex", gap:12, flexWrap:"wrap", justifyContent:"center" }}>
          <a href="/login?tab=register" style={{ padding:"14px 32px", background:"linear-gradient(145deg,#B88050,#9A6030)", borderRadius:11, fontSize:15, fontWeight:600, color:"#fff", textDecoration:"none", boxShadow:"0 4px 16px rgba(154,96,48,.35)" }}>
            Démarrer l'essai gratuit →
          </a>
          <a href="#fonctionnalites" style={{ padding:"14px 32px", border:"1.5px solid rgba(160,104,56,.2)", borderRadius:11, fontSize:15, fontWeight:600, color:"#5C4A38", textDecoration:"none", background:"rgba(255,255,255,.5)" }}>
            Découvrir Fydelys
          </a>
        </div>

        <p className="hero-note" style={{ marginTop:20, fontSize:13, color:"#B0A090" }}>
          <strong style={{ color:"#C4922A" }}>15 jours offerts</strong> · Sans carte bancaire · Annulable à tout moment
        </p>
      </div>

      {/* FEATURES */}
      <section id="fonctionnalites" style={{ padding:"96px 24px", background:"var(--bg2)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ marginBottom:8, fontSize:11, fontWeight:700, letterSpacing:"1.2px", textTransform:"uppercase", color:"#A06838" }}>✦ Fonctionnalités</div>
          <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(32px,5vw,52px)", fontWeight:700, lineHeight:1.1, letterSpacing:"-1px", color:"#2A1F14", marginBottom:12 }}>Tout ce dont vous avez besoin</h2>
          <p style={{ fontSize:16, color:"#8C7B6C", maxWidth:480, lineHeight:1.65, marginBottom:56 }}>Une solution complète conçue pour les gérants de studios de bien-être exigeants.</p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))", gap:2, border:"1.5px solid rgba(160,104,56,.15)", borderRadius:20, overflow:"hidden" }}>
            {FEATURES.map((f, i) => (
              <div key={i} style={{ padding:"32px 28px", background:"#FDFAF7", borderRight:"1.5px solid rgba(160,104,56,.1)", borderBottom:"1.5px solid rgba(160,104,56,.1)" }}>
                <div style={{ fontSize:28, marginBottom:16, display:"block" }}>{f.icon}</div>
                <div style={{ fontSize:16, fontWeight:700, color:"#2A1F14", marginBottom:8 }}>{f.title}</div>
                <div style={{ fontSize:14, color:"#8C7B6C", lineHeight:1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"96px 24px" }}>
        <div className="how-grid" style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"1fr 1fr", gap:80, alignItems:"center" }}>
          <div>
            <div style={{ marginBottom:8, fontSize:11, fontWeight:700, letterSpacing:"1.2px", textTransform:"uppercase", color:"#A06838" }}>✦ En 3 étapes</div>
            <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(32px,5vw,52px)", fontWeight:700, lineHeight:1.1, letterSpacing:"-1px", color:"#2A1F14" }}>Lancez votre studio en 5 minutes</h2>
            <StepsAnimated/>
          </div>
          <div style={{ background:"#FDFAF7", border:"1.5px solid rgba(160,104,56,.15)", borderRadius:24, padding:40, boxShadow:"0 20px 60px rgba(42,31,20,.06)" }}>
            <div style={{ fontFamily:"var(--display)", fontSize:22, fontWeight:600, color:"#2A1F14", marginBottom:24, fontStyle:"italic", lineHeight:1.4 }}>
              "Fydelys a transformé la gestion de mon studio. Mes adhérents adorent leur espace dédié."
            </div>
            <div style={{ display:"flex", gap:12, alignItems:"center", marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg,#E8C88A,#C4922A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, fontWeight:700, color:"#fff", fontFamily:"Georgia,serif" }}>M</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:"#2A1F14" }}>Marie L.</div>
                <div style={{ fontSize:12, color:"#8C7B6C" }}>Studio Yoga · Lyon</div>
              </div>
            </div>
            <div style={{ padding:16, background:"#F4EFE8", borderRadius:12, fontSize:13, color:"#8C7B6C", lineHeight:1.6 }}>
              <span style={{ color:"#C4922A", fontWeight:700 }}>⭐⭐⭐⭐⭐</span>
              <span style={{ marginLeft:8 }}>Onboarding en 10 minutes, support réactif</span>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="tarifs" style={{ padding:"96px 24px", background:"var(--bg2)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", textAlign:"center" }}>
          <div style={{ marginBottom:8, fontSize:11, fontWeight:700, letterSpacing:"1.2px", textTransform:"uppercase", color:"#A06838" }}>✦ Tarifs</div>
          <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(32px,5vw,52px)", fontWeight:700, lineHeight:1.1, letterSpacing:"-1px", color:"#2A1F14", marginBottom:12 }}>Simple et transparent</h2>
          <p style={{ fontSize:16, color:"#8C7B6C", maxWidth:460, margin:"0 auto 56px", lineHeight:1.65 }}>15 jours d'essai offerts sur toutes les formules. Sans engagement.</p>
          <div className="plans-grid" style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:20, alignItems:"start" }}>
            {PLANS.map(plan => (
              <div key={plan.name} style={{ background:"#FDFAF7", border:`1.5px solid ${plan.popular ? "#C4922A" : "rgba(160,104,56,.15)"}`, borderRadius:20, padding:"28px 24px", position:"relative", boxShadow: plan.popular ? "0 4px 24px rgba(196,146,42,.15)" : "none" }}>
                {plan.popular && <div style={{ position:"absolute", top:-11, left:"50%", transform:"translateX(-50%)", background:"#C4922A", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 14px", borderRadius:12, whiteSpace:"nowrap" }}>⭐ Populaire</div>}
                <div style={{ fontSize:13, fontWeight:700, color:"#A06838", marginBottom:4 }}>{plan.name}</div>
                <div style={{ fontFamily:"var(--display)", fontSize:44, fontWeight:700, color:"#2A1F14", lineHeight:1 }}>{plan.price}€<span style={{ fontSize:15, fontWeight:400, color:"#8C7B6C", fontFamily:"var(--body)" }}>/mois</span></div>
                <div style={{ fontSize:13, color:"#8C7B6C", margin:"6px 0 20px" }}>{plan.desc}</div>
                <ul style={{ listStyle:"none", display:"flex", flexDirection:"column", gap:8, marginBottom:24, textAlign:"left" }}>
                  {plan.features.map(f => <li key={f} style={{ fontSize:13, color:"#5C4A38", display:"flex", gap:8 }}><span style={{ color:"#A06838", fontWeight:700 }}>✓</span>{f}</li>)}
                </ul>
                <a href="/login?tab=register" style={{ display:"block", width:"100%", padding:"11px", borderRadius:10, textAlign:"center", textDecoration:"none", fontSize:14, fontWeight:700, background:"linear-gradient(145deg,#B88050,#9A6030)", color:"#fff" }}>
                  Commencer gratuitement
                </a>
              </div>
            ))}
          </div>
          <p style={{ marginTop:20, fontSize:12, color:"#B0A090" }}>Tous les plans incluent l'hébergement, les mises à jour et le support.</p>
        </div>
      </section>

      {/* CTA BAND */}
      <section style={{ padding:"48px 24px 96px" }}>
        <div style={{ background:"linear-gradient(135deg,#2A1F14 0%,#3D2E1E 50%,#2A1F14 100%)", borderRadius:28, padding:"72px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse 60% 70% at 50% 50%, rgba(196,146,42,.12) 0%, transparent 60%)", pointerEvents:"none" }}/>
          <h2 style={{ fontFamily:"var(--display)", fontSize:"clamp(32px,5vw,52px)", fontWeight:700, color:"#F4EFE8", marginBottom:16, position:"relative", letterSpacing:"-1px", lineHeight:1.1 }}>
            Prêt à simplifier<br/>votre <em style={{ fontStyle:"italic", color:"#C4922A" }}>quotidien</em> ?
          </h2>
          <p style={{ fontSize:16, color:"rgba(244,239,232,.6)", marginBottom:36, position:"relative" }}>Rejoignez les gérants qui pilotent leur studio avec Fydelys.</p>
          <a href="/login?tab=register" style={{ display:"inline-block", padding:"16px 40px", background:"linear-gradient(145deg,#B88050,#9A6030)", borderRadius:11, fontSize:16, fontWeight:600, color:"#fff", textDecoration:"none", boxShadow:"0 4px 16px rgba(154,96,48,.35)", position:"relative" }}>
            Créer mon studio gratuitement →
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ padding:"32px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", borderTop:"1px solid rgba(160,104,56,.12)", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <FleurDeLys size={26}/>
          <span style={{ fontFamily:"var(--display)", fontSize:18, fontWeight:700, color:"#5C4A38" }}>Fydelys</span>
        </div>
        <div style={{ display:"flex", gap:24 }}>
          <a href="/login" style={{ fontSize:13, color:"#B0A090", textDecoration:"none" }}>Connexion</a>
          <a href="/login?tab=register" style={{ fontSize:13, color:"#B0A090", textDecoration:"none" }}>Créer un studio</a>
          <a href="mailto:info@lysia.fr" style={{ fontSize:13, color:"#B0A090", textDecoration:"none" }}>Contact</a>
        </div>
        <div style={{ fontSize:12, color:"#B0A090" }}>© 2025 Fydelys · Gestion studios & bien-être</div>
      </footer>
    </>
  )
}
