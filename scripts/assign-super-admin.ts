import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { user, role, userRole } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function assignSuperAdminRole() {
  try {
    console.log('🔍 Finding user and SUPER_ADMIN role...\n');

    // Get the user
    const users = await db.select().from(user);
    if (users.length === 0) {
      console.log('❌ No users found!');
      return;
    }

    const targetUser = users[0]; // Get the first (and likely only) user
    console.log(`👤 Found user: ${targetUser.userName || 'No name'} (${targetUser.email})`);

    // Get the SUPER_ADMIN role
    const superAdminRole = await db.select().from(role).where(eq(role.name, 'SUPER_ADMIN'));
    if (superAdminRole.length === 0) {
      console.log('❌ SUPER_ADMIN role not found!');
      return;
    }

    console.log(`🔑 Found SUPER_ADMIN role: ${superAdminRole[0].id}`);

    // Check if user already has this role
    const existingAssignment = await db
      .select()
      .from(userRole)
      .where(eq(userRole.userId, targetUser.id));

    console.log(`📋 Existing role assignments: ${existingAssignment.length}`);

    if (existingAssignment.length === 0) {
      // Assign SUPER_ADMIN role to user
      console.log('🚀 Assigning SUPER_ADMIN role to user...');
      
      await db.insert(userRole).values({
        userId: targetUser.id,
        roleId: superAdminRole[0].id,
        assignedBy: targetUser.id, // Self-assigned
        isActive: true,
      });

      console.log('✅ Successfully assigned SUPER_ADMIN role!');
    } else {
      console.log('ℹ️  User already has role assignments');
      existingAssignment.forEach(assignment => {
        console.log(`   - Role ID: ${assignment.roleId}, Active: ${assignment.isActive}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

assignSuperAdminRole();
