import dotenv from 'dotenv';
dotenv.config();

import pg from 'pg';

const db = new pg.Pool({
  connectionString: "postgresql://postgres.sowtupizqlkhfsjgxcsd:l1d91hRZ1yQev3bk@aws-0-eu-west-3.pooler.supabase.com:6543/postgres",
});

async function updateSchema() {
  try {
    await db.query(`
      ALTER TABLE public.suggestions 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
      CHECK (status IN ('pending', 'validated', 'refused'));
    `);
    console.log("Table 'suggestions' updated successfully.");
  } catch (error) {
    console.error("Error updating table 'suggestions':", error);
  } finally {
    process.exit();
  }
}

updateSchema();
