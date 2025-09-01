// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  await prisma.permission.createMany({
    data: [
      {
        id: "template_edit",
        name: "template_edit",
        description: "Can edit templates",
      },
      {
        id: "template_delete",
        name: "template_delete",
        description: "Can delete templates",
      },
      // 👇 নতুন
      {
        id: "user_impersonate",
        name: "user_impersonate",
        description: "Can impersonate another user",
      },
    ],
    skipDuplicates: true,
  });

  // চাইলে এখানে admin role-এ এটাকে attach করুন (উদাহরণ):
  const admin = await prisma.role.findUnique({ where: { name: "admin" } });
  const perm = await prisma.permission.findUnique({
    where: { name: "user_impersonate" },
  });
  if (admin && perm) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: admin.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: admin.id, permissionId: perm.id },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
