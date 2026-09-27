import type { Stagehand } from "@browserbasehq/stagehand"

export async function observe({
  stagehand,
  instruction,
}: {
  stagehand: Stagehand
  instruction: string
}) {
  const { data } = await stagehand.observe(instruction)

  return {
    matches: data.map(({ selector, description }) => ({
      selector,
      description,
    })),
  }
}
