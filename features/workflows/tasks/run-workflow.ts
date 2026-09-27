import toposort from "toposort"
import { logger, task } from "@trigger.dev/sdk"

import { getWorkflow } from "../data"

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async ({ workflowId, orgId }: { workflowId: string; orgId: string }) => {
    const workflow = await getWorkflow(orgId, workflowId)
    if (!workflow?.graph) throw new Error(`Workflow ${workflowId} has no graph`)
    const { nodes, edges } = workflow.graph
    const byId = new Map(nodes.map((n) => [n.id, n]))
    const connected = new Set(edges.flatMap((e) => [e.source, e.target]))

    const order = toposort
      .array(
        nodes.map((n) => n.id),
        edges.map((e) => [e.source, e.target])
      )
      .filter((id) => connected.has(id))

    logger.log(`Running step: ${workflow.name}`, { steps: order.length })

    for (const id of order) {
      const node = byId.get(id)
      logger.log(`Running step: ${node?.data.title}`)
      // TODO: actually execute the node instead of just logging, and report
      // its progress so the UI can watch the run live
    }

    return { steps: order.length }
  },
})
