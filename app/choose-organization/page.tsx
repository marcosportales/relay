import { TaskChooseOrganization } from "@clerk/nextjs"

export default function ChooseOrganizationPage() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <TaskChooseOrganization redirectUrlComplete="/" />
    </div>
  )
}
