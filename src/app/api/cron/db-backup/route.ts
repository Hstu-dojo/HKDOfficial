import { NextResponse } from "next/server";
import { runBackupWorkflow, listDatabaseBackups } from "@/lib/backup/backup-service";
import { isR2Configured } from "@/lib/storage/cloudflare-r2";

export const maxDuration = 300; // Allow up to 5 minutes on Vercel Pro/Enterprise or server environments
export const dynamic = "force-dynamic";

/**
 * Validates whether the incoming cron request has valid authorization.
 */
function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim();

  // If no CRON_SECRET is configured:
  // In development, allow triggering for testing.
  // In production, reject for security.
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  const headerSecret = request.headers.get("x-cron-secret");
  if (headerSecret === cronSecret) {
    return true;
  }

  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  if (querySecret === cronSecret) {
    return true;
  }

  return false;
}

/**
 * GET /api/cron/db-backup
 * Triggered daily by Vercel Cron, external cron services, or GitHub Actions.
 */
export async function GET(request: Request) {
  return handleBackupExecution(request);
}

/**
 * POST /api/cron/db-backup
 * Allows POST invocation with webhook or admin automation.
 */
export async function POST(request: Request) {
  return handleBackupExecution(request);
}

async function handleBackupExecution(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      {
        error: "Unauthorized",
        message: "Invalid or missing cron authorization secret.",
      },
      { status: 401 }
    );
  }

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error: "Storage adapter not configured",
        message:
          "Cloudflare R2 credentials missing. Please set CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, and CLOUDFLARE_R2_BUCKET_NAME.",
      },
      { status: 503 }
    );
  }

  try {
    const url = new URL(request.url);
    const retentionDays = parseInt(
      url.searchParams.get("retentionDays") ||
        process.env.BACKUP_RETENTION_DAYS ||
        "365",
      10
    );

    console.log(`[CRON] Starting daily database backup to Cloudflare R2 (Retention: ${retentionDays} days)...`);

    const result = await runBackupWorkflow({
      retentionDays,
      prefix: "backups/db/",
    });

    console.log(
      `[CRON] Backup complete: ${result.backup.filename} (${result.backup.sizeKb} KB) uploaded to ${result.backup.bucket}. Kept: ${result.pruning.keptCount}, Deleted: ${result.pruning.deletedCount}.`
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("[CRON] Database backup failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to execute database backup",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
