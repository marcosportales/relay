import { notFound } from "next/navigation"

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="flex min-h-svh items-center justify-center">
      <p className="text-sm text-muted-foreground">
        Workflow <span className="font-mono text-foreground">{id}</span>
      </p>
    </div>
  )
}
