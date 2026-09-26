"use client"

import { PlusIcon, WorkflowIcon } from "lucide-react"
import * as React from "react"

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

const workflows = [
  "dominant-wasp",
  "honest-reindeer",
  "expected-llama",
  "essential-ocelot",
  "creepy-echidna",
  "eastern-silkworm",
  "cultural-lion",
  "proud-weasel",
  "regional-bonobo",
]

export function WorkflowNav() {
  const { state, isMobile } = useSidebar()
  const [activeWorkflow, setActiveWorkflow] = React.useState(workflows[0])

  const workflowItems = workflows.map((workflow) => (
    <SidebarMenuItem key={workflow}>
      <SidebarMenuButton
        isActive={workflow === activeWorkflow}
        onClick={() => setActiveWorkflow(workflow)}
      >
        <span>{workflow}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  ))

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
                    <SidebarMenuButton>
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
      <SidebarGroupAction title="New workflow">
        <PlusIcon />
        <span className="sr-only">New workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
