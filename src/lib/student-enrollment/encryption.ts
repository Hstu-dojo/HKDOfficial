import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
const magic = Buffer.from("KKA-DOC1");
function key() {
  const value = process.env.STUDENT_DOCUMENTS_ENCRYPTION_KEY || "";
  if (!/^[a-fA-F0-9]{64}$/.test(value))
    throw Error(
      "Set STUDENT_DOCUMENTS_ENCRYPTION_KEY to a server-only 32-byte hex key",
    );
  return Buffer.from(value, "hex");
}
export function encryptStudentDocument(body: Buffer) {
  const iv = randomBytes(12),
    cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(body), cipher.final()]);
  return Buffer.concat([magic, iv, cipher.getAuthTag(), encrypted]);
}
export function decryptStudentDocument(body: Buffer) {
  if (body.length < 36 || !body.subarray(0, 8).equals(magic))
    throw Error("Student document encryption header is invalid");
  const decipher = createDecipheriv("aes-256-gcm", key(), body.subarray(8, 20));
  decipher.setAuthTag(body.subarray(20, 36));
  return Buffer.concat([decipher.update(body.subarray(36)), decipher.final()]);
}
