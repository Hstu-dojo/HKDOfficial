const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
function load(file,mocks={}){
 const module={exports:{}};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText,{module,exports:module.exports,require:n=>Object.hasOwn(mocks,n)?mocks[n]:require(n),console:{error(){}},Date,URL,process},{filename:file});
 return module.exports;
}
const model=load('src/lib/academy-team/model.ts');
const copy={name:'Test Sensei',title:'Sensei',rank:'3rd Dan',summary:'Short profile',biography:'Verified biography'};
const person={kind:'sensei',translations:{en:copy,bn:{name:'সেনসেই',rank:''}},photoUrl:'',profileUrl:'https://www.facebook.com/example',displayOrder:0,isPublished:true};
test('localized profiles use translated fields and fall back individually to English',()=>{
 const localized=model.localizedPerson(person.translations,'bn');
 assert.equal(localized.name,'সেনসেই');assert.equal(localized.rank,'3rd Dan');assert.equal(localized.biography,'Verified biography');
 assert.equal(model.localizedPerson(person.translations,'ne').name,'Test Sensei');
});
test('publication requires biography for sensei and a short profile for other members',()=>{
 assert.ok(model.personSchema.safeParse(person).success);
 const missing={...person,translations:{en:{...copy,biography:''}}};
 assert.equal(model.personSchema.safeParse(missing).success,false);
 assert.equal(model.personSchema.safeParse({...missing,isPublished:false}).success,true);
 assert.equal(model.personSchema.safeParse({...person,kind:'black_belt',translations:{en:{...copy,summary:''}}}).success,false);
});
test('validation rejects script/HTTP image URLs, invalid order and unsupported profile types',()=>{
 for(const patch of [{photoUrl:'javascript:alert(1)'},{photoUrl:'//evil.example/photo.jpg'},{profileUrl:'javascript:alert(1)'},{photoUrl:'http://insecure.example/photo.jpg'},{displayOrder:-1},{displayOrder:0.5},{kind:'super_admin'}])assert.equal(model.personSchema.safeParse({...person,...patch}).success,false);
 assert.equal(model.personSchema.safeParse({...person,photoUrl:'/image/portrait.jpg'}).success,true);
});
const routePolicy=load('src/lib/rbac/admin-route-access.ts');
test('team page requires instructor read and admin-panel access, never role name alone',()=>{
 const admin={roles:[{name:'ADMIN'}],permissions:[{resource:'ADMIN_PANEL',action:'ACCESS'}]};
 assert.equal(routePolicy.canAccessAdminRoute(admin,'/en/admin/instructors'),false);
 assert.equal(routePolicy.canAccessAdminRoute({...admin,permissions:[...admin.permissions,{resource:'INSTRUCTOR',action:'READ'}]},'/bn/admin/instructors'),true);
 assert.equal(routePolicy.canAccessAdminRoute({...admin,permissions:[{resource:'INSTRUCTOR',action:'MANAGE'}]},'/admin/instructors'),false);
});
for(const action of ['GET','POST','PATCH','DELETE'])test(`${action} rejects media-only users before parsing or storage`,async()=>{
 const blocked=new Proxy({}, {get(){throw new Error('Storage touched before authorization');}});
 const route=load('src/app/api/admin/instructors/route.ts',{
  '@/lib/rbac/middleware':{getRBACContext:async()=>({userId:'media'})},
  '@/lib/rbac/permissions':{hasPermission:async(_,resource)=>resource==='ADMIN_PANEL'},
  '@/lib/connect-db':{db:blocked},'@/db/schema':{},'@/lib/academy-team/model':model,'next/cache':{},
 });
 const response=await route[action](new Request('https://academy.test/api/admin/instructors',{method:action}));
 assert.equal(response.status,403);
});
test('read permission cannot create, edit or delete profiles',async()=>{
 const route=load('src/app/api/admin/instructors/route.ts',{
  '@/lib/rbac/middleware':{getRBACContext:async()=>({userId:'viewer'})},
  '@/lib/rbac/permissions':{hasPermission:async(_,resource,action)=>resource==='ADMIN_PANEL'||action==='READ'},
  '@/lib/connect-db':{db:{}},'@/db/schema':{},'@/lib/academy-team/model':model,'next/cache':{},
 });
 for(const action of ['POST','PATCH','DELETE'])assert.equal((await route[action](new Request('https://academy.test/api/admin/instructors',{method:action}))).status,403);
});
test('anonymous users cannot read team administration',async()=>{
 const route=load('src/app/api/admin/instructors/route.ts',{'@/lib/rbac/middleware':{getRBACContext:async()=>null},'@/lib/rbac/permissions':{},'@/lib/connect-db':{db:{}},'@/db/schema':{},'@/lib/academy-team/model':model,'next/cache':{}});
 assert.equal((await route.GET()).status,401);
});
test('homepage feature renders rank, biography and cards as escaped text with translated headings',()=>{
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const section=load('src/components/sections/section-academy-team.tsx',{
  'framer-motion':{motion:{article:'article'},useReducedMotion:()=>true},
  'next/image':{__esModule:true,default:props=>React.createElement('img',{src:props.src,alt:props.alt})},
  '@/locales/client':{useCurrentLocale:()=> 'bn',useScopedI18n:()=>key=>key},
  './section-header':{SectionHeader:()=>React.createElement('h2',{},'Team')},
  '@/lib/academy-team/model':model,
 }).default;
 const html=renderToStaticMarkup(React.createElement(section,{people:[{...person,id:'sensei',translations:{en:{...copy,biography:'<script>bad()</script>'},bn:{name:'সেনসেই'}}},{...person,id:'instructor',kind:'instructor'}]}));
 assert.ok(html.includes('সেনসেই'));assert.ok(html.includes('3rd Dan'));assert.ok(html.includes('Short profile'));
 assert.ok(!html.includes('<script>bad()'));assert.ok(html.includes('&lt;script&gt;'));
 assert.equal(renderToStaticMarkup(React.createElement(section,{people:[]})),'');
});
