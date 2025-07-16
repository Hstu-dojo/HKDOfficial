import { readFileSync } from 'fs';
import { join } from 'path';

// Simple YAML parser for our specific use case
function parseYaml(content: string): any {
  try {
    // This is a simple parser - for production use a proper YAML library
    return JSON.parse(JSON.stringify(eval('(' + content.replace(/:\s*([^,}\]]+)/g, ': "$1"').replace(/"/g, '\\"') + ')')));
  } catch (error) {
    // Fallback to manual parsing for our specific structure
    const lines = content.split('\n');
    const result: any = {};
    let current = result;
    let stack: any[] = [result];
    
    for (const line of lines) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      
      const indent = line.length - line.trimStart().length;
      const [key, ...valueParts] = line.trim().split(':');
      const value = valueParts.join(':').trim();
      
      if (value === '') {
        current[key] = {};
        stack.push(current[key]);
        current = current[key];
      } else {
        current[key] = value.replace(/^["']|["']$/g, '');
      }
    }
    
    return result;
  }
}

// Load main OpenAPI spec
const swaggerPath = join(process.cwd(), 'src', 'lib', 'swagger');
const openApiSpec = parseYaml(readFileSync(join(swaggerPath, 'openapi.yml'), 'utf8'));

// Load schemas
const userSchema = parseYaml(readFileSync(join(swaggerPath, 'schemas', 'user.yml'), 'utf8'));
const rbacSchema = parseYaml(readFileSync(join(swaggerPath, 'schemas', 'rbac.yml'), 'utf8'));
const accountSchema = parseYaml(readFileSync(join(swaggerPath, 'schemas', 'account.yml'), 'utf8'));
const authSchema = parseYaml(readFileSync(join(swaggerPath, 'schemas', 'auth.yml'), 'utf8'));

// Load paths
const authPaths = parseYaml(readFileSync(join(swaggerPath, 'paths', 'auth.yml'), 'utf8'));
const rbacPaths = parseYaml(readFileSync(join(swaggerPath, 'paths', 'rbac.yml'), 'utf8'));
const usersPaths = parseYaml(readFileSync(join(swaggerPath, 'paths', 'users.yml'), 'utf8'));

// Merge schemas
openApiSpec.components.schemas = {
  ...openApiSpec.components.schemas,
  ...userSchema,
  ...rbacSchema,
  ...accountSchema,
  ...authSchema,
};

// Merge paths
openApiSpec.paths = {
  ...openApiSpec.paths,
  ...authPaths,
  ...rbacPaths,
  ...usersPaths,
};

export const swaggerSpec = openApiSpec;

export default swaggerSpec;
