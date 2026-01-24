import { db } from "@/lib/connect-db";
import { registrations, members } from "@/db/schemas/karate";
import { eq } from "drizzle-orm";
import { createClient } from "@/lib/supabase/client";

async function diagnose() {
    // We can't easily get the current user ID here without a session token or passed ID.
    // However, the error "No member profile found" in checkUserProfileStatus suggests:
    // 1. members table entry missing with isProfileComplete=true
    // 2. OR registrations table entry missing or not in a state that implies profile complete.

    console.log("Checking DB state...");
    const allRegs = await db.query.registrations.findMany();
    console.log("Registrations:", JSON.stringify(allRegs, null, 2));
    
    const allMembers = await db.query.members.findMany();
    console.log("Members:", JSON.stringify(allMembers, null, 2));
}

diagnose().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
