import { createDatabaseBackup, DumpResult } from "./db-dumper";
import {
  uploadToR2,
  pruneOldBackups,
  listR2Backups,
  getBackupDownloadUrl,
  isR2Configured,
  getR2Config,
  BackupMetadata,
} from "../storage/cloudflare-r2";

export interface BackupWorkflowResult {
  success: boolean;
  backup: {
    key: string;
    bucket: string;
    filename: string;
    sizeBytes: number;
    sizeKb: number;
    rawSizeKb: number;
    tablesCount: number;
    rowsCount: number;
    engine: string;
    createdAt: string;
  };
  pruning: {
    retentionDays: number;
    cutoffDate: string;
    deletedCount: number;
    deletedKeys: string[];
    keptCount: number;
  };
  durationMs: number;
}

/**
 * Runs the end-to-end database backup and retention pruning workflow.
 * 1. Creates a compressed PostgreSQL dump (native Node or pg_dump).
 * 2. Uploads the dump to Cloudflare R2 bucket.
 * 3. Enforces retention policy by pruning backups older than retentionDays (default: 365 days).
 */
export async function runBackupWorkflow({
  retentionDays = 365,
  prefix = "backups/db/",
}: {
  retentionDays?: number;
  prefix?: string;
} = {}): Promise<BackupWorkflowResult> {
  const startTime = Date.now();

  if (!isR2Configured()) {
    const config = (() => {
      try {
        return getR2Config();
      } catch (e: any) {
        throw new Error(`Cloudflare R2 is not configured: ${e.message}`);
      }
    })();
  }

  // 1. Create database dump
  const dump: DumpResult = await createDatabaseBackup();

  // 2. Upload to Cloudflare R2
  const r2Key = `${prefix.replace(/\/+$/, "")}/${dump.filename}`;
  const uploaded = await uploadToR2({
    key: r2Key,
    body: dump.buffer,
    contentType: "application/gzip",
    metadata: {
      "tables-count": String(dump.tablesCount),
      "rows-count": String(dump.rowsCount),
      "created-at": dump.createdAt,
      engine: dump.engine,
    },
  });

  // 3. Prune old backups older than retentionDays (1 year retention)
  const pruning = await pruneOldBackups({
    retentionDays,
    prefix,
  });

  const durationMs = Date.now() - startTime;

  return {
    success: true,
    backup: {
      key: uploaded.key,
      bucket: uploaded.bucket,
      filename: dump.filename,
      sizeBytes: dump.sizeBytes,
      sizeKb: +(dump.sizeBytes / 1024).toFixed(2),
      rawSizeKb: +(dump.rawSizeBytes / 1024).toFixed(2),
      tablesCount: dump.tablesCount,
      rowsCount: dump.rowsCount,
      engine: dump.engine,
      createdAt: dump.createdAt,
    },
    pruning: {
      retentionDays,
      cutoffDate: pruning.cutoffDate.toISOString(),
      deletedCount: pruning.deletedKeys.length,
      deletedKeys: pruning.deletedKeys,
      keptCount: pruning.keptCount,
    },
    durationMs,
  };
}

/**
 * Lists all database backups stored in Cloudflare R2.
 */
export async function listDatabaseBackups(prefix = "backups/db/"): Promise<BackupMetadata[]> {
  return await listR2Backups(prefix);
}

/**
 * Generates a presigned download link for a specific backup file.
 */
export async function getBackupUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  return await getBackupDownloadUrl(key, expiresInSeconds);
}
