import pg from "pg";
import { config } from "./config.js";

// One shared pool for the whole app. Every route imports `query` from here.
// Hosted Postgres (Neon, Render, Railway) requires SSL; a local container does not.
// Set DATABASE_SSL=true in the deployed environment and leave it unset locally.
const pool = new pg.Pool({
  connectionString: config.databaseUrl,
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
});

// Postgres returns NUMERIC as a string so big values stay exact. Our averages are
// small, so ask pg to hand them back as plain numbers instead.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (value) => parseFloat(value));

export function query(text, params) {
  return pool.query(text, params);
}

export function closePool() {
  return pool.end();
}
