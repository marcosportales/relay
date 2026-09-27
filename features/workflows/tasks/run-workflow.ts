import toposort from "toposort"
import { logger, task } from "@trigger.dev/sdk"

import { getWorkflow } from "../data"
import { interpolate } from "../lib/interpolate"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"

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

    logger.log(`Running workflow: ${workflow.name}`, { steps: order.length })

    let browser: Awaited<ReturnType<typeof browserbase.launch>> | undefined
    let stagehand: Stagehand | undefined
    const getStagehand = async () => {
      if (stagehand) return stagehand

      browser = await browserbase.launch({
        apiKey: process.env.BROWSERBASE_API_KEY!,
        projectId: process.env.BROWSERBASE_PROJECT_ID,
      })

      stagehand = await Stagehand.create({
        browser,
        model: { modelName: "google/gemini-2.5-flash" },
        logging: { level: "off" },
      })

      return stagehand
    }

    const outputs: Record<string, unknown> = {}

    try {
      for (const id of order) {
        const node = byId.get(id)
        if (!node)
          throw new Error(
            `Workflow ${workflowId} references unknown node ${id}`
          )
        logger.log(`Running step: ${node.data.title}`)
        const executor = nodeExecutors[node.data.type]
        if (!executor) continue
        const values = Object.fromEntries(
          Object.entries(node.data.values).map(([key, value]) => [
            key,
            interpolate(value, outputs),
          ])
        )
        outputs[id] = await executor({ values, getStagehand })
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return { steps: order.length }
  },
})
