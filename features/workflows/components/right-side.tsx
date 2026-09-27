"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Play, Trash2 } from "lucide-react"
import { useReactFlow, useStore, useStoreApi } from "@xyflow/react"
import { toast } from "sonner"

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import {
  deleteWorkflowAction,
  runWorkflowAction,
} from "@/features/workflows/actions"
import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"
import {
  useUpstreamConnections,
  type UpstreamConnection,
} from "@/features/workflows/hooks/use-upstream-connections"
import { validateGraph } from "../lib/validate-graph"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

type FieldElement = HTMLInputElement | HTMLTextAreaElement

interface FieldProps {
  field: NodeField
  value: string
  onChange: (value: string) => void
  onFocus: () => void
  ref: (el: FieldElement | null) => void
}

// A single editor field for a node property: a textarea when the field is
// multiline, otherwise a single-line input.
function Field({ field, value, onChange, onFocus, ref }: FieldProps) {
  const props = {
    id: field.key,
    value,
    placeholder: field.placeholder,
    onFocus,
    ref,
  }

  if (field.multiline) {
    return (
      <Textarea
        {...props}
        className="min-h-24"
        onChange={(e) => onChange(e.target.value)}
      />
    )
  }

  return <Input {...props} onChange={(e) => onChange(e.target.value)} />
}

interface ConnectionChipsProps {
  connections: UpstreamConnection[]
  onInsert: (token: string) => void
}

// Outputs of upstream nodes; clicking one inserts its {{ }} token into a field.
function ConnectionChips({ connections, onInsert }: ConnectionChipsProps) {
  return (
    <div className="mt-1 flex flex-col gap-2 border-t border-dashed border-border pt-4">
      <p className="text-xs font-medium">Connections</p>
      <div className="flex flex-wrap gap-1.5">
        {connections.map((connection) => (
          <Button
            key={connection.token}
            variant="outline"
            size="sm"
            title={connection.token}
            className="gap-1.5 rounded-md pr-2 pl-1.5 text-xs font-normal"
            // Keep focus (and the caret) in the field being edited.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onInsert(connection.token)}
          >
            <NodeIcon
              type={connection.nodeType}
              className="size-4.5 rounded-sm [&_svg]:size-3"
            />
            {connection.label}
          </Button>
        ))}
      </div>
    </div>
  )
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()
  const connections = useUpstreamConnections(node?.id)
  // The field last focused, and each field's element, so a chip click can
  // insert at the caret. Reset per node via the `key` on <Inspector>.
  const [activeKey, setActiveKey] = useState<string>()
  const fieldRefs = useRef<Record<string, FieldElement | null>>({})

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  const insertToken = (token: string) => {
    const field = def.fields.find((f) => f.key === activeKey) ?? def.fields[0]
    if (!field) return

    // Replace the selection in the last-edited field; append to an untouched one.
    const el = fieldRefs.current[field.key]
    const value = values[field.key] ?? ""
    const touched = field.key === activeKey
    const start = touched ? (el?.selectionStart ?? value.length) : value.length
    const end = touched ? (el?.selectionEnd ?? value.length) : value.length

    updateNodeData(node.id, {
      values: {
        ...values,
        [field.key]: value.slice(0, start) + token + value.slice(end),
      },
    })
    setActiveKey(field.key)

    // Wait for the new value to render, then put the caret after the token.
    requestAnimationFrame(() => {
      const caret = start + token.length
      el?.focus()
      el?.setSelectionRange(caret, caret)
    })
  }

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Field
                field={field}
                value={values[field.key] ?? ""}
                onChange={(value) => {
                  updateNodeData(node.id, {
                    values: { ...values, [field.key]: value },
                  })
                }}
                onFocus={() => setActiveKey(field.key)}
                ref={(el) => {
                  fieldRefs.current[field.key] = el
                }}
              />
            </div>
          ))
        )}
        {def.fields.length > 0 && connections.length > 0 && (
          <ConnectionChips connections={connections} onInsert={insertToken} />
        )}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// Next numbered title for a node type ("Open URL 1", "Open URL 2", ...). Uses the
// highest existing number, so deleting a node never produces a duplicate title.
function nextTitle(label: string, nodes: StepNodeType[]) {
  const prefix = `${label} `
  const max = nodes.reduce((acc, node) => {
    const { title } = node.data
    if (!title.startsWith(prefix)) return acc
    const suffix = title.slice(prefix.length)
    return /^\d+$/.test(suffix) ? Math.max(acc, Number(suffix)) : acc
  }, 0)
  return `${label} ${max + 1}`
}

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  const { getNodes, addNodes } = useReactFlow<StepNodeType>()
  const store = useStoreApi<StepNodeType>()

  const add = (type: NodeType) => {
    const def: NodeDefinition = nodeRegistry[type]
    const nodes = getNodes()

    if (
      def.kind === "trigger" &&
      nodes.some((n) => n.data.kind === "trigger")
    ) {
      toast.error("A workflow can only have one trigger")
      return
    }

    // Center of the visible canvas, converted from screen to flow coordinates.
    const { width, height, transform } = store.getState()
    const [x, y, zoom] = transform
    const position = { x: (width / 2 - x) / zoom, y: (height / 2 - y) / zoom }

    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position,
      data: {
        type,
        kind: def.kind,
        title: def.kind === "trigger" ? def.label : nextTitle(def.label, nodes),
        values: {},
      },
    })
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

interface ActionsMenuProps {
  workflowId: string
}

// The "..." menu for workflow-level actions.
function ActionsMenu({ workflowId }: ActionsMenuProps) {
  const [isDeleting, startDeleting] = useTransition()
  const router = useRouter()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-48">
        <DropdownMenuItem
          variant="destructive"
          className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
          disabled={isDeleting}
          onSelect={(e) => {
            // Keep the menu open so the disabled state stays visible.
            e.preventDefault()
            startDeleting(async () => {
              const result = await deleteWorkflowAction(workflowId)

              if (!result.ok) {
                toast.error(result.error)
                return
              }

              toast.success("Workflow deleted")
              router.push("/")
            })
          }}
        >
          {isDeleting ? <Spinner /> : <Trash2 />}
          {isDeleting ? "Deleting workflow..." : "Delete workflow"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface RunButtonProps {
  workflowId: string
}

// Kicks off a run of the current workflow.
function RunButton({ workflowId }: RunButtonProps) {
  const { getNodes, getEdges } = useReactFlow<StepNodeType>()
  const [isPending, startTransition] = useTransition()

  return (
    <Button
      size="sm"
      variant="secondary"
      disabled={isPending}

      onClick={() => {
        const graph = { nodes: getNodes(), edges: getEdges() }
        const problems = validateGraph(graph)

        if (problems.length > 0) {
          toast.error(problems[0])
          return
        }

        startTransition(async () => {
          await runWorkflowAction({ id: workflowId, graph })
          /* const result = await runWorkflowAction({ id: workflowId, graph })

          if (!result.ok) {
            toast.error(result.error)
            return
          }

          toast.success("Workflow started") */
        })
      }}
    >
      {isPending ? <Spinner /> : <Play fill="primary" />}
      {isPending ? "Running..." : "Run"}
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

interface RightSideProps {
  workflowId: string
}

export function RightSide({ workflowId }: RightSideProps) {
  const [tab, setTab] = useState("toolbar")

  const selected = useStore((s) => s.nodes.find((n) => n.selected)) as
    StepNodeType | undefined

  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)

  if (selected && selected.id !== prevSelectedId) setPrevSelectedId(selected.id)

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton workflowId={workflowId} />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector key={selected?.id} node={selected} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}
