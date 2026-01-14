#!/usr/bin/env tsx

/**
 * RBAC Verification and Debugging Script
 * This script checks the entire RBAC setup and helps debug issues
 */

// @ts-ignore - dotenv/config is a side-effect import
import 'dotenv/config';
import { db } from '../src/lib/connect-db';
import { user, role, userRole, permission, rolePermission } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { getUserPermissions, hasRole, hasPermission } from '../src/lib/rbac/permissions';

async function verifyRBACSetup() {
  console.log('🔍 RBAC Setup Verification\n');
  console.log('='.repeat(60));

  try {
    // 1. Check Roles
    console.log('\n📋 1. CHECKING ROLES');
    console.log('-'.repeat(60));
    const roles = await db.select().from(role);
    console.log(`✓ Found ${roles.length} roles:`);
    roles.forEach(r => {
      console.log(`  - ${r.name}: ${r.description || 'No description'} (Active: ${r.isActive})`);
    });

    // 2. Check Permissions
    console.log('\n🔐 2. CHECKING PERMISSIONS');
    console.log('-'.repeat(60));
    const permissions = await db.select().from(permission);
    console.log(`✓ Found ${permissions.length} permissions`);
    
    // Group by resource
    const permsByResource: Record<string, any[]> = {};
    permissions.forEach(p => {
      if (!permsByResource[p.resource]) {
        permsByResource[p.resource] = [];
      }
      permsByResource[p.resource].push(p);
    });
    
    Object.entries(permsByResource).forEach(([resource, perms]) => {
      console.log(`  ${resource}:`);
      perms.forEach(p => {
        console.log(`    - ${p.name} (${p.action})`);
      });
    });

    // 3. Check Role-Permission Mappings
    console.log('\n🔗 3. CHECKING ROLE-PERMISSION MAPPINGS');
    console.log('-'.repeat(60));
    for (const r of roles) {
      const rolePerms = await db
        .select({
          permissionName: permission.name,
          resource: permission.resource,
          action: permission.action,
        })
        .from(rolePermission)
        .innerJoin(permission, eq(rolePermission.permissionId, permission.id))
        .where(eq(rolePermission.roleId, r.id));
      
      console.log(`  ${r.name}: ${rolePerms.length} permissions`);
      if (rolePerms.length > 0) {
        rolePerms.slice(0, 5).forEach(p => {
          console.log(`    - ${p.permissionName} (${p.resource}:${p.action})`);
        });
        if (rolePerms.length > 5) {
          console.log(`    ... and ${rolePerms.length - 5} more`);
        }
      }
    }

    // 4. Check Users
    console.log('\n👥 4. CHECKING USERS');
    console.log('-'.repeat(60));
    const users = await db.select({
      id: user.id,
      email: user.email,
      userName: user.userName,
      supabaseUserId: user.supabaseUserId,
      hasPassword: user.hasPassword,
    }).from(user);
    
    console.log(`✓ Found ${users.length} users:`);
    users.forEach(u => {
      console.log(`  - ${u.userName || 'No username'} (${u.email || 'No email'})`);
      console.log(`    Local ID: ${u.id}`);
      console.log(`    Supabase ID: ${u.supabaseUserId || 'Not linked'}`);
      console.log(`    Has Password: ${u.hasPassword}`);
    });

    // 5. Check User-Role Assignments
    console.log('\n👤 5. CHECKING USER-ROLE ASSIGNMENTS');
    console.log('-'.repeat(60));
    
    for (const u of users) {
      const userRoles = await db
        .select({
          roleId: userRole.roleId,
          roleName: role.name,
          isActive: userRole.isActive,
          assignedAt: userRole.assignedAt,
        })
        .from(userRole)
        .innerJoin(role, eq(userRole.roleId, role.id))
        .where(eq(userRole.userId, u.id));
      
      console.log(`\n  User: ${u.userName || u.email || u.id}`);
      if (userRoles.length === 0) {
        console.log(`    ⚠️  NO ROLES ASSIGNED!`);
      } else {
        userRoles.forEach(ur => {
          console.log(`    - ${ur.roleName} (Active: ${ur.isActive}, Assigned: ${ur.assignedAt})`);
        });

        // Test permission retrieval
        console.log(`\n    Testing permission retrieval for this user...`);
        const userPerms = await getUserPermissions(u.id);
        console.log(`    ✓ Roles: ${userPerms.roles.map(r => r.name).join(', ')}`);
        console.log(`    ✓ Total Permissions: ${userPerms.permissions.length}`);
        
        // Test specific role check
        if (userRoles.length > 0) {
          const testRoleName = userRoles[0].roleName;
          const hasTestRole = await hasRole(u.id, testRoleName);
          console.log(`    ✓ hasRole('${testRoleName}'): ${hasTestRole}`);
        }
        
        // Test specific permission check
        if (userPerms.permissions.length > 0) {
          const testPerm = userPerms.permissions[0];
          const hasTestPerm = await hasPermission(u.id, testPerm.resource, testPerm.action);
          console.log(`    ✓ hasPermission('${testPerm.resource}', '${testPerm.action}'): ${hasTestPerm}`);
        }
      }
    }

    // 6. Identify Issues
    console.log('\n⚠️  6. POTENTIAL ISSUES');
    console.log('-'.repeat(60));
    
    const issues: string[] = [];
    
    if (roles.length === 0) {
      issues.push('❌ No roles found! Run: npm run db:seed-rbac');
    }
    
    if (permissions.length === 0) {
      issues.push('❌ No permissions found! Run: npm run db:seed-rbac');
    }
    
    for (const u of users) {
      const userRolesCount = await db.select().from(userRole).where(eq(userRole.userId, u.id));
      if (userRolesCount.length === 0) {
        issues.push(`⚠️  User ${u.userName || u.email || u.id} has no roles assigned`);
      }
      
      if (!u.supabaseUserId) {
        issues.push(`⚠️  User ${u.userName || u.email || u.id} has no Supabase ID (auth won't work)`);
      }
    }
    
    if (issues.length === 0) {
      console.log('  ✅ No issues detected!');
    } else {
      issues.forEach(issue => console.log(`  ${issue}`));
    }

    // 7. Recommendations
    console.log('\n💡 7. RECOMMENDATIONS');
    console.log('-'.repeat(60));
    
    const recommendations: string[] = [];
    
    if (roles.length === 0 || permissions.length === 0) {
      recommendations.push('Run: npm run db:seed-rbac');
    }
    
    for (const u of users) {
      const userRolesCount = await db.select().from(userRole).where(eq(userRole.userId, u.id));
      if (userRolesCount.length === 0) {
        recommendations.push(`Assign a role to ${u.userName || u.email}: npm run db:assign-super-admin`);
      }
    }
    
    if (recommendations.length === 0) {
      console.log('  ✅ Everything looks good!');
    } else {
      recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Verification Complete!\n');

  } catch (error) {
    console.error('\n❌ Error during verification:', error);
    throw error;
  }
}

// Run the verification
verifyRBACSetup()
  .then(() => {
    console.log('Exiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Verification failed:', error);
    process.exit(1);
  });
