import { PricingTable } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Page() {
  const { orgId } = await auth()

  // Org plans are billed to the active organization, so one must be selected.
  if (!orgId) redirect("/choose-organization")

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Plans</h1>
          <p className="text-muted-foreground">
            Choose the plan that fits your organization.
          </p>
        </header>
        <PricingTable for="organization" highlightedPlan="pro" />
      </div>
    </div>
  )
}
