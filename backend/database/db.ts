import fs from "fs";
import path from "path";
import { createRequire } from "module";
import pg from "pg";
import { DATABASE_URL, DB_PATH } from "../config";

const { Pool } = pg;

// Suppress Node.js experimental warning and pg SSL deprecation warning
const origEmitWarning = process.emitWarning;
process.emitWarning = function (...args: any[]) {
  if (typeof args[0] === "string" && (args[0].includes("SQLite") || args[0].includes("SECURITY WARNING") || args[0].includes("pg-connection-string"))) return;
  if (args[1] === "ExperimentalWarning") return;
  return (origEmitWarning as any).apply(process, args);
};

export class DatabaseService {
  private static instance: DatabaseService;
  public isPostgres: boolean = false;
  private pool?: pg.Pool;
  private sqliteDb?: any;

  private constructor() {
    if (DATABASE_URL && (DATABASE_URL.startsWith("postgres://") || DATABASE_URL.startsWith("postgresql://"))) {
      this.isPostgres = true;
      const isLocalhost = DATABASE_URL.includes("localhost") || DATABASE_URL.includes("127.0.0.1");
      const requiresSsl = !isLocalhost && (DATABASE_URL.includes("neon.tech") || DATABASE_URL.includes("sslmode=require") || process.env.NODE_ENV === "production");

      this.pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: requiresSsl ? { rejectUnauthorized: false } : false,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
      });

      this.pool.on("error", (err) => {
        console.error("[DATABASE] Unexpected idle client error:", err.message);
      });

      console.log("[DATABASE] Connected to PostgreSQL / Neon database.");
    } else {
      this.isPostgres = false;
      console.warn("[DATABASE] No DATABASE_URL provided. Falling back to local SQLite database.");
      console.warn("[DATABASE] To connect to Neon, set DATABASE_URL=postgresql://... in your .env file.");

      const nodeRequire = typeof require !== "undefined" ? require : createRequire(process.cwd());
      const { DatabaseSync } = nodeRequire("node:sqlite");
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      this.sqliteDb = new DatabaseSync(DB_PATH);
      this.sqliteDb.exec("PRAGMA journal_mode = WAL;");
      this.sqliteDb.exec("PRAGMA foreign_keys = ON;");
    }
  }

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  private convertPlaceholders(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  public async run(sql: string, params: any[] = []): Promise<{ changes: number }> {
    if (this.isPostgres && this.pool) {
      const pgSql = this.convertPlaceholders(sql);
      const res = await this.pool.query(pgSql, params);
      return { changes: res.rowCount || 0 };
    } else {
      const res = this.sqliteDb.prepare(sql).run(...params);
      return { changes: res.changes || 0 };
    }
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    if (this.isPostgres && this.pool) {
      const pgSql = this.convertPlaceholders(sql);
      const res = await this.pool.query(pgSql, params);
      return res.rows as T[];
    } else {
      return this.sqliteDb.prepare(sql).all(...params) as T[];
    }
  }

  public async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    return this.all<T>(sql, params);
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
    if (this.isPostgres && this.pool) {
      const pgSql = this.convertPlaceholders(sql);
      const res = await this.pool.query(pgSql, params);
      return (res.rows[0] as T) || undefined;
    } else {
      return this.sqliteDb.prepare(sql).get(...params) as T | undefined;
    }
  }

  public async exec(sql: string): Promise<void> {
    if (this.isPostgres && this.pool) {
      await this.pool.query(sql);
    } else {
      this.sqliteDb.exec(sql);
    }
  }
}

export const db = DatabaseService.getInstance();
