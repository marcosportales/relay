"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { PlusIcon, WorkflowIcon } from "lucide-react"
import * as React from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
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

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  const [activeWorkflow, setActiveWorkflow] = React.useState(workflows[0])

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center justify-between gap-2 group-data-[collapsible=icon]:flex-col">
        <OrganizationSwitcher
          hidePersonal
          appearance={{
            elements: {
              rootBox: "min-w-0 flex-1 group-data-[collapsible=icon]:!hidden",
              organizationSwitcherTrigger:
                "w-full justify-start group-data-[collapsible=icon]:p-1",
              organizationPreviewTextContainer:
                "group-data-[collapsible=icon]:hidden",
              organizationSwitcherTriggerIcon:
                "group-data-[collapsible=icon]:hidden",
            },
          }}
        />
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workflows</SidebarGroupLabel>
          <SidebarGroupAction title="New workflow">
            <PlusIcon />
            <span className="sr-only">New workflow</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-0.5">
              {workflows.map((workflow) => (
                <SidebarMenuItem key={workflow}>
                  <SidebarMenuButton
                    isActive={workflow === activeWorkflow}
                    onClick={() => setActiveWorkflow(workflow)}
                    tooltip={workflow}
                  >
                    <WorkflowIcon className="hidden group-data-[collapsible=icon]:block" />
                    <span>{workflow}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="group-data-[collapsible=icon]:items-center">
        <UserButton
          appearance={{
            elements: {
              userButtonTrigger:
                "w-full justify-start group-data-[collapsible=icon]:justify-center",
              userButtonOuterIdentifier: "group-data-[collapsible=icon]:hidden",
            },
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
