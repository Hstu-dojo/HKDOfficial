# API Documentation

## Overview

The Karate Dojo API provides comprehensive endpoints for managing users, authentication, and role-based access control (RBAC). This documentation outlines all available endpoints, their usage, and authentication requirements.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://yourapp.vercel.app/api`

## Authentication

This API uses session-based authentication with NextAuth. All protected endpoints require a valid session token.

### Authentication Headers

```
Cookie: next-auth.session-token=<your-session-token>
```

## API Endpoints

### Authentication

#### POST /auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "userName": "username"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userName": "username",
    "defaultRole": "GUEST"
  },
  "message": "User created successfully"
}
```

#### POST /auth/signin
Sign in an existing user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "userName": "username"
  }
}
```

### RBAC - Roles

#### GET /rbac/roles
Get all available roles.

**Authentication:** Required  
**Permission:** READ on ROLE resource

**Response:**
```json
{
  "roles": [
    {
      "id": "uuid",
      "name": "ADMIN",
      "description": "Administrator role",
      "isActive": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /rbac/roles
Create a new role.

**Authentication:** Required  
**Permission:** CREATE on ROLE resource

**Request Body:**
```json
{
  "name": "CUSTOM_ROLE",
  "description": "Custom role description"
}
```

**Response:**
```json
{
  "roleId": "uuid",
  "message": "Role created successfully"
}
```

### RBAC - Permissions

#### GET /rbac/permissions
Get all available permissions.

**Authentication:** Required  
**Permission:** READ on PERMISSION resource

**Response:**
```json
{
  "permissions": [
    {
      "id": "uuid",
      "name": "create_user",
      "description": "Create new users",
      "resource": "USER",
      "action": "CREATE",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST /rbac/permissions
Create a new permission.

**Authentication:** Required  
**Permission:** CREATE on PERMISSION resource

**Request Body:**
```json
{
  "name": "custom_permission",
  "description": "Custom permission description",
  "resource": "USER",
  "action": "READ"
}
```

**Available Resources:**
- USER
- ACCOUNT
- SESSION
- PROVIDER
- ROLE
- PERMISSION
- COURSE
- BLOG
- MEDIA

**Available Actions:**
- CREATE
- READ
- UPDATE
- DELETE
- MANAGE (grants all actions)

### RBAC - User Role Management

#### GET /rbac/users/{userId}/roles
Get user's roles and permissions.

**Authentication:** Required  
**Permission:** READ on USER resource

**Response:**
```json
{
  "userId": "uuid",
  "roles": [
    {
      "id": "uuid",
      "name": "ADMIN",
      "description": "Administrator role",
      "isActive": true
    }
  ],
  "permissions": [
    {
      "id": "uuid",
      "name": "create_user",
      "resource": "USER",
      "action": "CREATE"
    }
  ]
}
```

#### POST /rbac/users/{userId}/roles
Assign a role to a user.

**Authentication:** Required  
**Permission:** UPDATE on USER resource

**Request Body:**
```json
{
  "roleId": "uuid"
}
```

**Response:**
```json
{
  "message": "Role assigned successfully"
}
```

#### DELETE /rbac/users/{userId}/roles
Remove a role from a user.

**Authentication:** Required  
**Permission:** UPDATE on USER resource

**Request Body:**
```json
{
  "roleId": "uuid"
}
```

**Response:**
```json
{
  "message": "Role removed successfully"
}
```

### RBAC - Seeding

#### POST /rbac/seed
Seed the database with default roles and permissions.

**Authentication:** Required  
**Permission:** MANAGE on PERMISSION resource

**Response:**
```json
{
  "message": "RBAC data seeded successfully"
}
```

## Default Roles and Permissions

### Default Roles

1. **SUPER_ADMIN**
   - Full access to all resources
   - Can manage users, roles, and permissions

2. **ADMIN**
   - User and account management
   - Course, blog, and media management
   - Read access to roles and permissions

3. **MODERATOR**
   - Limited user management
   - Content creation and editing
   - Read access to system data

4. **INSTRUCTOR**
   - Course and content management
   - Read access to users and accounts

5. **MEMBER**
   - Read access to courses, blogs, and media

6. **GUEST**
   - Read-only access to public content

### Permission Matrix

| Role | Users | Accounts | Roles | Permissions | Courses | Blogs | Media |
|------|-------|----------|-------|-------------|---------|-------|-------|
| SUPER_ADMIN | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE | MANAGE |
| ADMIN | CRUD | CRUD | READ | READ | MANAGE | MANAGE | MANAGE |
| MODERATOR | RU | RU | READ | READ | CRU | CRU | CRU |
| INSTRUCTOR | READ | READ | - | - | CRU | CRU | CRU |
| MEMBER | READ | READ | - | - | READ | READ | READ |
| GUEST | - | - | - | - | READ | READ | READ |

**Legend:**
- C = Create
- R = Read
- U = Update
- D = Delete
- MANAGE = Full access (CRUD)

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "error": "Not found"
}
```

### 409 Conflict
```json
{
  "error": "User already exists"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Data Models

### User
```typescript
{
  id: string;
  email: string;
  emailVerified: boolean;
  userName: string;
  userAvatar: string;
  defaultRole: "ADMIN" | "MODERATOR" | "INSTRUCTOR" | "MEMBER" | "GUEST";
  roleId?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Role
```typescript
{
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

### Permission
```typescript
{
  id: string;
  name: string;
  description?: string;
  resource: "USER" | "ACCOUNT" | "SESSION" | "PROVIDER" | "ROLE" | "PERMISSION" | "COURSE" | "BLOG" | "MEDIA";
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "MANAGE";
  createdAt: string;
  updatedAt: string;
}
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute per IP
- RBAC endpoints: 100 requests per minute per user
- General endpoints: 1000 requests per hour per user

## Changelog

### v1.0.0 (2025-01-16)
- Initial API release
- Authentication endpoints
- RBAC system implementation
- User management
- Role and permission management
- Comprehensive documentation

## Support

For API support, please contact:
- Email: support@karatedojo.com
- Documentation: /api (this page)
- Swagger JSON: /api/swagger
