import { PrismaClient } from "@prisma/client";

/** Bump when Prisma schema changes so hot-reload gets a fresh client. */
const CLIENT_VERSION = "2026-06-18-field-completed";

type GlobalPrisma = {
  prisma?: PrismaClient;
  prismaVersion?: string;
};

const globalForPrisma = globalThis as unknown as GlobalPrisma;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function isFreshClient(client: PrismaClient): boolean {
  return "user" in client && "taskFieldValue" in client;
}

function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prisma;
  if (
    existing &&
    globalForPrisma.prismaVersion === CLIENT_VERSION &&
    isFreshClient(existing)
  ) {
    return existing;
  }

  if (existing) {
    void existing.$disconnect();
  }

  const client = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaVersion = CLIENT_VERSION;
  }
  return client;
}

/** Lazy proxy so importers never keep a stale client reference after schema changes. */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  },
});
