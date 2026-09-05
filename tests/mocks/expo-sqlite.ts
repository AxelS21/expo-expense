import Database from 'better-sqlite3';

/**
 * Mock minimo de la API async de expo-sqlite usada por src/db, respaldado por
 * better-sqlite3 (sincrono) para poder testear las migraciones y los repositories
 * en Node sin un dispositivo real.
 */
class FakeSQLiteDatabase {
  private db: Database.Database;

  constructor() {
    this.db = new Database(':memory:');
  }

  async execAsync(sql: string): Promise<void> {
    this.db.exec(sql);
  }

  async runAsync(sql: string, params: unknown[] = []): Promise<void> {
    this.db.prepare(sql).run(...params);
  }

  async getFirstAsync<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const row = this.db.prepare(sql).get(...params);
    return (row as T) ?? null;
  }

  async getAllAsync<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return this.db.prepare(sql).all(...params) as T[];
  }

  async withTransactionAsync(fn: () => Promise<void>): Promise<void> {
    await fn();
  }
}

let instance: FakeSQLiteDatabase | null = null;

export async function openDatabaseAsync(): Promise<FakeSQLiteDatabase> {
  if (!instance) instance = new FakeSQLiteDatabase();
  return instance;
}

export type SQLiteDatabase = FakeSQLiteDatabase;
