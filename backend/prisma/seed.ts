import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** Seeded demo metrics for dashboard charts (90 days). */
async function seedAnalytics(): Promise<void> {
  const today = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    d.setUTCHours(0, 0, 0, 0);
    const signups = Math.floor(6 + Math.random() * 40);
    const activeUsers = Math.floor(100 + Math.random() * 220);
    const apiCalls = Math.floor(1500 + Math.random() * 9500);
    const revenueCents = Math.floor(40000 + Math.random() * 280000);
    await prisma.analyticsDaily.upsert({
      where: { date: d },
      create: {
        date: d,
        signups,
        activeUsers,
        apiCalls,
        revenueCents,
      },
      update: {
        signups,
        activeUsers,
        apiCalls,
        revenueCents,
      },
    });
  }
  console.log("Seeded AnalyticsDaily (90 rows).");
}

/** Optional admin account for demos (set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD in .env). */
async function seedAdmin(): Promise<void> {
  const email = process.env.ADMIN_SEED_EMAIL?.trim();
  const password = process.env.ADMIN_SEED_PASSWORD?.trim();
  if (!email || !password) {
    console.log("Skip admin seed (set ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD to create/promote admin).");
    return;
  }
  const hash = await bcrypt.hash(password, 12);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin" },
    });
    console.log(`Promoted to admin: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        email,
        password: hash,
        name: "Demo Admin",
        role: "admin",
      },
    });
    console.log(`Created admin user: ${email}`);
  }
}

async function main(): Promise<void> {
  await seedAnalytics();
  await seedAdmin();
}

void main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    void prisma.$disconnect();
    process.exit(1);
  });
