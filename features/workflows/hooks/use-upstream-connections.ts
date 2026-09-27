"use client"

import { useMemo } from "react"
import { getIncomers, useStore, type ReactFlowState } from "@xyflow/react"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeType,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

export type UpstreamConnection = {
  token: string // ready-to-insert placeholder, e.g. "{{ <node-id>.title }}"
  label: string // e.g. "Open URL 1 · Title"
  nodeType: NodeType
}

const selectNodes = (s: ReactFlowState) => s.nodes as StepNodeType[]
const selectEdges = (s: ReactFlowState) => s.edges

// Every output produced by any node upstream of `nodeId`, nearest nodes first.
export function useUpstreamConnections(
  nodeId: string | undefined
): UpstreamConnection[] {
  const nodes = useStore(selectNodes)
  const edges = useStore(selectEdges)

  return useMemo(() => {
    if (!nodeId) return []

    // Breadth-first walk back along incoming edges; `seen` guards against cycles.
    const seen = new Set([nodeId])
    const upstream: StepNodeType[] = []
    let frontier = [{ id: nodeId }]

    while (frontier.length > 0) {
      const next: StepNodeType[] = []
      for (const node of frontier) {
        for (const incomer of getIncomers(node, nodes, edges)) {
          if (seen.has(incomer.id)) continue
          seen.add(incomer.id)
          next.push(incomer)
        }
      }
      upstream.push(...next)
      frontier = next
    }

    return upstream.flatMap((node) => {
      const def: NodeDefinition = nodeRegistry[node.data.type]
      return def.outputs.map((output) => ({
        token: `{{ ${node.id}.${output.path} }}`,
        label: `${node.data.title} · ${output.label}`,
        nodeType: node.data.type,
      }))
    })
  }, [nodeId, nodes, edges])
}
