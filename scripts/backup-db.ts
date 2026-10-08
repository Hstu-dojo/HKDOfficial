import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Prefer .env.local, fallback to .env
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config();
}

import { runBackupWorkflow, listDatabaseBackups } from "../src/lib/backup/backup-service";
import { isR2Configured, getR2Config, verifyR2Connection } from "../src/lib/storage/cloudflare-r2";

async function main() {
  console.log("================================================================================");
  console.log("🚀 Starting Daily Database Backup to Cloudflare R2");
  console.log("================================================================================\n");

  const retentionDays = parseInt(process.env.BACKUP_RETENTION_DAYS || "365", 10);

  // 1. Verify R2 configuration
  console.log("1️⃣  Verifying Cloudflare R2 configuration...");
  if (!isR2Configured()) {
    console.error("❌ Cloudflare R2 credentials missing!");
    console.error("Please ensure the following environment variables are set in .env.local:\n");
    console.error("  - CLOUDFLARE_R2_ACCOUNT_ID");
    console.error("  - CLOUDFLARE_R2_ACCESS_KEY_ID");
    console.error("  - CLOUDFLARE_R2_SECRET_ACCESS_KEY");
    console.error("  - CLOUDFLARE_R2_BUCKET_NAME");
    process.exit(1);
  }

  const r2Config = getR2Config();
  console.log(`   Bucket: ${r2Config.bucketName}`);
  console.log(`   Endpoint: ${r2Config.endpoint}`);
  console.log(`   Retention period: ${retentionDays} days (1 year)\n`);

  console.log("2️⃣  Checking bucket connectivity...");
  const connectionCheck = await verifyR2Connection();
  if (!connectionCheck.success) {
    console.warn(`   ⚠️ Bucket ping returned: ${connectionCheck.message}`);
    console.warn("   Proceeding with backup upload attempt...\n");
  } else {
    console.log(`   ✅ ${connectionCheck.message}\n`);
  }

  // 2. Run backup and prune workflow
  console.log("3️⃣  Creating compressed PostgreSQL dump and uploading to Cloudflare R2...");
  try {
    const result = await runBackupWorkflow({
      retentionDays,
      prefix: "backups/db/",
    });

    console.log("================================================================================");
    console.log("✅ Backup Successful!");
    console.log("================================================================================");
    console.log(`📦 Remote File:    ${result.backup.key}`);
    console.log(`🪣 Bucket:         ${result.backup.bucket}`);
    console.log(`📊 Tables Backed:  ${result.backup.tablesCount}`);
    console.log(`📋 Total Rows:     ${result.backup.rowsCount}`);
    console.log(`💾 Gzipped Size:   ${result.backup.sizeKb} KB (Uncompressed: ${result.backup.rawSizeKb} KB)`);
    console.log(`⚙️  Engine:         ${result.backup.engine}`);
    console.log(`⏱️  Duration:       ${(result.durationMs / 1000).toFixed(2)}s`);
    console.log("--------------------------------------------------------------------------------");
    console.log(`🧹 Retention Pruning (Policy: ${retentionDays} days):`);
    console.log(`   Active backups retained: ${result.pruning.keptCount}`);
    console.log(`   Old backups deleted:     ${result.pruning.deletedCount}`);
    if (result.pruning.deletedKeys.length > 0) {
      result.pruning.deletedKeys.forEach((key) => console.log(`     - Deleted: ${key}`));
    }
    console.log("================================================================================\n");

    process.exit(0);
  } catch (error: any) {
    console.error("\n❌ Backup failed with error:");
    console.error(error);
    process.exit(1);
  }
}

main();
