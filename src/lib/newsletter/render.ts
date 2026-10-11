import "server-only";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";
import type { BroadcastInput } from "./model";
export const siteOrigin = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "https://www.hstuma.com").replace(
    /\/$/,
    "",
  );
export const escapeHtml = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export function renderNewsletter(
  input: BroadcastInput,
  attachments: Array<{ id: string; name: string }> = [],
) {
  const raw =
    input.format === "markdown"
      ? marked.parse(input.body, { async: false })
      : input.body;
  const body = sanitizeHtml(raw, {
    allowedTags: [
      "p",
      "br",
      "h1",
      "h2",
      "h3",
      "h4",
      "strong",
      "em",
      "b",
      "i",
      "u",
      "s",
      "blockquote",
      "ul",
      "ol",
      "li",
      "a",
      "img",
      "hr",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "pre",
      "code",
      "div",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["src", "alt", "width", "height"],
      "*": ["style"],
    },
    allowedSchemes: ["https", "mailto"],
    allowProtocolRelative: false,
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,8}$/, /^rgb\([\d,\s]+\)$/],
        "background-color": [/^#[0-9a-fA-F]{3,8}$/],
        "text-align": [/^left$|^right$|^center$/],
        "font-weight": [/^bold$|^normal$|^[1-9]00$/],
      },
    },
  });
  const links = attachments
    .map(
      (a) =>
        `<p><a href="${escapeHtml(siteOrigin())}/api/newsletter/attachments/${a.id}" style="color:#6428bd">Download ${escapeHtml(a.name)}</a></p>`,
    )
    .join("");
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>img{max-width:100%;height:auto}table{max-width:100%}p,li{line-height:1.7}a{color:#6428bd}pre{white-space:pre-wrap}</style></head><body style="margin:0;background:#f5f3f8;color:#24202d;font-family:Arial,sans-serif"><table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td style="padding:32px 16px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;margin:auto;background:#fff;border-radius:16px;overflow:hidden"><tr><td style="padding:24px 32px;border-bottom:3px solid #0098ad"><span style="color:#6428bd;font-size:24px;font-weight:bold">KAIZEN</span><br><span style="color:#00798b;font-size:11px;letter-spacing:2px">KARATE ACADEMY · NEWSLETTER</span></td></tr><tr><td style="padding:32px"><h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.25">${escapeHtml(input.subject)}</h1>${body}${links}</td></tr><tr><td style="padding:24px 32px;background:#f0fafb;font-size:12px;line-height:1.7;color:#565160">Discipline. Respect. Progress.<br>You receive academy updates because you subscribed or registered an academy account.<br><a href="{{{RESEND_UNSUBSCRIBE_URL}}}" style="color:#00798b">Unsubscribe</a> · <a href="${escapeHtml(siteOrigin())}" style="color:#00798b">Visit the academy</a></td></tr></table></td></tr></table></body></html>`;
}
