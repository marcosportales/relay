<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Database types

Derive database types from the Drizzle schema — never hand-write custom or partial
shapes for table rows. Export `typeof table.$inferSelect` (and `$inferInsert` when
needed) from `lib/schema.ts` and import it. When a consumer needs only some
columns, narrow with `Pick<Row, ...>` / `Omit<Row, ...>` rather than redeclaring a
literal type. Don't add an insert type where `db.insert(...).values()` already
enforces the shape.

# JSX text escaping

Escape apostrophes and quotes in JSX text content — raw `'` and `"` trip the
`react/no-unescaped-entities` lint rule. Use `&apos;` for apostrophes and
`&quot;` for quotes (e.g. `you&apos;re`, `doesn&apos;t`). This applies only to
literal text between JSX tags, not to string attribute values or JS strings.

# Component props

When a component receives props, always declare an interface named after the
component plus `Props` (e.g. `WorkflowShell` → `WorkflowShellProps`), define
every prop inside it, and use that interface to type the component's props.
Never type props inline or with an anonymous object literal.

```tsx
interface WorkflowShellProps {
  title: string
  children: React.ReactNode
}

export function WorkflowShell({ title, children }: WorkflowShellProps) {
  // ...
}
```

# React Flow

Don't rely on training data for React Flow (`@xyflow/react`) — its APIs,
component props, hooks, and types change between versions. Before writing or
changing any React Flow code (canvas, custom nodes/edges, handles, hooks,
layouting, etc.), fetch https://reactflow.dev/llms.txt, then follow the links
it lists to the relevant docs pages and base the implementation on them.

<!-- TRIGGER.DEV SKILLS START -->
## Trigger.dev agent skills

This project has Trigger.dev agent skills installed in `.agents/skills/`. Before writing or changing Trigger.dev code (background tasks, scheduled tasks, realtime, or chat.agent AI agents), load the most relevant skill: `trigger-authoring-chat-agent`, `trigger-authoring-tasks`, `trigger-chat-agent-advanced`, `trigger-cost-savings`, `trigger-getting-started`, `trigger-realtime-and-frontend`.
<!-- TRIGGER.DEV SKILLS END -->
