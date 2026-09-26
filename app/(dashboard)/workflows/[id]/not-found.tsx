import Link from "next/link"
import { ArrowLeftIcon, SearchXIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function NotFound() {
  return (
    <div className="flex min-h-svh">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-12 rounded-xl">
            <SearchXIcon className="size-5" />
          </EmptyMedia>
          <EmptyTitle className="text-base">Workflow not found</EmptyTitle>
          <EmptyDescription>
            This workflow doesn&apos;t exist or you don&apos;t have access to
            it.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild variant="outline">
            <Link href="/">
              <ArrowLeftIcon />
              Back to workflows
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
