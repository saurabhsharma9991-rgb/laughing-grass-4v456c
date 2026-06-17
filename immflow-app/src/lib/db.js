import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { getMariaDbPoolConfig } from "./db-config.js";

let prisma;

const getPrismaInstance = () => {
  const adapter = new PrismaMariaDb(getMariaDbPoolConfig());
  return new PrismaClient({ adapter });
};

if (process.env.NODE_ENV === "production") {
  prisma = getPrismaInstance();
} else {
  if (!global.globalPrisma) {
    global.globalPrisma = getPrismaInstance();
  }
  prisma = global.globalPrisma;
}

export { prisma };
export default prisma;
