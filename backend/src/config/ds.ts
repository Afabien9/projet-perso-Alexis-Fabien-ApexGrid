import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('connect', () => {
  console.log('Connecté à la base de données PostgreSQL');
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
};