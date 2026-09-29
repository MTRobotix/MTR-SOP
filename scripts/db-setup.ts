// Creates the users table and the first admin from ADMIN_EMAIL / ADMIN_PASSWORD.
// Usage: ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='…' npm run db:setup
import { query } from "../src/lib/db";
import { createUser, MIN_PASSWORD, normalizeEmail } from "../src/lib/auth/users";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD.");
  process.exit(1);
}
if (password.length < MIN_PASSWORD) {
  console.error(`ADMIN_PASSWORD must be at least ${MIN_PASSWORD} characters.`);
  process.exit(1);
}

const existing = await query<{ id: number }>("SELECT id FROM users WHERE email = $1", [normalizeEmail(email)]);
if (existing.length) {
  console.log(`Admin ${email} already exists. Nothing changed.`);
} else {
  await createUser(email, process.env.ADMIN_NAME ?? "Admin", password, "admin");
  console.log(`Created admin ${email}.`);
}
process.exit(0);
