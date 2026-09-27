"use client"

import { useCallback } from "react"
import { useAuth } from "@clerk/nextjs"
import { useRouter } from "next/navigation"

export const PRICING_PATH = "/pricing"

export type ProPlan = {
  isLoaded: boolean // false until Clerk has hydrated the session
  isPro: boolean // active org is subscribed to the "pro" org plan
  upgrade: () => void // navigates to the pricing page
}

// Whether the active organization is on the pro plan. Only for UI gating —
// enforce server-side with `auth().has({ plan: "org:pro" })`.
export function useProPlan(): ProPlan {
  const { isLoaded, orgId, has } = useAuth()
  const router = useRouter()

  const isPro = isLoaded && !!orgId && (has?.({ plan: "org:pro" }) ?? false)
  const upgrade = useCallback(() => router.push(PRICING_PATH), [router])

  return { isLoaded, isPro, upgrade }
}
