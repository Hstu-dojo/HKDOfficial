# RBAC Implementation Guide for New Features

This guide explains how to implement Role-Based Access Control (RBAC) functionality when creating new features in the Karate Dojo application.

## 🎯 Overview

Our RBAC system consists of:
- **Roles**: SUPER_ADMIN, ADMIN, MODERATOR, INSTRUCTOR, MEMBER, GUEST
- **Resources**: USER, ACCOUNT, ROLE, PERMISSION, COURSE, BLOG, MEDIA, etc.
- **Actions**: CREATE, READ, UPDATE, DELETE, MANAGE

## 📋 Step-by-Step Implementation Process

### Step 1: Define Your Feature's Resource and Actions

First, identify what **resource** your feature manages and what **actions** users can perform.

**Example: Creating a "Class Schedule" feature**
- Resource: `CLASS_SCHEDULE`
- Actions: `CREATE`, `READ`, `UPDATE`, `DELETE`

### Step 2: Add New Permissions to Seed Script

Add your feature's permissions to the RBAC seed script:

```typescript
// In scripts/seed-rbac.ts
const permissions = [
  // ... existing permissions
  { name: 'create_class_schedule', resource: 'CLASS_SCHEDULE', action: 'CREATE', description: 'Create class schedules' },
  { name: 'read_class_schedule', resource: 'CLASS_SCHEDULE', action: 'READ', description: 'View class schedules' },
  { name: 'update_class_schedule', resource: 'CLASS_SCHEDULE', action: 'UPDATE', description: 'Edit class schedules' },
  { name: 'delete_class_schedule', resource: 'CLASS_SCHEDULE', action: 'DELETE', description: 'Delete class schedules' },
  { name: 'manage_class_schedule', resource: 'CLASS_SCHEDULE', action: 'MANAGE', description: 'Full access to class schedules' },
];
```

### Step 3: Update Role Permissions

Assign permissions to appropriate roles:

```typescript
// In scripts/seed-rbac.ts
const rolePermissions = [
  // SUPER_ADMIN gets MANAGE permission (includes all actions)
  { roleName: 'SUPER_ADMIN', permissionName: 'manage_class_schedule' },
  
  // ADMIN gets most permissions
  { roleName: 'ADMIN', permissionName: 'create_class_schedule' },
  { roleName: 'ADMIN', permissionName: 'read_class_schedule' },
  { roleName: 'ADMIN', permissionName: 'update_class_schedule' },
  { roleName: 'ADMIN', permissionName: 'delete_class_schedule' },
  
  // INSTRUCTOR can manage their own schedules
  { roleName: 'INSTRUCTOR', permissionName: 'create_class_schedule' },
  { roleName: 'INSTRUCTOR', permissionName: 'read_class_schedule' },
  { roleName: 'INSTRUCTOR', permissionName: 'update_class_schedule' },
  
  // MEMBER can only read schedules
  { roleName: 'MEMBER', permissionName: 'read_class_schedule' },
  
  // GUEST can only read schedules
  { roleName: 'GUEST', permissionName: 'read_class_schedule' },
];
```

### Step 4: Update TypeScript Types

Add your resource to the types:

```typescript
// In src/lib/rbac/types.ts
export type ResourceType = 
  | "USER" 
  | "ACCOUNT" 
  | "ROLE" 
  | "PERMISSION" 
  | "COURSE" 
  | "BLOG" 
  | "MEDIA"
  | "CLASS_SCHEDULE"; // Add your new resource
```

### Step 5: Create Protected API Routes

Create API routes with RBAC protection:

```typescript
// src/app/api/class-schedule/route.ts
import { NextRequest, NextResponse } from "next/server";
import { protectApiRoute } from "@/lib/rbac/middleware";

// GET /api/class-schedule - Read schedules
export const GET = protectApiRoute("CLASS_SCHEDULE", "READ", async (request, context) => {
  try {
    // Your logic here
    const schedules = await getClassSchedules();
    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
});

// POST /api/class-schedule - Create schedule
export const POST = protectApiRoute("CLASS_SCHEDULE", "CREATE", async (request, context) => {
  try {
    const data = await request.json();
    // Your validation and creation logic
    const schedule = await createClassSchedule(data);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error("Error creating schedule:", error);
    return NextResponse.json({ error: "Failed to create schedule" }, { status: 500 });
  }
});
```

### Step 6: Protect Frontend Pages

Use middleware to protect pages:

```typescript
// src/app/admin/class-schedule/page.tsx
import { protectPage } from "@/lib/rbac/middleware";
import { ClassScheduleManager } from "@/components/class-schedule/ClassScheduleManager";

export default async function ClassSchedulePage() {
  // Protect the page - only users with READ permission can access
  await protectPage("CLASS_SCHEDULE", "READ");

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Class Schedule Management</h1>
      <ClassScheduleManager />
    </div>
  );
}
```

### Step 7: Add Client-Side Permission Checks

Use hooks for conditional rendering:

```typescript
// src/components/class-schedule/ClassScheduleManager.tsx
'use client';

import { useRBAC } from "@/hooks/useRBAC";
import { Button } from "@/components/ui/button";

export function ClassScheduleManager() {
  const { hasPermission, hasRole } = useRBAC();

  const canCreate = hasPermission("CLASS_SCHEDULE", "CREATE");
  const canUpdate = hasPermission("CLASS_SCHEDULE", "UPDATE");
  const canDelete = hasPermission("CLASS_SCHEDULE", "DELETE");
  const isAdmin = hasRole("ADMIN");

  return (
    <div>
      {/* Always show list if user has READ permission */}
      <ClassScheduleList />

      {/* Conditionally show create button */}
      {canCreate && (
        <Button onClick={handleCreate}>
          Create New Schedule
        </Button>
      )}

      {/* Admin-only features */}
      {isAdmin && (
        <div>
          <Button variant="destructive">Admin Actions</Button>
        </div>
      )}
    </div>
  );
}
```

### Step 8: Implement Resource-Specific Logic

For features where users can only access their own data:

```typescript
// In your API route or database function
export const GET = protectApiRoute("CLASS_SCHEDULE", "READ", async (request, context) => {
  try {
    let schedules;
    
    // Super admins and admins can see all schedules
    if (await hasRole(context.userId, "SUPER_ADMIN") || await hasRole(context.userId, "ADMIN")) {
      schedules = await getAllClassSchedules();
    } 
    // Instructors can only see their own schedules
    else if (await hasRole(context.userId, "INSTRUCTOR")) {
      schedules = await getClassSchedulesByInstructor(context.userId);
    }
    // Members and guests see public schedules only
    else {
      schedules = await getPublicClassSchedules();
    }

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Error fetching schedules:", error);
    return NextResponse.json({ error: "Failed to fetch schedules" }, { status: 500 });
  }
});
```

## 🔄 Deployment Process

### 1. Run Database Migration
```bash
pnpm db:push
```

### 2. Update RBAC Data
```bash
pnpm db:seed-rbac
```

### 3. Test Permissions
```bash
pnpm db:test-permissions
```

## 🧪 Testing Your Implementation

Create test scripts for your feature:

```typescript
// scripts/test-class-schedule-permissions.ts
import { hasPermission, hasRole } from '../src/lib/rbac/permissions';

async function testClassSchedulePermissions() {
  const userId = "your-user-id";

  console.log("Testing Class Schedule Permissions:");
  console.log(`CREATE: ${await hasPermission(userId, "CLASS_SCHEDULE", "CREATE")}`);
  console.log(`READ: ${await hasPermission(userId, "CLASS_SCHEDULE", "READ")}`);
  console.log(`UPDATE: ${await hasPermission(userId, "CLASS_SCHEDULE", "UPDATE")}`);
  console.log(`DELETE: ${await hasPermission(userId, "CLASS_SCHEDULE", "DELETE")}`);
}
```

## 📝 Best Practices

1. **Follow the Principle of Least Privilege**: Give users only the minimum permissions needed
2. **Use MANAGE permissions for admin actions**: MANAGE includes CREATE, READ, UPDATE, DELETE
3. **Always validate on the server side**: Client-side checks are for UX only
4. **Log permission checks**: Add logging for debugging and audit trails
5. **Test with different user roles**: Ensure your feature works correctly for all role types
6. **Use resource-specific permissions**: Don't rely on role checks alone

## 🚨 Common Pitfalls

1. **Forgetting to protect API routes**: Always use `protectApiRoute` for sensitive endpoints
2. **Only client-side validation**: Server-side protection is mandatory
3. **Hardcoding user IDs**: Use session data from context
4. **Not handling edge cases**: What happens when a user has no roles?
5. **Inconsistent permission naming**: Follow the established naming convention

## 📚 Quick Reference

### Available Middleware Functions
- `protectApiRoute(resource, action, handler)` - Protect API routes
- `protectPage(resource, action)` - Protect pages
- `hasPermission(userId, resource, action)` - Check specific permission
- `hasRole(userId, roleName)` - Check if user has role

### Available Hooks
- `useRBAC()` - Get permission checking functions in components

### Database Scripts
- `pnpm db:seed-rbac` - Initialize/update RBAC data
- `pnpm db:assign-super-admin` - Assign super admin to first user
- `pnpm db:test-permissions` - Test user permissions

This guide should give you a complete roadmap for implementing RBAC in any new feature you create!
