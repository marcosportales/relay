import toposort from "toposort"
import type { WorkflowGraph } from "@/lib/db/schema"

export function validateGraph({ nodes, edges }: WorkflowGraph): string[] {
  const problems: string[] = []

  const triggers = nodes.filter((node) => node.data.kind === "trigger").length
  if (triggers !== 1) {
    problems.push(
      `A workflow needs exactly 1 Start trigger (found ${triggers})`
    )
  }

  if (edges.length === 0) {
    problems.push("Connect your nodes before running.")
  } else {
    try {
      toposort(edges.map((e) => [e.source, e.target]))
    } catch {
      problems.push("Workflow has a cycle - remove the loop before running")
    }
  }

  return problems
}
