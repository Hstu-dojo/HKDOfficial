import { db } from "../src/lib/connect-db";
import { user } from "../src/db/schemas/auth";
import { registrations, members, programRegistrations, programs } from "../src/db/schemas/karate";
import { syncProgramRegistrationsProfileId } from "../src/lib/partner-assignment";
import { eq, and, isNull } from "drizzle-orm";

async function run() {
  console.log("Starting test-sync verification...");

  // 1. Find a test user (we can use the first user in the system)
  const firstUser = await db.query.user.findFirst();
  if (!firstUser) {
    console.error("No users found in database to run sync test.");
    return;
  }
  const userId = firstUser.id;
  console.log("Using user ID:", userId);

  // 2. Find/Create a test program
  let program = await db.query.programs.findFirst();
  if (!program) {
    console.log("No programs found. Inserting a test program...");
    const [insertedProgram] = await db.insert(programs).values({
      title: "Test Sync Program",
      slug: "test-sync-program",
      type: "EVENT",
      startDate: new Date(),
      endDate: new Date(),
      isRegistrationOpen: true,
      isActive: true,
    } as any).returning();
    program = insertedProgram;
  }

  // 3. Insert a mock member profile to satisfy foreign key constraints
  console.log("Inserting a mock member profile...");
  const [testMember] = await db.insert(members).values({
    userId: userId,
    memberNumber: "HKD-TEST-9999",
    fullNameEnglish: "Test Sync Member",
    isActive: true,
    isProfileComplete: true,
  } as any).returning();

  const mockProfileId = testMember.id;
  console.log(`Mock member profile created with ID: ${mockProfileId}`);

  // 4. Insert a mock program registration with profileId: null
  console.log("Inserting mock program registration with profileId: null...");
  const [testReg] = await db.insert(programRegistrations).values({
    programId: program.id,
    userId: userId,
    profileId: null,
    feeAmount: 1000,
    status: "pending_payment",
  } as any).returning();

  console.log(`Mock program registration created: ID=${testReg.id}, profileId=${testReg.profileId}`);

  // 5. Perform sync with the mock profile ID
  console.log(`Calling syncProgramRegistrationsProfileId with profileId=${mockProfileId}...`);
  await syncProgramRegistrationsProfileId(userId, mockProfileId);

  // 6. Query and check if it was updated
  const updatedRegs = await db
    .select()
    .from(programRegistrations)
    .where(eq(programRegistrations.id, testReg.id))
    .limit(1);

  const updatedReg = updatedRegs[0];
  if (updatedReg && updatedReg.profileId === mockProfileId) {
    console.log("SUCCESS: Program registration was successfully synced and linked to profileId!");
  } else {
    console.error(`FAILURE: Program registration was NOT synced. Expected profileId=${mockProfileId}, but got: ${updatedReg?.profileId}`);
  }

  // 7. Clean up
  console.log("Cleaning up test records...");
  await db.delete(programRegistrations).where(eq(programRegistrations.id, testReg.id));
  await db.delete(members).where(eq(members.id, mockProfileId));
  if (program.title === "Test Sync Program") {
    await db.delete(programs).where(eq(programs.id, program.id));
  }
  console.log("Cleanup finished.");
}

run().then(() => process.exit(0)).catch(e => { console.error("Sync test failed with error:", e); process.exit(1); });
