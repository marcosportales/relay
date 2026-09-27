"use client"

import { PlusIcon, WorkflowIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import type { Workflow } from "@/lib/db/schema"

interface WorkflowNavProps {
  workflows: Workflow[]
}

export function WorkflowNav({ workflows }: WorkflowNavProps) {
  const { state, isMobile } = useSidebar()
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()

  const handleCreateWorkflow = () => {
    startTransition(async () => {
      const result = await createWorkflowAction(generateSlug())

      if (!result.ok) {
        toast.error(result.error)
      }
    })
  }

  const workflowItems = workflows.map((workflow) => {
    const href = `/workflows/${workflow.id}`

    return (
      <SidebarMenuItem key={workflow.id}>
        <SidebarMenuButton asChild isActive={pathname === href}>
          <Link href={href}>
            <span>{workflow.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  })

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarGroup>
        <SidebarMenu>
          <SidebarMenuItem>
            <Popover>
              <PopoverTrigger asChild>
                <SidebarMenuButton>
                  <WorkflowIcon />
                  <span className="sr-only">Workflows</span>
                </SidebarMenuButton>
              </PopoverTrigger>
              <PopoverContent side="right" align="start">
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleCreateWorkflow}
                      disabled={isPending}
                    >
                      <PlusIcon />
                      <span>New workflow</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
                <SidebarSeparator />
                <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
              </PopoverContent>
            </Popover>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workflows</SidebarGroupLabel>
      <SidebarGroupAction
        title="New workflow"
        onClick={handleCreateWorkflow}
        disabled={isPending}
      >
        <PlusIcon />
        <span className="sr-only">New workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
