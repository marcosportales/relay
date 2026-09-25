import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <TooltipProvider>
      <SidebarProvider className="h-svh" defaultOpen={defaultOpen}>
        <AppSidebar />
        <SidebarInset className="min-h-0 overflow-hidden border shadow-none!">
          <SidebarTrigger className="absolute top-2 left-2 md:hidden" />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
