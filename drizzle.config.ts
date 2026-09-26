import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"

loadEnvConfig(process.cwd())

// Migrations need a direct connection; the pooled one breaks session state.
const url = process.env.DATABASE_URL_UNPOOLED

if (!url) {
  throw new Error("DATABASE_URL_UNPOOLED is not set")
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url },
})
