import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { getWorkflow } from "@/features/workflows/data"
import { Room } from "@/features/workflows/components/room"
import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { liveblocks } from "@/lib/liveblocks"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { orgId } = await auth()

  if (!orgId) return notFound()

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) return notFound()

  await liveblocks.getOrCreateRoom(id, {
    defaultAccesses: [],
    groupsAccesses: { [orgId]: ["room:write"] },
    organizationId: orgId,
    metadata: {
      title: workflow.name,
    },
  })

  return (
    <Room roomId={id}>
      {/* Shared React Flow store for the canvas and the sidebar palette. */}
      <ReactFlowProvider>
        <WorkflowShell workflowId={id} />
      </ReactFlowProvider>
    </Room>
  )
}
