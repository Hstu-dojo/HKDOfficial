import 'dotenv/config';
import { getUserPermissions, hasPermission, hasRole } from '../src/lib/rbac/permissions';

async function testUserPermissions() {
  const userId = 'b24cc32b-5a60-44d9-8de4-463dab484546'; // User ID from the output above

  try {
    console.log('🔍 Testing user permissions...\n');

    // Get user permissions
    console.log('📋 Getting user permissions:');
    const userPermissions = await getUserPermissions(userId);
    
    console.log(`👤 User ID: ${userPermissions.userId}`);
    console.log(`🔑 Roles (${userPermissions.roles.length}):`);
    userPermissions.roles.forEach(role => {
      console.log(`   - ${role.name}: ${role.description} (Active: ${role.isActive})`);
    });
    
    console.log(`🎯 Permissions (${userPermissions.permissions.length}):`);
    userPermissions.permissions.forEach(perm => {
      console.log(`   - ${perm.name}: ${perm.resource}:${perm.action}`);
    });

    // Test specific permissions
    console.log('\n🧪 Testing specific permissions:');
    const hasPermissionRead = await hasPermission(userId, 'PERMISSION', 'READ');
    const hasRoleRead = await hasPermission(userId, 'ROLE', 'READ');
    const hasSuperAdminRole = await hasRole(userId, 'SUPER_ADMIN');

    console.log(`   - PERMISSION:READ -> ${hasPermissionRead ? '✅' : '❌'}`);
    console.log(`   - ROLE:READ -> ${hasRoleRead ? '✅' : '❌'}`);
    console.log(`   - Has SUPER_ADMIN role -> ${hasSuperAdminRole ? '✅' : '❌'}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error testing permissions:', error);
    process.exit(1);
  }
}

testUserPermissions();
