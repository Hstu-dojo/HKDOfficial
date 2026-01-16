// Swagger specification for Karate Dojo API
export const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Karate Dojo API",
    description: "REST API for Karate Dojo Management System with RBAC",
    version: "1.0.0",
    contact: {
      name: "Karate Dojo Team",
      email: "support@karatedojo.com"
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT"
    }
  },
  servers: [
    {
      url: "http://localhost:3000/api",
      description: "Development server"
    }
  ],
  tags: [
    { name: "Authentication", description: "User authentication and authorization" },
    { name: "Users", description: "User management" },
    { name: "RBAC", description: "Role-based access control" },
    { name: "Roles", description: "Role management" },
    { name: "Permissions", description: "Permission management" },
    { name: "Gallery", description: "Gallery management (images, albums)" },
    { name: "Events", description: "Event management" },
    { name: "Announcements", description: "Announcement management" },
    { name: "Certificates", description: "Certificate management" },
    { name: "Reports", description: "Report generation and management" }
  ],
  security: [
    { bearerAuth: [] },
    { sessionAuth: [] }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT"
      },
      sessionAuth: {
        type: "apiKey",
        in: "cookie",
        name: "next-auth.session-token"
      }
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          email: { type: "string", format: "email" },
          emailVerified: { type: "boolean" },
          userName: { type: "string" },
          userAvatar: { type: "string" },
          defaultRole: { 
            type: "string", 
            enum: ["ADMIN", "MODERATOR", "INSTRUCTOR", "MEMBER", "GUEST"] 
          },
          roleId: { type: "string", format: "uuid", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "email", "userName", "userAvatar", "defaultRole"]
      },
      NewUser: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          userName: { type: "string", minLength: 3 },
          userAvatar: { type: "string" },
          defaultRole: { 
            type: "string", 
            enum: ["ADMIN", "MODERATOR", "INSTRUCTOR", "MEMBER", "GUEST"],
            default: "GUEST"
          }
        },
        required: ["email", "password", "userName", "userAvatar"]
      },
      UserSignup: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          userName: { type: "string", minLength: 3 }
        },
        required: ["email", "password", "userName"]
      },
      UserLogin: {
        type: "object",
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" }
        },
        required: ["email", "password"]
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          isActive: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "name", "isActive"]
      },
      NewRole: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          description: { type: "string" }
        },
        required: ["name"]
      },
      Permission: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          description: { type: "string", nullable: true },
          resource: { 
            type: "string", 
            enum: ["USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT", "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT"] 
          },
          action: { 
            type: "string", 
            enum: ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"] 
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" }
        },
        required: ["id", "name", "resource", "action"]
      },
      NewPermission: {
        type: "object",
        properties: {
          name: { type: "string", minLength: 1 },
          description: { type: "string" },
          resource: { 
            type: "string", 
            enum: ["USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT", "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT"] 
          },
          action: { 
            type: "string", 
            enum: ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"] 
          }
        },
        required: ["name", "resource", "action"]
      },
      UserPermissions: {
        type: "object",
        properties: {
          userId: { type: "string", format: "uuid" },
          roles: { 
            type: "array", 
            items: { $ref: "#/components/schemas/Role" } 
          },
          permissions: { 
            type: "array", 
            items: { $ref: "#/components/schemas/Permission" } 
          }
        }
      },
      Error: {
        type: "object",
        properties: {
          error: { type: "string" },
          details: { type: "array", items: { type: "object" } }
        }
      },
      Success: {
        type: "object",
        properties: {
          message: { type: "string" }
        }
      }
    },
    responses: {
      UnauthorizedError: {
        description: "Access token is missing or invalid",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      ForbiddenError: {
        description: "Insufficient permissions",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      NotFoundError: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      ValidationError: {
        description: "Invalid input data",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      },
      ServerError: {
        description: "Internal server error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/Error" }
          }
        }
      }
    }
  },
  paths: {
    "/auth/signup": {
      post: {
        tags: ["Authentication"],
        summary: "Register a new user",
        description: "Create a new user account with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserSignup" }
            }
          }
        },
        responses: {
          "201": {
            description: "User created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    user: { $ref: "#/components/schemas/User" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "409": {
            description: "User already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/auth/signin": {
      post: {
        tags: ["Authentication"],
        summary: "Sign in user",
        description: "Authenticate user with email and password",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserLogin" }
            }
          }
        },
        responses: {
          "200": {
            description: "Login successful",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    user: { $ref: "#/components/schemas/User" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": {
            description: "Invalid credentials",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/roles": {
      get: {
        tags: ["RBAC", "Roles"],
        summary: "Get all roles",
        description: "Retrieve all available roles",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": {
            description: "Roles retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roles: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Role" }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      post: {
        tags: ["RBAC", "Roles"],
        summary: "Create a new role",
        description: "Create a new role with specified permissions",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewRole" }
            }
          }
        },
        responses: {
          "201": {
            description: "Role created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roleId: { type: "string", format: "uuid" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "409": {
            description: "Role already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/permissions": {
      get: {
        tags: ["RBAC", "Permissions"],
        summary: "Get all permissions",
        description: "Retrieve all available permissions",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": {
            description: "Permissions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Permission" }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      post: {
        tags: ["RBAC", "Permissions"],
        summary: "Create a new permission",
        description: "Create a new permission for a specific resource and action",
        security: [{ sessionAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewPermission" }
            }
          }
        },
        responses: {
          "201": {
            description: "Permission created successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissionId: { type: "string", format: "uuid" },
                    message: { type: "string" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "409": {
            description: "Permission already exists",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/users/{userId}/roles": {
      get: {
        tags: ["RBAC", "Users"],
        summary: "Get user roles and permissions",
        description: "Retrieve all roles and permissions for a specific user",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User ID"
          }
        ],
        responses: {
          "200": {
            description: "User permissions retrieved successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UserPermissions" }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      post: {
        tags: ["RBAC", "Users"],
        summary: "Assign role to user",
        description: "Assign a role to a specific user",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "userId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "User ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  roleId: { type: "string", format: "uuid" }
                },
                required: ["roleId"]
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Role assigned to user successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/roles/{roleId}": {
      get: {
        tags: ["RBAC", "Roles"],
        summary: "Get role by ID",
        description: "Retrieve a specific role with its permissions",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        responses: {
          "200": {
            description: "Role retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    role: { $ref: "#/components/schemas/Role" },
                    permissions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Permission" }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      put: {
        tags: ["RBAC", "Roles"],
        summary: "Update role",
        description: "Update an existing role's name or description",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 1 },
                  description: { type: "string" }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Role updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      delete: {
        tags: ["RBAC", "Roles"],
        summary: "Delete role",
        description: "Delete a role. Core roles (SUPER_ADMIN, ADMIN, USER) cannot be deleted.",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        responses: {
          "200": {
            description: "Role deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          "400": {
            description: "Cannot delete core role",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/roles/{roleId}/permissions": {
      get: {
        tags: ["RBAC", "Roles"],
        summary: "Get role permissions",
        description: "Retrieve all permissions assigned to a specific role",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        responses: {
          "200": {
            description: "Permissions retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permissions: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Permission" }
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      post: {
        tags: ["RBAC", "Roles"],
        summary: "Assign permissions to role",
        description: "Assign one or more permissions to a role",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  permissionId: { type: "string", format: "uuid", description: "Single permission ID" },
                  permissionIds: { 
                    type: "array", 
                    items: { type: "string", format: "uuid" },
                    description: "Array of permission IDs for bulk assignment"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Permissions assigned successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    count: { type: "integer", description: "Number of permissions assigned" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      delete: {
        tags: ["RBAC", "Roles"],
        summary: "Remove permissions from role",
        description: "Remove one or more permissions from a role",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "roleId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Role ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  permissionId: { type: "string", format: "uuid", description: "Single permission ID" },
                  permissionIds: { 
                    type: "array", 
                    items: { type: "string", format: "uuid" },
                    description: "Array of permission IDs for bulk removal"
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Permissions removed successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: { type: "string" },
                    count: { type: "integer", description: "Number of permissions removed" }
                  }
                }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/permissions/{permissionId}": {
      get: {
        tags: ["RBAC", "Permissions"],
        summary: "Get permission by ID",
        description: "Retrieve a specific permission by its ID",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "permissionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Permission ID"
          }
        ],
        responses: {
          "200": {
            description: "Permission retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    permission: { $ref: "#/components/schemas/Permission" }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      put: {
        tags: ["RBAC", "Permissions"],
        summary: "Update permission",
        description: "Update an existing permission's properties",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "permissionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Permission ID"
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", minLength: 1 },
                  description: { type: "string" },
                  resource: { 
                    type: "string", 
                    enum: ["USER", "ACCOUNT", "SESSION", "PROVIDER", "ROLE", "PERMISSION", "COURSE", "BLOG", "MEDIA", "CLASS", "EQUIPMENT", "MEMBER", "BILL", "PAYMENT", "GALLERY", "EVENT", "ANNOUNCEMENT", "CERTIFICATE", "REPORT"]
                  },
                  action: { 
                    type: "string", 
                    enum: ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE"] 
                  }
                }
              }
            }
          }
        },
        responses: {
          "200": {
            description: "Permission updated successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      },
      delete: {
        tags: ["RBAC", "Permissions"],
        summary: "Delete permission",
        description: "Delete a permission from the system",
        security: [{ sessionAuth: [] }],
        parameters: [
          {
            name: "permissionId",
            in: "path",
            required: true,
            schema: { type: "string", format: "uuid" },
            description: "Permission ID"
          }
        ],
        responses: {
          "200": {
            description: "Permission deleted successfully",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Success" }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    },
    "/rbac/matrix": {
      get: {
        tags: ["RBAC"],
        summary: "Get RBAC matrix",
        description: "Retrieve the complete role-permission matrix showing all roles with their assigned permissions, grouped by resource type",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": {
            description: "Matrix retrieved successfully",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    roles: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: { type: "string", format: "uuid" },
                          name: { type: "string" },
                          description: { type: "string", nullable: true },
                          isActive: { type: "boolean" },
                          permissions: {
                            type: "array",
                            items: { $ref: "#/components/schemas/Permission" }
                          }
                        }
                      }
                    },
                    permissionsByResource: {
                      type: "object",
                      description: "Permissions grouped by resource type",
                      additionalProperties: {
                        type: "array",
                        items: { $ref: "#/components/schemas/Permission" }
                      }
                    },
                    resources: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of all resource types"
                    }
                  }
                }
              }
            }
          },
          "401": { $ref: "#/components/responses/UnauthorizedError" },
          "403": { $ref: "#/components/responses/ForbiddenError" },
          "500": { $ref: "#/components/responses/ServerError" }
        }
      }
    }
  }
};

export default swaggerSpec;
