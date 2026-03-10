"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase"
import dynamic from "next/dynamic"

const FydelysV4 = dynamic(() => import("@/components/FydelysV4"), { ssr: false })

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const supabase = createClient()
  const [initialRole, setInitialRole] = useState<string | null>(null)
  const [studioSlug, setStudioSlug]   = useState<string>("")
  const [coachName, setCoachName]     = useState<string>("")
  const [coachDisciplines, setCoachDisciplines] = useState<any[]>([])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return }

      const hostname    = window.location.hostname
      const isApp       = hostname.startsWith("app.") || hostname === "localhost" || hostname === "localhost:3000"
      const tenantMatch = hostname.match(/^([a-z0-9-]+)\.fydelys\.fr/)
      const slug        = tenantMatch ? tenantMatch[1] : ""

      setStudioSlug(slug)

      const { data: profile } = await supabase
        .from("profiles").select("role, studio_id, first_name, last_name").eq("id", user.id).single()

      const role = profile?.role || "adherent"

      // Construire le nom complet pour la vue coach
      if (role === "coach" || (role === "admin" && (profile as any)?.is_coach)) {
        const fullName = `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim()
        setCoachName(fullName)
        // Récupérer les disciplines affectées à ce coach
        const { data: discLinks } = await supabase
          .from("coach_disciplines")
          .select("discipline_id, disciplines(id, name, icon, color)")
          .eq("profile_id", user.id)
        if (discLinks) {
          setCoachDisciplines(discLinks.map((r: any) => r.disciplines).filter(Boolean))
        }
      }

      if (isApp) {
        // Sur app.fydelys.fr — seul le superadmin est autorisé
        if (role === "superadmin") {
          setInitialRole("superadmin")
        } else if (role === "admin") {
          // Admin sur app → rediriger vers son studio
          const { data: studio } = await supabase
            .from("studios").select("slug").eq("id", profile?.studio_id).single()
          if (studio?.slug) {
            window.location.href = `https://${studio.slug}.fydelys.fr/dashboard`
          } else {
            setInitialRole("admin")
          }
        } else {
          router.push("/")
        }
      } else if (slug) {
        // Sur slug.fydelys.fr — admin, coach ou adhérent
        if (role === "superadmin") {
          window.location.href = "https://app.fydelys.fr/dashboard"
          return
        }
        setInitialRole(role)
      } else {
        setInitialRole(role)
      }
    })
  }, [])

  if (!initialRole) return (
    <div style={{ minHeight:"100vh", background: window?.location?.hostname?.startsWith("app.") ? "#0F0A1E" : "#F4EFE8", display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ fontFamily:"Arial", color:"#A06838", fontSize:16, fontWeight:600 }}>Chargement…</div>
    </div>
  )

  return <FydelysV4 initialRole={initialRole} studioSlug={studioSlug} coachName={coachName} coachDisciplines={coachDisciplines} />
}
