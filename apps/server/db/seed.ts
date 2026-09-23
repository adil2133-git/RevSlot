import "dotenv/config";
import bcrypt from "bcryptjs";
import { admins } from "../modules/admin/admins.schema.js";
import { db, pool } from "../config/db.js";
import { eq } from "drizzle-orm";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME ?? "Admin";

const createAdmin = async () => {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD before running this script"
    );
  }

  const [existing] = await db
    .select()
    .from(admins)
    .where(eq(admins.email, ADMIN_EMAIL));

  if (existing) {
    console.log(
      `Admin already exists for ${ADMIN_EMAIL} (id: ${existing.id}) — nothing to do.`
    );
    console.log(
      "If you meant to reset the password, do that separately — this script never overwrites an existing admin."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [created] = await db
    .insert(admins)
    .values({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      emailVerified: true,
    })
    .returning();

  console.log(`Admin created successfully: ${created?.email} (id: ${created?.id})`);
};

createAdmin()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("createAdmin failed:", error);
    await pool.end();
    process.exit(1);
  });