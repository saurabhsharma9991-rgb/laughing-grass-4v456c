import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getMariaDbPoolConfig } from "./db-config.js";

const getPrismaInstance = () => {
  const adapter = new PrismaMariaDb(getMariaDbPoolConfig());
  return new PrismaClient({ adapter });
};

/** Recreate singleton after `prisma generate` adds new models (dev HMR keeps old client). */
function ensurePrisma() {
  const existing = global.globalPrisma;
  if (existing?.review) return existing;
  if (existing?.$disconnect) {
    existing.$disconnect().catch(() => {});
  }
  const client = getPrismaInstance();
  global.globalPrisma = client;
  return client;
}

function resolvePrisma() {
  if (process.env.NODE_ENV === "production") {
    if (!global.globalPrisma) {
      global.globalPrisma = getPrismaInstance();
    }
    return global.globalPrisma;
  }
  return ensurePrisma();
}

const prisma =
  process.env.NODE_ENV === "production"
    ? resolvePrisma()
    : new Proxy(
        {},
        {
          get(_target, prop) {
            const client = resolvePrisma();
            const value = client[prop];
            return typeof value === "function" ? value.bind(client) : value;
          },
        }
      );

export { prisma };
export default prisma;
