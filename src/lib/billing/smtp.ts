import "server-only";
import nodemailer from "nodemailer";
import { BillingError } from "./policy";
export function smtpConfiguration() {
  const host = process.env.SMTP_HOST?.trim(),
    username = process.env.SMTP_USER?.trim(),
    password = process.env.SMTP_PASSWORD;
  const from =
    process.env.SMTP_FROM?.trim() || process.env.EMAIL_FROM_ADDRESS?.trim();
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !username || !password || !from)
    throw new BillingError(
      "Set SMTP_HOST, SMTP_USER, SMTP_PASSWORD and SMTP_FROM before sending billing emails",
      503,
    );
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new BillingError("Invalid SMTP_PORT", 503);
  return {
    host,
    port,
    secure:
      process.env.SMTP_SECURE === undefined
        ? port === 465
        : process.env.SMTP_SECURE === "true",
    auth: { user: username, pass: password },
    from,
  };
}
export function createBillingTransport() {
  const { from, ...options } = smtpConfiguration();
  return {
    from,
    transport: nodemailer.createTransport({
      ...options,
      pool: true,
      maxConnections: 3,
      requireTLS: !options.secure,
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 12000,
      disableFileAccess: true,
      disableUrlAccess: true,
    }),
  };
}
