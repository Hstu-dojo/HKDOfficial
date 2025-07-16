import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";
import { seedRBACData } from "@/lib/rbac/seed";

// POST /api/rbac/seed - Seed RBAC data
export const POST = protectApiRoute("ROLE", "MANAGE", async (request, context) => {
  try {
    await seedRBACData();
    return NextResponse.json({ message: "RBAC data seeded successfully" });
  } catch (error) {
    console.error("Error seeding RBAC data:", error);
    return NextResponse.json({ error: "Failed to seed RBAC data" }, { status: 500 });
  }
});
