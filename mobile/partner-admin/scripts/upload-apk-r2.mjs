import { readFileSync, appendFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

/**
 * Uploads an arbitrary Buffer or string to Cloudflare R2 using AWS SigV4.
 * Uses native Node.js crypto and fetch with zero external npm dependencies.
 */
async function uploadToR2({
  accountId,
  accessKeyId,
  secretAccessKey,
  bucket,
  key,
  body,
  contentType = "application/octet-stream",
  contentDisposition,
}) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const region = "auto";
  const service = "s3";

  const host = `${bucket}.${accountId}.r2.cloudflarestorage.com`;
  const endpoint = `https://${host}/${key}`;
  const contentHash = crypto.createHash("sha256").update(body).digest("hex");

  const headersToSign = {
    host,
    "x-amz-content-sha256": contentHash,
    "x-amz-date": amzDate,
  };

  const canonicalHeaders = Object.keys(headersToSign)
    .sort()
    .map((k) => `${k}:${headersToSign[k]}\n`)
    .join("");
  const signedHeaders = Object.keys(headersToSign).sort().join(";");

  const canonicalRequest = [
    "PUT",
    "/" + key,
    "",
    canonicalHeaders,
    signedHeaders,
    contentHash,
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    `${dateStamp}/${region}/${service}/aws4_request`,
    crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
  ].join("\n");

  const hmac = (k, data) => crypto.createHmac("sha256", k).update(data).digest();
  const kDate = hmac("AWS4" + secretAccessKey, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = crypto.createHmac("sha256", kSigning).update(stringToSign).digest("hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/${region}/${service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const reqHeaders = {
    Host: host,
    "x-amz-date": amzDate,
    "x-amz-content-sha256": contentHash,
    Authorization: authHeader,
    "Content-Type": contentType,
  };

  if (contentDisposition) {
    reqHeaders["Content-Disposition"] = contentDisposition;
  }

  const response = await fetch(endpoint, {
    method: "PUT",
    headers: reqHeaders,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Cloudflare R2 upload failed for ${key} [${response.status} ${response.statusText}]: ${errorText}`
    );
  }

  return { key, status: response.status };
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 Uploading Partner Admin Standalone APK to Cloudflare R2");
  console.log("================================================================================\n");

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID?.trim();
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || "hstuma";
  const publicUrlBase = (
    process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim() || "https://storage.hstuma.com"
  ).replace(/\/+$/, "");
  const runNumber = process.env.GITHUB_RUN_NUMBER || "manual";

  if (!accountId || !accessKeyId || !secretAccessKey) {
    console.warn("⚠️  Cloudflare R2 credentials not found in environment.");
    console.warn("   Required secrets: CLOUDFLARE_R2_ACCOUNT_ID, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY.");
    console.warn("   Skipping Cloudflare R2 upload step.\n");
    return;
  }

  const apkPath = resolve(projectRoot, "artifacts/kaizen-partner-admin-preview.apk");
  if (!existsSync(apkPath)) {
    throw new Error(`APK file not found at expected path: ${apkPath}`);
  }

  const apkBuffer = readFileSync(apkPath);
  const sizeMb = (apkBuffer.length / (1024 * 1024)).toFixed(2);
  const sha256 = crypto.createHash("sha256").update(apkBuffer).digest("hex");

  console.log(`📦 Local APK:    ${apkPath}`);
  console.log(`📊 Size:         ${sizeMb} MB (${apkBuffer.length} bytes)`);
  console.log(`🔒 SHA-256:      ${sha256}`);
  console.log(`🪣 Target Bucket: ${bucket}`);
  console.log(`🌐 Public Base:  ${publicUrlBase}\n`);

  // Target paths in Cloudflare R2
  const latestKey = "downloads/partner-admin/kaizen-partner-admin-latest.apk";
  const versionedKey = `downloads/partner-admin/kaizen-partner-admin-run-${runNumber}.apk`;
  const sha256Key = "downloads/partner-admin/kaizen-partner-admin-latest.apk.sha256";
  const metadataKey = "downloads/partner-admin/latest.json";

  console.log(`1️⃣  Uploading latest APK -> ${latestKey}...`);
  await uploadToR2({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key: latestKey,
    body: apkBuffer,
    contentType: "application/vnd.android.package-archive",
    contentDisposition: 'attachment; filename="kaizen-partner-admin.apk"',
  });
  console.log(`   ✅ Uploaded: ${publicUrlBase}/${latestKey}`);

  console.log(`2️⃣  Uploading versioned APK -> ${versionedKey}...`);
  await uploadToR2({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key: versionedKey,
    body: apkBuffer,
    contentType: "application/vnd.android.package-archive",
    contentDisposition: `attachment; filename="kaizen-partner-admin-run-${runNumber}.apk"`,
  });
  console.log(`   ✅ Uploaded: ${publicUrlBase}/${versionedKey}`);

  console.log(`3️⃣  Uploading SHA-256 checksum -> ${sha256Key}...`);
  const checksumContent = `${sha256}  kaizen-partner-admin-latest.apk\n`;
  await uploadToR2({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key: sha256Key,
    body: Buffer.from(checksumContent, "utf-8"),
    contentType: "text/plain",
  });
  console.log(`   ✅ Uploaded: ${publicUrlBase}/${sha256Key}`);

  console.log(`4️⃣  Uploading metadata JSON -> ${metadataKey}...`);
  const metadata = {
    appName: "Kaizen Karate Academy - Partner Admin",
    version: "1.0.0",
    buildNumber: runNumber,
    filename: "kaizen-partner-admin-latest.apk",
    downloadUrl: `${publicUrlBase}/${latestKey}`,
    versionedUrl: `${publicUrlBase}/${versionedKey}`,
    sha256,
    sizeBytes: apkBuffer.length,
    sizeMb: parseFloat(sizeMb),
    updatedAt: new Date().toISOString(),
  };
  await uploadToR2({
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    key: metadataKey,
    body: Buffer.from(JSON.stringify(metadata, null, 2), "utf-8"),
    contentType: "application/json",
  });
  console.log(`   ✅ Uploaded: ${publicUrlBase}/${metadataKey}\n`);

  console.log("================================================================================");
  console.log("🎉 All APK files uploaded to Cloudflare R2 successfully!");
  console.log(`🔗 Direct Download URL: ${metadata.downloadUrl}`);
  console.log("================================================================================\n");

  // If in GitHub Actions, append to GITHUB_STEP_SUMMARY
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      const summaryContent = `
### 📱 Direct Cloudflare R2 APK Download
- **Latest Android APK**: [Download kaizen-partner-admin-latest.apk](${metadata.downloadUrl})
- **Versioned APK (Run #${runNumber})**: [Download](${metadata.versionedUrl})
- **Metadata**: [latest.json](${publicUrlBase}/${metadataKey})
- **SHA-256**: \`${sha256}\`
- **File Size**: ${sizeMb} MB
`;
      appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryContent);
    } catch (err) {
      console.warn("Could not write to GITHUB_STEP_SUMMARY:", err);
    }
  }
}

main().catch((err) => {
  console.error("\n❌ Upload failed:", err);
  process.exit(1);
});
