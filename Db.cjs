// db.cjs  ← filename must be lowercase to match the require() in kpiRoutes.cjs
//            Linux (Vercel's runtime) is case-sensitive: "Db.cjs" ≠ "db.cjs"
const { Pool } = require('pg');
require('dotenv').config();

// Strip surrounding quotes that some .env editors add
// e.g.  "postgresql://..."  →  postgresql://...
const connectionString = process.env.DATABASE_URL?.replace(/^["']|["']$/g, '');

if (!connectionString) {
  throw new Error(
    '❌  DATABASE_URL is missing or empty in your .env file.\n' +
    '    Expected: DATABASE_URL=postgresql://<user>:<pass>@<host>/<db>?sslmode=require'
  );
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }, // Required for Neon.tech
  // ── Serverless-safe pool size ──────────────────────────────────────────────
  // Vercel spins up one function instance per concurrent request.
  // If each instance opens 10 connections, Neon's free tier (max 100) exhausts
  // quickly under load. max:1 means each cold-start instance holds at most one
  // connection, which Neon can handle across many concurrent instances.
  max: 1,
  idleTimeoutMillis: 10_000,   // Release idle connections quickly (serverless)
  connectionTimeoutMillis: 5_000,
});

pool.on('error', (err) => {
  console.error('⚠️  Unexpected PostgreSQL pool error:', err.message);
});

module.exports = pool;
