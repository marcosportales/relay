import { auth } from "@clerk/nextjs/server"
import { auth as triggerAuth } from "@trigger.dev/sdk"
import { notFound } from "next/navigation"
import { ReactFlowProvider } from "@xyflow/react"
import { getWorkflow } from "@/features/workflows/data"
import { Room } from "@/features/workflows/components/room"
import { WorkflowRunsProvider } from "@/features/workflows/components/workflow-runs-provider"
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

  const runsAccessToken = await triggerAuth.createPublicToken({
    scopes: { read: { tags: [`workflow:${id}`] } },
    expirationTime: "1h",
  })

  return (
    <Room roomId={id}>
      {/* Shared React Flow store for the canvas and the sidebar palette. */}
      <ReactFlowProvider>
        <WorkflowRunsProvider workflowId={id} accessToken={runsAccessToken}>
          <WorkflowShell workflowId={id} />
        </WorkflowRunsProvider>
      </ReactFlowProvider>
    </Room>
  )
}
