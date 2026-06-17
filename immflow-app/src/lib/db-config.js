/**
 * Shared MariaDB pool options for Prisma adapter.
 * allowPublicKeyRetrieval fixes MySQL 8 caching_sha2_password auth locally.
 */
export function getMariaDbPoolConfig(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not defined.");
  }

  const url = new URL(databaseUrl);

  return {
    host: url.hostname,
    port: parseInt(url.port || "3306", 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.replace(/^\//, ""),
    connectionLimit: 10,
    allowPublicKeyRetrieval: true,
    connectTimeout: 10_000,
  };
}
