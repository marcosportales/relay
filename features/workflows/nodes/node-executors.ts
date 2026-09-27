import type { Stagehand } from "@browserbasehq/stagehand"
import { act } from "./act"
import { agent } from "./agent"
import { extract } from "./extract"
import { ActionNodeType, NodeType } from "./node-registry"
import { observe } from "./observe"
import { openUrl } from "./open-url"

export type NodeContext = {
  values: Record<string, string>
  getStagehand: () => Promise<Stagehand>
}

export type NodeExecutor = (ctx: NodeContext) => Promise<unknown>

export const nodeExecutors: Partial<Record<NodeType, NodeExecutor>> = {
  "open-url": async ({ getStagehand, values }) =>
    openUrl({ stagehand: await getStagehand(), url: values.url }),
  act: async ({ getStagehand, values }) =>
    act({ stagehand: await getStagehand(), instruction: values.instruction }),
  extract: async ({ getStagehand, values }) =>
    extract({ stagehand: await getStagehand(), instruction: values.instruction }),
  observe: async ({ getStagehand, values }) =>
    observe({ stagehand: await getStagehand(), instruction: values.instruction }),
  agent: async ({ getStagehand, values }) =>
    agent({ stagehand: await getStagehand(), instruction: values.instruction }),
} satisfies Record<ActionNodeType, NodeExecutor>
