import type { Stagehand } from "@browserbasehq/stagehand"
import { createAgent } from "../lib/agent"

export async function agent({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const result = await createAgent(stagehand).execute({ instruction })
  const [page] = await stagehand.browser.context.pages()

  return {
    success: result.success,
    message: result.message,
    actions: result.actions,
    url: await page.url(),
  }
}
