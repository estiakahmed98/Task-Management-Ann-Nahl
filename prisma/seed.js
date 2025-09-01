// prisma/seed.js

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs"); // bcryptjs নিলে নেটিভ বিল্ড ঝামেলা এড়াও

const prisma = new PrismaClient();

async function seedRoles() {
  const roles = [
    { id: "role-admin", name: "admin", description: "Administrator role" },
    { id: "role-agent", name: "agent", description: "Agent role" },
    { id: "role-manager", name: "manager", description: "Manager role" },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { id: role.id },
      update: { name: role.name, description: role.description },
      create: role,
    });
    console.log(`✅ Role ready: ${role.name}`);
  }
}

async function seedTeams() {
  // 👇 Screenshot অনুযায়ী টিম লিস্ট:
  const teams = [
    { id: "asset-team", name: "Asset Team", description: "Asset Team" },
    {
      id: "backlinks-team",
      name: "Backlinks Team",
      description: "Backlinks Team",
    },
    {
      id: "completedcom-",
      name: "Completed.com",
      description: "Completed.com Team Description",
    },
    {
      id: "content-studio-team",
      name: "Content Studio Team",
      description: "Content Studio Team",
    },
    {
      id: "content-writing",
      name: "Content Writing",
      description: "Content Writing",
    },
    {
      id: "developer-team",
      name: "Developer Team",
      description: "Developer Team",
    },
    {
      id: "graphics-design-team",
      name: "Graphics Design Team",
      description: "Graphics Design Team Description",
    },
    {
      id: "monitoring-team",
      name: "Monitoring Team",
      description: "Monitoring Team Description",
    },
    { id: "qc-team", name: "QC Team", description: "QC Team Description" },
    {
      id: "review-removal-team",
      name: "Review Removal Team",
      description: "Review Removal Team Description",
    },
    { id: "social-team", name: "Social Team", description: "Social Team" },
    {
      id: "summary-report-team",
      name: "Summary Report Team",
      description: "Summary Report Team",
    },
    {
      id: "youtube-video-optimizer-",
      name: "Youtube Video Optimizer",
      description: "Youtube Video Optimizer Team Description",
    },
  ];

  for (const team of teams) {
    await prisma.team.upsert({
      where: { id: team.id },
      update: { name: team.name, description: team.description },
      create: team,
    });
    console.log(`✅ Team ready: ${team.id} (${team.name})`);
  }
  console.log("🎯 Teams seeded/updated successfully");
}

async function seedUsers() {
  const users = [
    {
      id: "user-admin",
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      roleName: "admin",
    },
    {
      id: "user-agent",
      name: "Agent User",
      email: "agent@example.com",
      password: "agent123",
      roleName: "agent",
    },
    {
      id: "user-manager",
      name: "Manager User",
      email: "manager@example.com",
      password: "manager123",
      roleName: "manager",
    },
  ];

  for (const user of users) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    await prisma.$transaction(async (tx) => {
      // role
      const role = await tx.role.findUnique({ where: { name: user.roleName } });
      if (!role) throw new Error(`Role ${user.roleName} not found`);

      const firstName = user.name.split(" ")[0] || user.name;
      const lastName = user.name.split(" ")[1] || "";

      // user
      const createdUser = await tx.user.upsert({
        where: { email: user.email },
        update: {
          name: user.name,
          passwordHash: hashedPassword,
          roleId: role.id,
          status: "active",
          firstName,
          lastName,
          emailVerified: true,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash: hashedPassword,
          emailVerified: true,
          roleId: role.id,
          status: "active",
          firstName,
          lastName,
        },
      });

      // account (credentials)
      const existingAccount = await tx.account.findFirst({
        where: { userId: createdUser.id, providerId: "credentials" },
      });

      if (existingAccount) {
        await tx.account.update({
          where: { id: existingAccount.id },
          data: {
            accessToken: `token-${user.roleName}`,
            refreshToken: `refresh-${user.roleName}`,
            password: hashedPassword,
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.account.create({
          data: {
            id: `account-${user.roleName}`,
            accountId: `account-${user.roleName}`,
            providerId: "credentials",
            userId: createdUser.id,
            accessToken: `token-${user.roleName}`,
            refreshToken: `refresh-${user.roleName}`,
            password: hashedPassword,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      console.log(`👤 User ready: ${user.email} (${user.roleName})`);
    });
  }
}

async function main() {
  await seedRoles();
  await seedTeams(); // 👈 নতুন অংশ
  await seedUsers();

  console.log("✅ Seeding completed");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
