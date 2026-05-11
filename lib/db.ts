import { Pool, neonConfig } from '@neondatabase/serverless';

// Use HTTP/fetch instead of WebSocket for Next.js App Router compatibility
neonConfig.poolQueryViaFetch = true;

declare global {
  // eslint-disable-next-line no-var
  var _pgPool: Pool | undefined;
}

const pool = globalThis._pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== 'production') {
  globalThis._pgPool = pool;
}

export default pool;
