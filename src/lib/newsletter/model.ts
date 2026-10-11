import { z } from "zod";
export const subscriptionSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    name: z.string().trim().max(120).optional().default(""),
  })
  .strict();
export const broadcastSchema = z
  .object({
    subject: z
      .string()
      .trim()
      .min(3)
      .max(240)
      .refine((v) => !/[\r\n]/.test(v), "Subject must be one line"),
    body: z.string().trim().min(5).max(60000),
    format: z.enum(["markdown", "html"]),
    attachments: z.array(z.string().uuid()).max(8).default([]),
  })
  .strict();
export type BroadcastInput = z.infer<typeof broadcastSchema>;
export function recoverBroadcast(remote: {
  status?: string;
  sent_at?: string | null;
}) {
  if (
    remote.sent_at ||
    ["sent", "sending", "queued", "scheduled"].includes(remote.status || "")
  )
    return "sent";
  // A draft following an uncertain send must be reviewed, never blindly resent.
  return "unknown";
}
