// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

// Middleware for handling role assignments
prisma.$use(async (params, next) => {
  if (params.model === "User" && params.action === "create") {
    const data = params.args.data;
    if (data.role && typeof data.role === "string") {
      const roleName = data.role;
      delete data.role;
      const existingRole = await prisma.role.findUnique({
        where: { name: roleName },
        select: { id: true },
      });
      if (existingRole) {
        data.role = {
          connect: {
            id: existingRole.id,
          },
        };
      } else {
        console.warn(
          `Prisma Middleware: Role '${roleName}' not found. User will be created without a linked role.`
        );
      }
    }
  }
  return next(params);
});

export default prisma;

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
