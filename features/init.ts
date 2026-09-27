import * as Sentry from "@sentry/node"
import { tasks } from "@trigger.dev/sdk"

// Loaded automatically before any task runs (it sits at the root of the trigger dir).
Sentry.init({
  defaultIntegrations: false,
  dsn: process.env.SENTRY_DSN,
  environment:
    process.env.NODE_ENV === "production" ? "production" : "development",
})

// Report every failed run to Sentry.
tasks.onFailure(({ payload, error, ctx }) => {
  Sentry.captureException(error, {
    extra: {
      payload,
      ctx,
    },
  })
})
