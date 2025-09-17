// lib/db.js
import postgres from "postgres";

let _client;

function resolveUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.NEON_DB_URL ||
    process.env.POSTGRES_URL ||
    null
  );
}

function getDb() {
  const url = resolveUrl();
  if (!url) throw new Error("DATABASE_URL not set");
  if (!_client) {
    _client = postgres(url, { ssl: { rejectUnauthorized: false } });
  }
  return _client;
}

/** Named tag export */
export function sql(strings, ...values) {
  return getDb()(strings, ...values);
}
sql.json = (...args) => getDb().json(...args);

/** Default tag export (optional) */
export default function defaultSql(strings, ...values) {
  return getDb()(strings, ...values);
}
defaultSql.json = (...args) => getDb().json(...args);
