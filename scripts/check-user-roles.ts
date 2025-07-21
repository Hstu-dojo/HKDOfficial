import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { user, role, userRole } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function checkUserRoles() {
  try {
    console.log('🔍 Checking users and their roles...\n');

    // Check all users
    const users = await db.select().from(user);
    console.log('📋 All users:', users.length);
    users.forEach(u => {
      console.log(`  - ${u.userName} (${u.email}) - ID: ${u.id}`);
    });

    // Check all roles
    console.log('\n📋 All roles:');
    const roles = await db.select().from(role);
    roles.forEach(r => {
      console.log(`  - ${r.name} (${r.description}) - ID: ${r.id}, Active: ${r.isActive}`);
    });

    // Check user-role assignments
    console.log('\n📋 User-role assignments:');
    const userRoles = await db
      .select({
        userId: userRole.userId,
        roleId: userRole.roleId,
        isActive: userRole.isActive,
        roleName: role.name,
        userName: user.userName,
        userEmail: user.email,
      })
      .from(userRole)
      .innerJoin(role, eq(userRole.roleId, role.id))
      .innerJoin(user, eq(userRole.userId, user.id));

    if (userRoles.length === 0) {
      console.log('  ❌ No user-role assignments found!');
    } else {
      userRoles.forEach(ur => {
        console.log(`  - ${ur.userName} (${ur.userEmail}) -> ${ur.roleName} (Active: ${ur.isActive})`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error checking user roles:', error);
    process.exit(1);
  }
}

checkUserRoles();
