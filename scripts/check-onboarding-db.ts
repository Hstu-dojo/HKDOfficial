import { db } from "../src/lib/connect-db";
import { user } from "../src/db/schemas/auth";
import { registrations, members } from "../src/db/schemas/karate";
import { eq } from "drizzle-orm";

async function run() {
  console.log("Fetching all users...");
  const users = await db.select().from(user);
  console.log(`Total users: ${users.length}`);

  for (const u of users) {
    const reg = await db.select().from(registrations).where(eq(registrations.userId, u.id)).limit(1);
    const mem = await db.select().from(members).where(eq(members.userId, u.id)).limit(1);
    
    console.log(`User: ${u.userName} (${u.email})`);
    console.log(`  Auth Providers: ${JSON.stringify(u.authProviders)}`);
    console.log(`  Onboarding Registration: ${reg.length > 0 ? reg[0].status : 'NONE'}`);
    console.log(`  Member Profile: ${mem.length > 0 ? 'YES' : 'NO'}`);
  }
}

run().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
