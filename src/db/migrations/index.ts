import type { SQLiteDatabase } from 'expo-sqlite';
import * as m001 from './001_initial_schema';

export interface Migration {
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
}

/**
 * Cada migracion se aplica una unica vez, en orden, dentro de una transaccion.
 * Nunca reordenar ni editar una migracion ya publicada: agregar una nueva.
 */
export const migrations: Migration[] = [{ version: 1, name: '001_initial_schema', up: m001.up }];
