
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || 'postgres://postgres.ndbaihkbowthinihayps:tSt5uiUZy3KxgArG@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
