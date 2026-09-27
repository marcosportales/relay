import { get } from "es-toolkit/compat"

const PLACEHOLDER = /\{\{\s*([^{}]+?)\s*\}\}/g

export function interpolate(
  text: string,
  outputs: Record<string, unknown>
): string {
  return text.replace(PLACEHOLDER, (_, path: string) => {
    const value = get(outputs, path)

    if (value === undefined || value === null) return ""
    if (typeof value === "object") return JSON.stringify(value)
    return String(value)
  })
}
