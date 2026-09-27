import { resend } from "@/lib/resend"

export async function sendEmail({
  to,
  subject,
  body,
}: {
  to: string
  subject: string
  body: string
}) {
  // Resend returns { data, error } instead of throwing, so fail the step explicitly.
  const { data, error } = await resend.emails.send({
    from: "onboarding@resend.dev",
    to,
    subject,
    text: body,
  })

  if (error) throw new Error(`Failed to send email: ${error.message}`)

  return { id: data.id }
}
