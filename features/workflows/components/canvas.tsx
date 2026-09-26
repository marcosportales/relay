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
  type Node,
} from "@xyflow/react"
import { useTheme } from "next-themes"

import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  { id: "1", position: { x: 0, y: 0 }, data: { label: "Trigger" } },
  { id: "2", position: { x: 0, y: 120 }, data: { label: "Action" } },
]

const initialEdges: Edge[] = [{ id: "1-2", source: "1", target: "2" }]

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
