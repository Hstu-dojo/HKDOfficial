const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest } = require('next/server');

// Exercise real guard/handler code with authentication and storage isolated.
// These regression tests never create users or change the configured database.
function load(file, mocks = {}) {
  const output = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(output, {
    module, exports: module.exports, console: { log() {}, error() {} },
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : require(name),
    process, URL, Buffer,
  }, { filename: file });
  return module.exports;
}
const policy = load('src/lib/rbac/admin-route-access.ts');
const media = {
  roles: [{ name: 'CONTENT_ADMIN', isActive: true }],
  permissions: [
    { resource: 'ADMIN_PANEL', action: 'ACCESS' },
    { resource: 'MEDIA', action: 'MANAGE' },
    { resource: 'GALLERY', action: 'MANAGE' },
  ],
};

test('media administrator can use gallery but cannot open privileged URLs in any locale', () => {
  for (const locale of ['', '/en', '/bn', '/ne']) {
    assert.equal(policy.canAccessAdminRoute(media, locale + '/admin/gallery'), true);
    assert.equal(policy.canAccessAdminRoute(media, locale + '/admin/gallery/favorite'), true);
    for (const path of Object.keys(policy.adminRouteRules).filter(p => p !== '/admin/gallery')) {
      assert.equal(policy.canAccessAdminRoute(media, locale + path), false, path);
    }
  }
  assert.equal(policy.canAccessAdminRoute(media, '/admin/unregistered-page'), false);
  assert.equal(policy.canAccessAdminRoute({ ...media, permissions: [] }, '/admin/gallery'), false);
});

test('MANAGE is resource scoped and SUPER_ADMIN name does not bypass the permission matrix', () => {
  assert.equal(policy.allowsPermission(media, 'ROLE', 'UPDATE'), false);
  assert.equal(policy.allowsPermission(media, 'GALLERY', 'DELETE'), true);
  assert.equal(policy.canAccessAdminRoute({roles:[{name:'SUPER_ADMIN'}],permissions:[]}, '/admin/rbac'), false);
  const all = {roles:[{name:'SUPER_ADMIN'}], permissions:['ADMIN_PANEL', ...new Set(Object.values(policy.adminRouteRules).flatMap(r => r.permission ? [r.permission[0]] : []))].map(resource => ({resource,action:'MANAGE'}))};
  for(const route of Object.keys(policy.adminRouteRules)) assert.equal(policy.canAccessAdminRoute(all, route), true, route);
});

function middlewareFor(permissions, authenticated = true) {
  return load('src/lib/rbac/middleware.ts', {
    '@/lib/supabase/server': { createClient: async () => ({auth:{getUser:async()=>({data:{user:authenticated?{id:'auth-user',email:'test@example.test'}:null}})}}) },
    '@/lib/connect-db': {db:{select:()=>({from:()=>({where:()=>({limit:async()=>[{id:'local-user'}]})})})}},
    '@/db/schema': {user:{id:'id',supabaseUserId:'supabaseUserId'}},
    './permissions': {hasPermission:async(_id,r,a)=>policy.allowsPermission(permissions,r,a),hasRole:async()=>false},
  });
}
const protectedRoutes = [
  ['src/app/api/rbac/assign-role/route.ts','POST'],
  ['src/app/api/rbac/remove-role/route.ts','DELETE'],
  ['src/app/api/rbac/user-roles/route.ts','GET'],
  ['src/app/api/rbac/users/[userId]/roles/route.ts','POST'],
  ['src/app/api/rbac/user-permissions/[userId]/route.ts','DELETE'],
  ['src/app/api/admin/users/[userId]/roles/route.ts','POST'],
];
const noStorage = new Proxy({}, {get(){throw new Error('Protected storage was accessed before authorization');}});
for (const [file,method] of protectedRoutes) {
  test(`${method} ${file}: media-only and USER:UPDATE users receive 403 before parsing or storage`, async () => {
    for (const permissions of [media,{...media, permissions:[...media.permissions,{resource:'USER',action:'UPDATE'}]}]) {
      const route=load(file, {
        '@/lib/rbac/middleware':middlewareFor(permissions),
        '@/lib/rbac/permissions':{}, '@/lib/connect-db':{db:noStorage}, '@/db/schema':{},
      });
      const request=new NextRequest('http://localhost/api/rbac/users/local-user/roles',{method,...(method==='GET'?{}:{body:'invalid JSON'})});
      const response=await route[method](request, {params:Promise.resolve({userId:'local-user'})});
      assert.equal(response.status,403);
    }
  });
}

test('role assignment rejects anonymous callers and admits a ROLE:UPDATE manager to validation', async()=>{
  for(const [permissions,authenticated,expected]of [[media,false,401],[{roles:[],permissions:[{resource:'ROLE',action:'UPDATE'}]},true,400]]){
    const route=load('src/app/api/rbac/assign-role/route.ts',{'@/lib/rbac/middleware':middlewareFor(permissions,authenticated),'@/lib/connect-db':{db:noStorage},'@/db/schema':{}});
    const response=await route.POST(new NextRequest('http://localhost/api/rbac/assign-role',{method:'POST',body:'{}'}),{params:Promise.resolve({})});
    assert.equal(response.status,expected);
  }
});

test('direct calls to administrative server actions cannot read or mutate protected storage', async()=>{
  const mocks={'@/lib/rbac/middleware':{canAccess:async()=>false},'@/lib/connect-db':{db:noStorage},'@/db/schemas/karate':{},'@/db/schemas/auth':{},'@/db/schema':{},'@/db/schemas/partner':{},'@/db/schemas/karate/programs':{},'./check-profile':{},'@/lib/supabase/server':{},'next/cache':{revalidatePath(){}}};
  for(const [file,functions]of [
    ['program-actions',['createProgram','updateProgram','getAllPrograms','getProgramRegistrations','updateRegistrationStatus','adminAddRegistrantToProgram']],
    ['certificate-actions',['getAllCertificates','getSignatures','createSignature','issueCertificates','deleteCertificate']],
    ['committee-actions',['getCommitteeMembers','createCommittee','approveApplication','setCommitteeActive']],
  ]){
    const actions=load(`src/actions/${file}.ts`,mocks);
    for(const name of functions){const result=await actions[name]({});assert.equal(result.success,false,name);assert.equal(result.error,'Forbidden',name);}
  }
});

test('server page guard rejects media-only access before rendering protected content',async()=>{
  const denied=Symbol('redirect');
  const guards=load('src/lib/rbac/page-access.ts',{
    'server-only':{},react:{cache:fn=>fn},'next/navigation':{redirect:()=>{throw denied;}},
    './middleware':{getRBACContext:async()=>({userId:'local-user'})},
    './permissions':{getUserPermissionsWithFallback:async()=>media},'./admin-route-access':policy,
  });
  await guards.requireAdminPageAccess('/admin/gallery');
  await assert.rejects(guards.requireAdminPageAccess('/admin/rbac'),error=>error===denied);
});

test('revoked assignments and inactive fallback roles cannot restore privileged defaultRole access',async()=>{
  for(const [responses,expectedCalls]of [
    [[[{id:'revoked-assignment'}],[]],2],
    [[[],[],[{defaultRole:'SUPER_ADMIN'}],[{id:'role',name:'SUPER_ADMIN',isActive:false}]],4],
    [[new Error('database unavailable')],1],
  ]){
    let calls=0;
    const db={select(){const value=responses[calls++];if(value===undefined)throw Error('Unexpected fallback query');const chain={};for(const method of ['from','where','innerJoin','limit'])chain[method]=()=>chain;chain.then=(resolve,reject)=>value instanceof Error?Promise.reject(value).then(resolve,reject):Promise.resolve(value).then(resolve,reject);return chain;}};
    const tables={userRole:{id:'id',userId:'userId',isActive:'isActive',roleId:'roleId'},user:{id:'id',defaultRole:'defaultRole'},role:{name:'name',id:'id',isActive:'isActive'},permission:{},rolePermission:{},committeeMembers:{},committees:{}};
    const permissions=load('src/lib/rbac/permissions.ts',{'@/lib/connect-db':{db},'@/db/schema':tables});
    const result=await permissions.getUserPermissionsWithFallback('local-user');
    assert.equal(result.roles.length,0);assert.equal(result.permissions.length,0);assert.equal(calls,expectedCalls);
  }
});

test('USER:UPDATE does not authorize a privileged defaultRole change',async()=>{
  const permissions={roles:[],permissions:[{resource:'USER',action:'UPDATE'}]};
  const route=load('src/app/api/admin/users/[userId]/route.ts',{
    '@/lib/rbac/middleware':middlewareFor(permissions),
    '@/lib/rbac/permissions':{hasPermission:async(_id,r,a)=>policy.allowsPermission(permissions,r,a)},
    '@/lib/connect-db':{db:noStorage},'@/db/schema':{},
  });
  const request=new NextRequest('http://localhost/api/admin/users/local-user',{method:'PUT',body:JSON.stringify({defaultRole:'SUPER_ADMIN'})});
  const response=await route.PUT(request,{params:Promise.resolve({userId:'local-user'})});
  assert.equal(response.status,403);
});

for(const file of ['images','folders','images/[imageId]','folders/[folderId]']){
  test(`private gallery ${file} requires read permission before querying storage`,async()=>{
    const route=load(`src/app/api/gallery/${file}/route.ts`,{
      '@/lib/rbac/middleware':{getRBACContext:async()=>({userId:'limited-user'})},
      '@/lib/rbac/permissions':{hasPermission:async()=>false},'@/lib/connect-db':{db:noStorage},'@/db/schema':{},'@/utils/cloudinary':{},
    });
    const response=await route.GET(new NextRequest('http://localhost/api/gallery/test'),{params:Promise.resolve({imageId:'test',folderId:'test'})});
    assert.equal(response.status,403);
  });
}
