
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: 'postgresql://postgres:jFdMCGWzuqljYzxXtDVQBvMkceabsrhl@shinkansen.proxy.rlwy.net:56113/railway',
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;
