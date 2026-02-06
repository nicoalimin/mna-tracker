import { Pool, QueryResult } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

export const db = {
  query: (text: string, params?: any[]): Promise<QueryResult> => {
    return pool.query(text, params);
  },
  pool,
};
