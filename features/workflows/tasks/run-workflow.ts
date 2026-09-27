import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"

import { getWorkflow } from "../data"
import { interpolate } from "../lib/interpolate"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"

export type RunStepStatus = "pending" | "running" | "done" | "failed"

export type RunStep = {
  id: string
  status: RunStepStatus
}

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

    let steps: RunStep[] = order
      .filter((id) => {
        const type = byId.get(id)?.data.type
        return type !== undefined && nodeExecutors[type] !== undefined
      })
      .map((id) => ({ id, status: "pending" }))
    metadata.set("steps", steps)

    const setStepStatus = (id: string, status: RunStepStatus) => {
      steps = steps.map((step) => (step.id === id ? { ...step, status } : step))
      metadata.set("steps", steps)
    }

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

        setStepStatus(id, "running")
        // Push "running" now, or a fast step's "done" overwrites it before the
        // periodic flush and the canvas never sees it.
        await metadata.flush()

        try {
          const values = Object.fromEntries(
            Object.entries(node.data.values).map(([key, value]) => [
              key,
              interpolate(value, outputs),
            ])
          )
          outputs[id] = await executor({ values, getStagehand })
        } catch (error) {
          setStepStatus(id, "failed")
          // A thrown run returns no output, so the flushed metadata is the only
          // way the failed state reaches the canvas.
          await metadata.flush()
          throw error
        }

        setStepStatus(id, "done")
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return { steps }
  },
})
