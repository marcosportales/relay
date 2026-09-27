import toposort from "toposort"
import { logger, metadata, task } from "@trigger.dev/sdk"

import { getWorkflow } from "../data"
import { interpolate } from "../lib/interpolate"
import { browserbase, Stagehand } from "@browserbasehq/stagehand"
import { nodeExecutors } from "../nodes/node-executors"
import type { StepNodeData } from "../nodes/node-registry"

// The JSON value run metadata accepts; the SDK doesn't export it by name.
type Json = Parameters<typeof metadata.set>[1]

export type RunStepStatus = "pending" | "running" | "done" | "failed"

// Travels through run metadata and output, so every field must stay plain JSON.
export type RunStep = Pick<StepNodeData, "type" | "title"> & {
  id: string
  status: RunStepStatus
  startedAt?: number // epoch ms, set when the step starts running
  durationMs?: number // set once the step is done or failed
  output?: Json
  error?: string
}

// Executors return arbitrary values; round-trip them so only plain JSON reaches
// metadata (class instances, functions and undefined would not survive it anyway).
const toJson = (value: unknown): Json =>
  value === undefined ? null : JSON.parse(JSON.stringify(value))

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

    let steps: RunStep[] = order.flatMap((id) => {
      const node = byId.get(id)
      if (!node || !nodeExecutors[node.data.type]) return []
      const { type, title } = node.data
      return [{ id, type, title, status: "pending" }]
    })
    metadata.set("steps", steps)

    const updateStep = (id: string, patch: Partial<RunStep>) => {
      steps = steps.map((step) => (step.id === id ? { ...step, ...patch } : step))
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

        const startedAt = Date.now()
        updateStep(id, { status: "running", startedAt })
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
          updateStep(id, {
            status: "failed",
            durationMs: Date.now() - startedAt,
            error: error instanceof Error ? error.message : String(error),
          })
          // A thrown run returns no output, so the flushed metadata is the only
          // way the failed state reaches the canvas.
          await metadata.flush()
          throw error
        }

        updateStep(id, {
          status: "done",
          durationMs: Date.now() - startedAt,
          output: toJson(outputs[id]),
        })
      }
    } finally {
      await stagehand?.close()
      await browser?.close()
    }

    return { steps }
  },
})
