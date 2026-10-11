/** Disposable local PostgreSQL only; never connects to the configured production database. */
const assert=require('node:assert/strict'),fs=require('node:fs'),postgres=require('postgres'),Module=require('node:module');
const database=`kaizen_team_test_${process.pid}`,quote=s=>'"'+s.replaceAll('"','""')+'"';
const admin=postgres('postgres://postgres:postgres@127.0.0.1:54322/postgres',{prepare:false,max:1,connect_timeout:5,onnotice:()=>{}});
let client,refreshes=0;
const original=Module._load;
Module._load=function(name,...args){
 if(name==='server-only')return{};
 if(name==='next/cache')return{revalidateTag:()=>refreshes++,revalidatePath:()=>refreshes++,unstable_cache:fn=>fn};
 if(name==='@/lib/rbac/middleware')return{getRBACContext:async()=>({userId:'editor'})};
 if(name==='@/lib/rbac/permissions')return{hasPermission:async()=>true};
 return original.call(this,name,...args);
};
require('tsx/cjs');
(async()=>{
 try{
  await admin.unsafe(`CREATE DATABASE ${quote(database)}`);
  process.env.DATABASE_URL=`postgres://postgres:postgres@127.0.0.1:54322/${database}`;
  client=postgres(process.env.DATABASE_URL,{prepare:false,max:1,onnotice:()=>{}});
  await client.unsafe(`CREATE TYPE resource_type AS ENUM ('ADMIN_PANEL','MEDIA'); CREATE TABLE "user"(id text PRIMARY KEY); INSERT INTO "user" VALUES ('editor');
   CREATE TABLE roles(id text PRIMARY KEY DEFAULT gen_random_uuid(),name text UNIQUE);
   CREATE TABLE permissions(id text PRIMARY KEY DEFAULT gen_random_uuid(),name text UNIQUE,description text,resource resource_type,action text,UNIQUE(resource,action));
   CREATE TABLE role_permissions(id text PRIMARY KEY DEFAULT gen_random_uuid(),role_id text REFERENCES roles(id),permission_id text REFERENCES permissions(id),UNIQUE(role_id,permission_id));
   INSERT INTO roles(name) VALUES ('ADMIN'),('SUPER_ADMIN'),('CONTENT_ADMIN');`);
  for(let pass=0;pass<2;pass++)for(const statement of fs.readFileSync('drizzle/0027_academy_team.sql','utf8').split('--> statement-breakpoint'))if(statement.trim())await client.unsafe(statement);
  for(let pass=0;pass<2;pass++)for(const statement of fs.readFileSync('drizzle/0029_academy_bkf_credentials.sql','utf8').split('--> statement-breakpoint'))if(statement.trim())await client.unsafe(statement);
  const grants=await client`SELECT r.name,count(*)::int AS count FROM roles r JOIN role_permissions rp ON rp.role_id=r.id GROUP BY r.name ORDER BY r.name`;
  assert.deepEqual(grants.map(r=>[r.name,r.count]),[['ADMIN',5],['SUPER_ADMIN',5]]);
  const api=require('../src/app/api/admin/instructors/route.ts');
  const published=require('../src/lib/academy-team/server.ts');
  const form={kind:'sensei',translations:{en:{name:'Test Sensei',title:'Sensei',rank:'3rd Dan',summary:'Teaching profile',biography:'Verified biography'},bn:{name:'সেনসেই'}},photoUrl:'',profileUrl:'https://example.test/profile',bkfRegistrationNo:'BKF018642',blackBeltNo:'D03135',displayOrder:0,isPublished:false};
  const req=(method,body)=>new Request('https://academy.test/api/admin/instructors',{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  let response=await api.POST(req('POST',form));assert.equal(response.status,201);let first=(await response.json()).person;
  assert.equal((await published.getPublishedAcademyPeople()).length,0,'drafts never appear publicly');
  response=await api.PATCH(req('PATCH',{...form,id:first.id,isPublished:true}));assert.equal(response.status,200);
  assert.equal((await published.getPublishedAcademyPeople()).length,1);
  assert.equal((await published.getPublishedAcademyPeople())[0].bkfRegistrationNo,'BKF018642');
  assert.equal((await published.getPublishedAcademyPeople())[0].blackBeltNo,'D03135');
  response=await api.POST(req('POST',{...form,isPublished:true}));assert.equal(response.status,409,'database prevents two featured senseis');
  response=await api.POST(req('POST',{...form,kind:'instructor',translations:{en:{...form.translations.en,name:'Assistant Instructor'}},displayOrder:2,isPublished:true}));assert.equal(response.status,201);const second=(await response.json()).person;
  const publicPeople=await published.getPublishedAcademyPeople();assert.equal(publicPeople.length,2);assert.ok(publicPeople.every(p=>!('createdBy' in p)&&!('updatedBy' in p)));
  response=await api.GET();assert.equal((await response.json()).people.length,2);
  response=await api.DELETE(new Request(`https://academy.test/api/admin/instructors?id=${second.id}`,{method:'DELETE'}));assert.equal(response.status,200);assert.equal((await published.getPublishedAcademyPeople()).length,1);
  assert.ok(refreshes>=8,'successful writes invalidate homepage content');
  console.log('PASS: idempotent migration, scoped role grants, draft/public filtering, CRUD, single-sensei constraint and homepage invalidation.');
 }finally{
  if(global.kaizenPostgresClient)await global.kaizenPostgresClient.end();if(client)await client.end();
  await admin.unsafe(`DROP DATABASE IF EXISTS ${quote(database)} WITH (FORCE)`);await admin.end();Module._load=original;
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
