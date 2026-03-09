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

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push("/"); return }

      const hostname = window.location.hostname
      const isApp    = hostname.startsWith("app.")
      const isTenant = hostname.includes(".fydelys.fr") && !isApp && hostname !== "fydelys.fr"
      const isLocal  = hostname === "localhost"

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, studio_id")
        .eq("id", user.id)
        .single()

      if (isApp || isLocal) {
        // app.fydelys.fr → SuperAdmin uniquement
        if (profile?.role === "superadmin") {
          setInitialRole("superadmin")
        } else {
          // Admin sur app. → rediriger vers son sous-domaine
          const { data: studio } = await supabase
            .from("studios")
            .select("slug")
            .eq("id", profile?.studio_id)
            .single()
          if (studio?.slug) {
            window.location.href = `https://${studio.slug}.fydelys.fr/dashboard`
          } else {
            setInitialRole("admin")
          }
        }
      } else if (isTenant) {
        // monStudio.fydelys.fr → vue Studio ou Adhérent
        const slug = hostname.split(".")[0]
        // Vérifier si l'user est adhérent de ce studio
        const { data: member } = await supabase
          .from("members")
          .select("id")
          .eq("auth_user_id", user.id)
          .single()
        if (member) {
          setInitialRole("adherent")
        } else {
          setInitialRole(profile?.role === "staff" ? "staff" : "admin")
        }
      } else {
        setInitialRole(profile?.role || "admin")
      }
    })
  }, [])

  if (!initialRole) return (
    <div style={{ minHeight: "100vh", background: "#F4EFE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: "Arial", color: "#A06838", fontSize: 16, fontWeight: 600 }}>Chargement…</div>
    </div>
  )

  return <FydelysV4 initialRole={initialRole} />
}
