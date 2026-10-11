/** All writes happen in a disposable local database, never production. */
const assert=require('node:assert/strict'),postgres=require('postgres'),Module=require('node:module');
const name=`kaizen_tenant_test_${process.pid}`,admin=postgres('postgres://postgres:postgres@127.0.0.1:54322/postgres',{max:1,prepare:false,onnotice:()=>{}});let sql,actor={partnerId:'a',partnerSlug:'branch-a'},invalidations=[];const original=Module._load;
Module._load=function(name,...args){if(name==='react')return {...original.call(this,name,...args),cache:fn=>fn};if(name==='server-only')return {};if(name==='next/cache')return {revalidatePath:path=>invalidations.push(path)};if(name==='@/lib/partner-admin/auth')return {requirePartnerAdminUser:async()=>({user:actor,error:null})};return original.call(this,name,...args);};require('tsx/cjs');
const q=s=>'"'+s.replaceAll('"','""')+'"';
(async()=>{try{
 await admin.unsafe(`CREATE DATABASE ${q(name)}`);process.env.DATABASE_URL=`postgres://postgres:postgres@127.0.0.1:54322/${name}`;sql=postgres(process.env.DATABASE_URL,{max:1,prepare:false,onnotice:()=>{}});
 const schema=require('../src/db/schema.ts'),{getTableConfig}=require('drizzle-orm/pg-core');
 for(const key of ['partners','partnerPageSettings','user','profiles','courses','courseSchedules','courseInstructors']){
  const cfg=getTableConfig(schema[key]);const columns=cfg.columns.map(c=>{let type=c.getSQLType();if(c.columnType==='PgEnumColumn')type='text';let extra=c.name==='id'?' PRIMARY KEY DEFAULT gen_random_uuid()':'';if(c.name==='partner_id'&&key==='partnerPageSettings')extra+=' UNIQUE';if(type==='boolean')extra+=` DEFAULT ${c.default===true?'true':'false'}`;if(type.startsWith('timestamp'))extra+=' DEFAULT now()';return `${q(c.name)} ${type}${extra}`;});
  await sql.unsafe(`CREATE TABLE ${q(cfg.name)} (${columns.join(',')})`);
 }
 await sql`INSERT INTO partners(id,name,slug,is_active) VALUES ('a','Branch A','branch-a',true),('b','Branch B','branch-b',true),('off','Inactive','off',false)`;
 await sql`INSERT INTO courses(id,name,partner_id,is_active,monthly_fee,admission_fee,currency,duration,sessions_per_week,is_enrollment_open) VALUES ('a-course','A training','a',true,20000,0,'BDT',6,3,true),('b-course','SECRET B COURSE','b',true,90000,0,'BDT',12,2,true),('a-off','INACTIVE COURSE','a',false,30000,0,'BDT',12,2,true)`;
 await sql`INSERT INTO course_schedules(id,course_id,day_of_week,start_time,end_time,location,is_active) VALUES ('a-slot','a-course',0,'09:00','10:00','A Dojo',true),('b-slot','b-course',1,'14:00','15:00','SECRET B DOJO',true),('a-off-slot','a-course',2,'14:00','15:00','INACTIVE SLOT',false)`;
 await sql`INSERT INTO profiles(id,partner_id,is_active) VALUES ('member-a','a',true),('member-a-off','a',false),('member-b','b',true)`;
 const api=require('../src/app/api/partner-portal/page-settings/route.ts'),content=require('../src/lib/org/server.ts');
 let response=await api.GET();assert.equal(response.status,200);assert.equal((await sql`SELECT * FROM partner_page_settings`).length,0,'GET must be read-only');
 const request=body=>new Request('https://branch-a.p.hstuma.com/api/partner-portal/page-settings',{method:'PATCH',body:JSON.stringify(body)});
 const settings={heroTagline:'A tagline',showStats:false,showCourses:false,defaultScheduleDay:0,founderName:'Sensei A',founderBio:'A biography',features:[{title:'A feature',description:'A details',icon:''}],galleryImages:['/sensei.jpeg'],accentColor:'#813d9c'};
 response=await api.PATCH(request(settings));assert.equal(response.status,200);
 response=await api.PATCH(request({partnerId:'b',showStats:true}));assert.equal(response.status,400,'ownership cannot be forged');
 actor={partnerId:'b',partnerSlug:'branch-b'};response=await api.GET();assert.equal((await response.json()).settings.heroTagline,null,'B cannot see A settings');
 await api.PATCH(request({heroTagline:'B tagline'}));actor={partnerId:'a',partnerSlug:'branch-a'};
 const identity=await content.getOrgIdentity('branch-a');assert.equal(identity.settings.heroTagline,'A tagline');assert.equal(identity.settings.showStats,false);assert.equal(identity.settings.founderBio,'A biography');assert.equal(identity.settings.features[0].description,'A details');assert.equal(await content.getOrgIdentity('off'),null);
 const data=await content.getOrgContent('a','a');assert.equal(data.courses.length,1);assert.equal(data.courses[0].monthlyFee,20000);assert.equal(data.memberCount,1);assert.equal(data.schedules.length,1);assert.equal(data.schedules[0].dayOfWeek,0);assert.equal(data.schedules[0].location,'A Dojo');assert.ok(!JSON.stringify(data).includes('SECRET B'));
 const publicData=await content.getOrgContent('a','b');assert.equal(publicData.courses[0].monthlyFee,null,'other-branch viewers cannot see member pricing');assert.equal(publicData.courses[0].admissionFee,null);
 assert.deepEqual(invalidations,['/org/branch-a','/org/branch-b']);
 console.log('PASS: settings upsert, read-only GET, tenant ownership, hidden controls, inactive branches/courses/schedules, scoped public content and member-only pricing.');
 }finally{if(global.kaizenPostgresClient)await global.kaizenPostgresClient.end();if(sql)await sql.end();await admin.unsafe(`DROP DATABASE IF EXISTS ${q(name)} WITH (FORCE)`);await admin.end();Module._load=original;}})().catch(e=>{console.error(e);process.exitCode=1;});
