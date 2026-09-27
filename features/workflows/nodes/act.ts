import type { Stagehand } from "@browserbasehq/stagehand"

export async function act({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.act(instruction)
  const [page] = await stagehand.browser.context.pages()

  return { success: data.success, message: data.message, url: await page.url() }
}
