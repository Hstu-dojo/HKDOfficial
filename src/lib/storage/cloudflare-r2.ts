import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
  HeadBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
  publicUrl?: string;
}

export interface BackupMetadata {
  key: string;
  sizeBytes: number;
  lastModified?: Date;
  tablesCount?: number;
  rowsCount?: number;
  engine?: string;
  checksum?: string;
}

/**
 * Validates and retrieves Cloudflare R2 configuration from environment variables.
 */
export function getR2Config(): R2Config {
  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim() || "";
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim() || "";
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim() || "";
  const bucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "hkd-backups";
  
  // Custom endpoint or standard Cloudflare R2 S3 endpoint
  const endpoint =
    process.env.CLOUDFLARE_R2_ENDPOINT?.trim() ||
    (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : "");

  const missing: string[] = [];
  if (!accountId && !endpoint) missing.push("CLOUDFLARE_R2_ACCOUNT_ID (or CLOUDFLARE_R2_ENDPOINT)");
  if (!accessKeyId) missing.push("CLOUDFLARE_R2_ACCESS_KEY_ID");
  if (!secretAccessKey) missing.push("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  if (!bucketName) missing.push("CLOUDFLARE_R2_BUCKET_NAME");

  if (missing.length > 0) {
    throw new Error(
      `Cloudflare R2 is not fully configured. Missing environment variables: ${missing.join(", ")}`
    );
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
    publicUrl: process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim(),
  };
}

/**
 * Checks whether Cloudflare R2 credentials are present in the environment.
 */
export function isR2Configured(): boolean {
  try {
    getR2Config();
    return true;
  } catch {
    return false;
  }
}

let cachedS3Client: S3Client | null = null;

/**
 * Returns an AWS S3Client instance configured for Cloudflare R2.
 */
export function getR2Client(): S3Client {
  if (cachedS3Client) return cachedS3Client;

  const config = getR2Config();
  cachedS3Client = new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    // Force path style is false for R2 (R2 supports virtual host or direct bucket routing)
    forcePathStyle: false,
  });

  return cachedS3Client;
}

/**
 * Verifies R2 connection and bucket accessibility.
 */
export async function verifyR2Connection(): Promise<{ success: boolean; message: string; bucket: string }> {
  try {
    const config = getR2Config();
    const client = getR2Client();
    await client.send(new HeadBucketCommand({ Bucket: config.bucketName }));
    return {
      success: true,
      message: `Successfully connected to Cloudflare R2 bucket "${config.bucketName}".`,
      bucket: config.bucketName,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || "Failed to connect to Cloudflare R2",
      bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME || "unknown",
    };
  }
}

/**
 * Uploads a file (buffer or string) to Cloudflare R2.
 */
export async function uploadToR2({
  key,
  body,
  contentType = "application/gzip",
  metadata = {},
}: {
  key: string;
  body: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
}): Promise<{ key: string; bucket: string; sizeBytes: number }> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata,
    })
  );

  return {
    key,
    bucket: config.bucketName,
    sizeBytes: body.length,
  };
}

/**
 * Lists backups in Cloudflare R2 matching a prefix (e.g. "backups/db/").
 */
export async function listR2Backups(prefix = "backups/db/"): Promise<BackupMetadata[]> {
  const config = getR2Config();
  const client = getR2Client();

  const command = new ListObjectsV2Command({
    Bucket: config.bucketName,
    Prefix: prefix,
  });

  const response = await client.send(command);
  const items = response.Contents || [];

  return items
    .filter((item) => !!item.Key)
    .map((item) => ({
      key: item.Key!,
      sizeBytes: item.Size || 0,
      lastModified: item.LastModified,
    }))
    .sort((a, b) => {
      const timeA = a.lastModified?.getTime() || 0;
      const timeB = b.lastModified?.getTime() || 0;
      return timeB - timeA; // newest first
    });
}

/**
 * Deletes a file from Cloudflare R2.
 */
export async function deleteFromR2(key: string): Promise<void> {
  const config = getR2Config();
  const client = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: config.bucketName,
      Key: key,
    })
  );
}

/**
 * Generates a presigned URL to download a backup directly from Cloudflare R2.
 */
export async function getBackupDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const config = getR2Config();
  const client = getR2Client();

  const command = new GetObjectCommand({
    Bucket: config.bucketName,
    Key: key,
  });

  return await getSignedUrl(client, command, { expiresIn: expiresInSeconds });
}

/**
 * Prunes backups in R2 older than the specified retention period (default: 365 days / 1 year).
 */
export async function pruneOldBackups({
  retentionDays = 365,
  prefix = "backups/db/",
}: {
  retentionDays?: number;
  prefix?: string;
} = {}): Promise<{
  retentionDays: number;
  cutoffDate: Date;
  deletedKeys: string[];
  keptCount: number;
}> {
  const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
  const cutoffDate = new Date(cutoffTime);
  const backups = await listR2Backups(prefix);

  const deletedKeys: string[] = [];
  let keptCount = 0;

  for (const backup of backups) {
    const itemTime = backup.lastModified?.getTime() || 0;
    if (itemTime > 0 && itemTime < cutoffTime) {
      try {
        await deleteFromR2(backup.key);
        deletedKeys.push(backup.key);
      } catch (err) {
        console.error(`Failed to prune old backup ${backup.key}:`, err);
      }
    } else {
      keptCount++;
    }
  }

  return {
    retentionDays,
    cutoffDate,
    deletedKeys,
    keptCount,
  };
}
