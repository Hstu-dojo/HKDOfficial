import postgres from "postgres";
import zlib from "zlib";
import { execSync } from "child_process";

export interface DumpResult {
  filename: string;
  buffer: Buffer;
  sizeBytes: number;
  rawSizeBytes: number;
  tablesCount: number;
  rowsCount: number;
  engine: "pg_dump" | "native-node";
  createdAt: string;
}

/**
 * Checks if the pg_dump system binary is available in the current environment.
 */
function isPgDumpAvailable(): boolean {
  try {
    execSync("pg_dump --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely escapes an arbitrary JS value into a valid PostgreSQL SQL literal.
 */
function escapeSqlValue(value: any): string {
  if (value === null || value === undefined) {
    return "NULL";
  }

  if (typeof value === "boolean") {
    return value ? "TRUE" : "FALSE";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? String(value) : "NULL";
  }

  if (value instanceof Date) {
    return `'${value.toISOString()}'`;
  }

  if (Buffer.isBuffer(value)) {
    return `decode('${value.toString("hex")}', 'hex')`;
  }

  if (Array.isArray(value)) {
    // If it's a simple array of strings/numbers or json
    const jsonStr = JSON.stringify(value);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  }

  if (typeof value === "object") {
    const jsonStr = JSON.stringify(value);
    return `'${jsonStr.replace(/'/g, "''")}'::jsonb`;
  }

  // String / default
  const str = String(value);
  return `'${str.replace(/'/g, "''")}'`;
}

/**
 * Native Node.js PostgreSQL dump engine.
 * Dumps schemas, custom types, tables, rows, primary keys, indexes, and foreign keys.
 * Operates without requiring any system binaries like pg_dump.
 */
async function dumpDatabaseNative(connectionString: string): Promise<{
  sqlContent: string;
  tablesCount: number;
  rowsCount: number;
}> {
  const sql = postgres(connectionString, { prepare: false });

  try {
    const lines: string[] = [];
    const timestamp = new Date().toISOString();

    lines.push("-- ========================================================");
    lines.push("-- Kaizen Karate Academy (HKD Official) Database Backup");
    lines.push(`-- Generated: ${timestamp}`);
    lines.push("-- Engine: Native Node.js PostgreSQL Dumper");
    lines.push("-- ========================================================\n");

    lines.push("SET client_encoding = 'UTF8';");
    lines.push("SET standard_conforming_strings = on;");
    lines.push("SET check_function_bodies = false;");
    lines.push("SET client_min_messages = warning;");
    lines.push("SET row_security = off;\n");

    // 1. Custom Enum Types
    const enums = await sql`
      SELECT t.typname as enum_name, e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
      WHERE n.nspname = 'public'
      ORDER BY t.typname, e.enumsortorder;
    `;

    const enumGroups: Record<string, string[]> = {};
    for (const row of enums) {
      if (!enumGroups[row.enum_name]) enumGroups[row.enum_name] = [];
      enumGroups[row.enum_name].push(row.enum_value);
    }

    if (Object.keys(enumGroups).length > 0) {
      lines.push("-- --------------------------------------------------------");
      lines.push("-- Custom Enum Types");
      lines.push("-- --------------------------------------------------------");
      for (const [enumName, values] of Object.entries(enumGroups)) {
        const escapedVals = values.map((v) => `'${v.replace(/'/g, "''")}'`).join(", ");
        lines.push(`DO $$ BEGIN`);
        lines.push(`  CREATE TYPE "public"."${enumName}" AS ENUM (${escapedVals});`);
        lines.push(`EXCEPTION WHEN duplicate_object THEN null;`);
        lines.push(`END $$;\n`);
      }
    }

    // 2. Discover all tables in public schema
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;

    let totalRows = 0;
    const tableNames = tables.map((t) => t.table_name as string);

    // 3. Structure & Data for each table
    for (const tableName of tableNames) {
      lines.push(`-- --------------------------------------------------------`);
      lines.push(`-- Table: "public"."${tableName}"`);
      lines.push(`-- --------------------------------------------------------`);

      // Get columns
      const columns = await sql`
        SELECT 
          column_name, 
          data_type, 
          udt_name, 
          is_nullable, 
          column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${tableName}
        ORDER BY ordinal_position;
      `;

      if (columns.length === 0) continue;

      // Drop statement
      lines.push(`DROP TABLE IF EXISTS "public"."${tableName}" CASCADE;`);

      // Create statement
      const colDefs = columns.map((col) => {
        let colType = col.data_type;
        if (col.data_type === "USER-DEFINED") {
          colType = `"public"."${col.udt_name}"`;
        } else if (col.data_type === "ARRAY") {
          colType = `${col.udt_name.replace(/^_/, "")}[]`;
        }

        let def = `  "${col.column_name}" ${colType}`;
        if (col.column_default) {
          def += ` DEFAULT ${col.column_default}`;
        }
        if (col.is_nullable === "NO") {
          def += ` NOT NULL`;
        }
        return def;
      });

      lines.push(`CREATE TABLE "public"."${tableName}" (\n${colDefs.join(",\n")}\n);\n`);

      // Fetch and insert table data in chunks
      const rows = await sql`SELECT * FROM ${sql(tableName)}`;
      totalRows += rows.length;

      if (rows.length > 0) {
        const colNames = columns.map((c) => `"${c.column_name}"`).join(", ");
        const chunkSize = 200;

        for (let i = 0; i < rows.length; i += chunkSize) {
          const chunk = rows.slice(i, i + chunkSize);
          const valuesList = chunk.map((r) => {
            const rowVals = columns.map((c) => escapeSqlValue(r[c.column_name])).join(", ");
            return `(${rowVals})`;
          });

          lines.push(`INSERT INTO "public"."${tableName}" (${colNames}) VALUES`);
          lines.push(valuesList.join(",\n") + ";\n");
        }
      }
    }

    // 4. Primary Keys
    const pks = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        pg_get_constraintdef(c.oid) as constraint_def
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.constraint_type = 'PRIMARY KEY';
    `;

    if (pks.length > 0) {
      lines.push("-- --------------------------------------------------------");
      lines.push("-- Primary Keys");
      lines.push("-- --------------------------------------------------------");
      for (const pk of pks) {
        lines.push(
          `ALTER TABLE "public"."${pk.table_name}" ADD CONSTRAINT "${pk.constraint_name}" ${pk.constraint_def};`
        );
      }
      lines.push("");
    }

    // 5. Indexes (excluding primary keys already created)
    const indexes = await sql`
      SELECT indexname, indexdef, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname;
    `;

    if (indexes.length > 0) {
      lines.push("-- --------------------------------------------------------");
      lines.push("-- Indexes");
      lines.push("-- --------------------------------------------------------");
      for (const idx of indexes) {
        // Skip default primary key index definitions if already covered by PRIMARY KEY
        if (idx.indexname.endsWith("_pkey")) continue;
        lines.push(`${idx.indexdef};`);
      }
      lines.push("");
    }

    // 6. Foreign Keys
    const fks = await sql`
      SELECT
        tc.table_name,
        tc.constraint_name,
        pg_get_constraintdef(c.oid) as constraint_def
      FROM information_schema.table_constraints tc
      JOIN pg_constraint c ON c.conname = tc.constraint_name
      WHERE tc.table_schema = 'public' AND tc.constraint_type = 'FOREIGN KEY';
    `;

    if (fks.length > 0) {
      lines.push("-- --------------------------------------------------------");
      lines.push("-- Foreign Keys");
      lines.push("-- --------------------------------------------------------");
      for (const fk of fks) {
        lines.push(
          `ALTER TABLE "public"."${fk.table_name}" ADD CONSTRAINT "${fk.constraint_name}" ${fk.constraint_def};`
        );
      }
      lines.push("");
    }

    // 7. Sequences
    const sequences = await sql`
      SELECT sequence_name 
      FROM information_schema.sequences 
      WHERE sequence_schema = 'public';
    `;

    if (sequences.length > 0) {
      lines.push("-- --------------------------------------------------------");
      lines.push("-- Sequence Positions");
      lines.push("-- --------------------------------------------------------");
      for (const seq of sequences) {
        try {
          const [curr] = await sql`SELECT last_value, is_called FROM ${sql(seq.sequence_name)}`;
          if (curr) {
            lines.push(
              `SELECT setval('"public"."${seq.sequence_name}"', ${curr.last_value}, ${curr.is_called});`
            );
          }
        } catch {}
      }
      lines.push("");
    }

    lines.push("-- ========================================================");
    lines.push(`-- End of Backup (${tableNames.length} tables, ${totalRows} rows)`);
    lines.push("-- ========================================================");

    return {
      sqlContent: lines.join("\n"),
      tablesCount: tableNames.length,
      rowsCount: totalRows,
    };
  } finally {
    await sql.end();
  }
}

/**
 * Creates a complete database backup, compressed with gzip.
 * Automatically chooses pg_dump when available, or native Node.js engine as fallback.
 */
export async function createDatabaseBackup(): Promise<DumpResult> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set in environment.");
  }

  const now = new Date();
  const dateStr = now.toISOString().replace(/[:.]/g, "-");
  const filename = `backup_hkd_${dateStr}.sql.gz`;

  let sqlContent = "";
  let tablesCount = 0;
  let rowsCount = 0;
  let engine: "pg_dump" | "native-node" = "native-node";

  if (isPgDumpAvailable()) {
    try {
      engine = "pg_dump";
      sqlContent = execSync(
        `pg_dump "${connectionString}" --clean --if-exists --no-owner --no-privileges`,
        { maxBuffer: 100 * 1024 * 1024, encoding: "utf-8" }
      );
      // Count tables from pg_dump output roughly
      const tableMatches = sqlContent.match(/CREATE TABLE/gi);
      tablesCount = tableMatches ? tableMatches.length : 0;
    } catch (pgError) {
      console.warn("pg_dump invocation failed, falling back to native dumper:", pgError);
      engine = "native-node";
    }
  }

  if (engine === "native-node") {
    const dumped = await dumpDatabaseNative(connectionString);
    sqlContent = dumped.sqlContent;
    tablesCount = dumped.tablesCount;
    rowsCount = dumped.rowsCount;
  }

  const rawBuffer = Buffer.from(sqlContent, "utf-8");
  const gzippedBuffer = zlib.gzipSync(rawBuffer, { level: 9 });

  return {
    filename,
    buffer: gzippedBuffer,
    sizeBytes: gzippedBuffer.length,
    rawSizeBytes: rawBuffer.length,
    tablesCount,
    rowsCount,
    engine,
    createdAt: now.toISOString(),
  };
}
