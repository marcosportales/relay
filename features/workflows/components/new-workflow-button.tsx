"use client"

import { PlusIcon } from "lucide-react"
import { useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { createWorkflowAction } from "@/features/workflows/actions"
import { generateSlug } from "@/features/workflows/lib/generate-slug"

export function NewWorkflowButton() {
  const [isPending, startTransition] = useTransition()

  const handleCreateWorkflow = () => {
    startTransition(async () => {
      const result = await createWorkflowAction(generateSlug())

      if (!result.ok) {
        toast.error(result.error)
      }
    })
  }

  return (
    <Button onClick={handleCreateWorkflow} disabled={isPending}>
      <PlusIcon />
      New workflow
    </Button>
  )
}
