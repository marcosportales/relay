import type { Stagehand } from "@browserbasehq/stagehand"
import { z } from "zod/v4"

// Stand-in for Stagehand v3's `stagehand.agent()`, which v4 removed. It composes
// the v4 primitives: `extract` reads the page and decides the next step, `act`
// or `page.goto` performs it, until the model reports the task done.

export type AgentOptions = {
  systemPrompt?: string
}

export type AgentExecuteOptions = {
  instruction: string
  maxSteps?: number
}

export type AgentAction = {
  type: "act" | "goto"
  instruction: string
  reasoning: string
  success: boolean
  message: string
}

export type AgentResult = {
  success: boolean
  completed: boolean
  message: string
  actions: AgentAction[]
}

const DecisionSchema = z.object({
  type: z
    .enum(["act", "goto", "done"])
    .describe(
      "act: perform one browser action. goto: navigate to a URL. done: the task is finished or cannot be completed."
    ),
  instruction: z
    .string()
    .describe(
      "For act: one atomic action, e.g. 'click the sign in button'. For goto: the absolute URL. For done: the final answer or outcome."
    ),
  success: z
    .boolean()
    .describe("Only for done: whether the task was accomplished."),
  reasoning: z.string().describe("Why this is the next step."),
})

export function createAgent(stagehand: Stagehand, options: AgentOptions = {}) {
  return {
    async execute({
      instruction,
      maxSteps = 20,
    }: AgentExecuteOptions): Promise<AgentResult> {
      const actions: AgentAction[] = []

      for (let step = 0; step < maxSteps; step++) {
        const history = actions
          .map(
            (a, i) =>
              `${i + 1}. ${a.type} "${a.instruction}" -> ${a.success ? "ok" : "failed"}: ${a.message}`
          )
          .join("\n")

        const { data: decision } = await stagehand.extract(
          [
            options.systemPrompt ??
              "You are a browser automation agent. Decide the single next step toward the task based on the current page.",
            `Task: ${instruction}`,
            `Steps taken so far:\n${history || "none"}`,
            "Return the next step. Use done once the task is complete, or if it is impossible.",
          ].join("\n\n"),
          DecisionSchema
        )

        if (decision.type === "done") {
          return {
            success: decision.success,
            completed: true,
            message: decision.instruction,
            actions,
          }
        }

        const [page] = await stagehand.browser.context.pages()
        let success = true
        let message: string
        try {
          if (decision.type === "goto") {
            await page.goto(decision.instruction, {
              waitUntil: "load",
              timeout: 30_000,
            })
            message = `Navigated to ${await page.url()}`
          } else {
            const { data } = await stagehand.act(decision.instruction)
            success = data.success
            message = data.message
          }
        } catch (error) {
          // A failed step is fed back to the model so it can recover.
          success = false
          message = error instanceof Error ? error.message : String(error)
        }

        actions.push({
          type: decision.type,
          instruction: decision.instruction,
          reasoning: decision.reasoning,
          success,
          message,
        })
      }

      return {
        success: false,
        completed: false,
        message: `Stopped after reaching the ${maxSteps}-step limit`,
        actions,
      }
    },
  }
}
