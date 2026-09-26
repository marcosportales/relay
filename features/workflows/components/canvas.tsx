"use client"

import React, { useCallback, useSyncExternalStore } from "react"
import {
  addEdge,
  ConnectionLineType,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type ColorMode,
  type Connection,
  type Edge,
  type NodeTypes,
} from "@xyflow/react"

import { StepNode } from "./step-node"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"

import { useTheme } from "next-themes"
import "@xyflow/react/dist/style.css"

const nodeTypes: NodeTypes = { step: StepNode }

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Start", values: {} },
  },
]

const initialEdges: Edge[] = []

const subscribe = () => () => {}
// false on the server and during hydration, true after mount
function useMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  )
}

export function Canvas() {
  const { resolvedTheme } = useTheme()
  const mounted = useMounted()

  const colorMode: ColorMode = mounted
    ? ((resolvedTheme as ColorMode | undefined) ?? "dark")
    : "dark"

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges]
  )

  return (
    <div className="size-full">
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        colorMode={colorMode}
        fitView
        connectionLineType={ConnectionLineType.SmoothStep}
        connectionLineStyle={{ stroke: "var(--border)" }}
        defaultEdgeOptions={{
          type: "smoothstep",
          style: { stroke: "var(--border)" },
        }}
        style={
          {
            "--xy-background-color": "var(--background)",
            "--xy-edge-stroke-width": 2,
            "--xy-connectionline-stroke-width": 2,
          } as React.CSSProperties
        }
        maxZoom={1}
      >
        <Controls />
      </ReactFlow>
    </div>
  )
}
