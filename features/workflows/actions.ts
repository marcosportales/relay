"use server"

import { auth } from "@clerk/nextjs/server"
import { runs, tasks } from "@trigger.dev/sdk"
import { revalidatePath } from "next/cache"

import { LiveblocksError } from "@liveblocks/node"

import {
  createWorkflow,
  deleteWorkflow,
  saveWorkflowGraph,
} from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import type { helloWorldTask } from "@/trigger/example"
import type { WorkflowGraph } from "@/lib/db/schema"

// Expected failures are returned as values: errors thrown from server actions
// have their message redacted in production.
type ActionResult<T = void> =
  { ok: true; data: T } | { ok: false; error: string }

export const createWorkflowAction = async (
  name: string
): Promise<ActionResult<{ id: string }>> => {
  const { orgId } = await auth()

  if (!orgId) {
    return { ok: false, error: "No active organization" }
  }

  const workflow = await createWorkflow(orgId, name)

  revalidatePath("/workflows", "layout")
  return { ok: true, data: { id: workflow.id } }
}

export const deleteWorkflowAction = async (
  id: string
): Promise<ActionResult> => {
  const { orgId } = await auth()

  if (!orgId) {
    return { ok: false, error: "No active organization" }
  }

  const workflow = await deleteWorkflow(orgId, id)

  if (!workflow) {
    return { ok: false, error: "Workflow not found" }
  }

  // The room id is the workflow id. A missing room (404) is already clean; any
  // other failure is logged so the delete still completes for the user.
  try {
    await liveblocks.deleteRoom(workflow.id)
  } catch (error) {
    if (!(error instanceof LiveblocksError && error.status === 404)) {
      console.error(`Failed to delete Liveblocks room ${workflow.id}`, error)
    }
  }

  revalidatePath("/workflows", "layout")
  return { ok: true, data: undefined }
}

export const runWorkflowAction = async ({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) => {
  const { orgId } = await auth()

  if (!orgId) {
    throw new Error("No active organization")
  }

  await saveWorkflowGraph({ id, orgId, graph })

  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: "hello from right-sidebar",
  })

  return handle
}

export const cancelWorkflowAction = async (runId: string) => {
  const { orgId } = await auth()
  if (!orgId) throw new Error("No active organization")
  await runs.cancel(runId)
}
