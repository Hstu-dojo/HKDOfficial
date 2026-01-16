import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { user, role, userRole } from '../src/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

/**
 * Sync users' defaultRole to the userRole table
 * This ensures all existing users have proper RBAC role assignments
 */
async function syncDefaultRoles() {
  try {
    console.log('🔄 Starting default role sync...\n');

    // Get all users with their defaultRole
    const users = await db.select({
      id: user.id,
      email: user.email,
      userName: user.userName,
      defaultRole: user.defaultRole,
    }).from(user);

    console.log(`📋 Found ${users.length} users\n`);

    // Get all roles
    const roles = await db.select().from(role);
    const roleMap = new Map(roles.map(r => [r.name, r.id]));

    console.log(`🔑 Available roles: ${roles.map(r => r.name).join(', ')}\n`);

    let synced = 0;
    let skipped = 0;
    let errors = 0;

    for (const u of users) {
      console.log(`Processing: ${u.userName || u.email} (defaultRole: ${u.defaultRole})`);

      if (!u.defaultRole) {
        console.log(`  ⏭️  Skipped - no defaultRole set`);
        skipped++;
        continue;
      }

      // Check if user already has a role assignment
      const existingAssignment = await db
        .select()
        .from(userRole)
        .where(and(eq(userRole.userId, u.id), eq(userRole.isActive, true)));

      if (existingAssignment.length > 0) {
        console.log(`  ⏭️  Skipped - already has role assignments`);
        skipped++;
        continue;
      }

      // Find the matching role
      const roleId = roleMap.get(u.defaultRole);

      if (!roleId) {
        console.log(`  ⚠️  Warning - role "${u.defaultRole}" not found in RBAC system`);
        
        // Check if there's a mapping (e.g., MEMBER -> USER)
        const roleMappings: Record<string, string> = {
          'GUEST': 'USER',
          'MEMBER': 'USER',
        };
        
        const mappedRole = roleMappings[u.defaultRole];
        const mappedRoleId = mappedRole ? roleMap.get(mappedRole) : null;
        
        if (mappedRoleId) {
          console.log(`  📝 Mapping "${u.defaultRole}" to "${mappedRole}"`);
          await db.insert(userRole).values({
            userId: u.id,
            roleId: mappedRoleId,
            assignedBy: u.id,
            isActive: true,
          });
          console.log(`  ✅ Synced with mapped role`);
          synced++;
        } else {
          console.log(`  ❌ Error - no mapping available`);
          errors++;
        }
        continue;
      }

      // Assign the role
      try {
        await db.insert(userRole).values({
          userId: u.id,
          roleId: roleId,
          assignedBy: u.id, // Self-assigned from default
          isActive: true,
        });
        console.log(`  ✅ Synced`);
        synced++;
      } catch (err) {
        console.log(`  ❌ Error: ${err}`);
        errors++;
      }
    }

    console.log('\n========================================');
    console.log('📊 Sync Summary:');
    console.log(`   ✅ Synced: ${synced}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

syncDefaultRoles();
