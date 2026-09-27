import { sentryEsbuildPlugin } from "@sentry/esbuild-plugin"
import { esbuildPlugin } from "@trigger.dev/build/extensions"
import { defineConfig } from "@trigger.dev/sdk"

export default defineConfig({
  project: "proj_awiyjtlypxfhjkyomrtu",
  runtime: "node-24",
  logLevel: "log",
  // The max compute seconds a task is allowed to run. If the task run exceeds this duration, it will be stopped.
  // You can override this on an individual task.
  // See https://trigger.dev/docs/runs/max-duration
  maxDuration: 3600,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  dirs: ["features"],
  build: {
    // Stagehand resolves its extension zip relative to its own module file, so it
    // must load from node_modules rather than be bundled into the task.
    external: ["@browserbasehq/stagehand"],
    extensions: [
      // Upload source maps to Sentry on deploy so task stack traces are readable.
      esbuildPlugin(
        sentryEsbuildPlugin({
          org: "marcoss-organization",
          project: "relay",
          authToken: process.env.SENTRY_AUTH_TOKEN,
        }),
        { placement: "last", target: "deploy" },
      ),
    ],
  },
})
