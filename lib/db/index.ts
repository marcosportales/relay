import "server-only"

import { attachDatabasePool } from "@vercel/functions"
import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const pool = new Pool({ connectionString })

// Lets Vercel Fluid compute close idle clients before a function suspends.
attachDatabasePool(pool)

export const db = drizzle({ client: pool, schema })
