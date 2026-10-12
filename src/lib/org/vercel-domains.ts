import "server-only";
export type ProjectDomain = {
  name: string;
  verified?: boolean;
  redirect?: string | null;
  gitBranch?: string | null;
  customEnvironmentId?: string | null;
};
function config() {
  const project = process.env.VERCEL_PROJECT_ID,
    token = process.env.VERCEL_API_TOKEN;
  if (!project || !token)
    throw new Error("Vercel domain credentials are not configured");
  return { project, token };
}
export async function vercelDomainRequest(
  path = "",
  method = "GET",
  body?: unknown,
) {
  const { project, token } = config();
  const url = new URL(
    `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains${path}`,
  );
  if (process.env.VERCEL_TEAM_ID)
    url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error("Unable to access project domains in Vercel");
  return response.status === 204 ? {} : response.json();
}
export async function listProjectDomains(): Promise<ProjectDomain[]> {
  const { project, token } = config();
  const all: ProjectDomain[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < 100; page++) {
    const url = new URL(
      `https://api.vercel.com/v9/projects/${encodeURIComponent(project)}/domains`,
    );
    url.searchParams.set("limit", "100");
    if (cursor) url.searchParams.set("until", cursor);
    if (process.env.VERCEL_TEAM_ID)
      url.searchParams.set("teamId", process.env.VERCEL_TEAM_ID);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok)
      throw new Error("Unable to read project domains from Vercel");
    const data = await response.json();
    if (!Array.isArray(data.domains))
      throw new Error("Invalid domain list from Vercel");
    all.push(...data.domains);
    const next = data.pagination?.next;
    if (next === null || next === undefined) return all;
    if (String(next) === cursor)
      throw new Error("Invalid Vercel domain pagination");
    cursor = String(next);
  }
  throw new Error("Domain list exceeds the supported size");
}
