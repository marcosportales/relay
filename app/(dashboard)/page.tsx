import { WorkflowIcon } from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { NewWorkflowButton } from "@/features/workflows/components/new-workflow-button"

export default function Page() {
  return (
    <div className="flex min-h-svh">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl">
            <WorkflowIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base">No workflow selected</EmptyTitle>
          <EmptyDescription>
            Select a workflow from the sidebar or create a new one to get
            started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <NewWorkflowButton />
        </EmptyContent>
      </Empty>
    </div>
  )
}
