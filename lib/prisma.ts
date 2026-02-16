import { PrismaClient } from "@/app/generated/prisma";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Always cache the Prisma client globally to prevent creating
// multiple instances in production (causes connection pool exhaustion & high CPU)
globalForPrisma.prisma = prisma;

export default prisma;