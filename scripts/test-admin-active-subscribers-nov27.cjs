// Read-only SDK fetch doubles; no credentials, provider, account or live DB.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const{root,local}=require('./helpers/project-module.cjs'),swc=local('next/dist/build/swc'),{createClient}=local('@supabase/supabase-js');
const NOW=Date.now(),DAY=86400000,iso=t=>new Date(t).toISOString(),EMAIL='active-fixture@example.invalid',GEN='11111111-1111-4111-8111-111111111111',TOKEN='22222222-2222-4222-8222-222222222222',PLAN='P-REGULAR123',TRIAL='P-TRIAL12345';
const pay=(extra={})=>({subscription_id:'I-ACTIVE1234',account_email:EMAIL,account_generation:GEN,account_deleted_at:null,plan_id:PLAN,status:'ACTIVE',paid_until:iso(NOW+DAY),trial_started_at:null,trial_until:null,review_reason:null,verified_at:iso(NOW),created_at:iso(NOW-DAY),...extra});
const payment=(extra={})=>({payment_id:'PAYMENT-ACTIVE',status:'COMPLETED',paid_at:iso(NOW-DAY),period_until:iso(NOW+20*DAY),amount:'10.00',currency:'EUR',...extra});
const apple=(extra={})=>({environment:'Production',original_transaction_id:'12345',latest_transaction_id:'12346',app_account_token:TOKEN,status:1,auto_renew:true,access_until:iso(NOW+DAY),is_trial:false,grace_until:null,verified_at:iso(NOW),created_at:iso(NOW-DAY),owner:{account_email:EMAIL,account_generation:GEN,deleted_at:null},trial:[],...extra});
const transaction=(extra={})=>({environment:'Production',transaction_id:'12346',original_transaction_id:'12345',app_account_token:TOKEN,purchased_at:iso(NOW-DAY),expires_at:iso(NOW+20*DAY),is_trial:false,revoked_at:null,is_upgraded:false,...extra});
function fixture({paypal=[],apples=[],payments=[payment()],latest=[transaction()],regular=transaction(),secondProfiles=false}={}){
 const calls=[];let profiles=0;
 const database=createClient('https://database.example.invalid','synthetic-fixture-key',{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},global:{fetch:async(input,options)=>{const url=new URL(input);calls.push({url,method:options.method});assert.equal(options.method,'GET');let data;const table=url.pathname.split('/').at(-1),select=url.searchParams.get('select');
  if(table==='paypal_subscriptions')data=select.includes('regular:')?paypal.map(r=>({subscription_id:r.subscription_id,regular:payments})):paypal;
  else if(table==='apple_subscriptions')data=select.includes('regular:')?apples.map(r=>({environment:r.environment,original_transaction_id:r.original_transaction_id,regular:regular?[regular]:[]})):apples;
  else if(table==='apple_subscription_transactions')data=latest;
  else if(table==='userprofile')data=secondProfiles&&++profiles>1?[]:[{email:EMAIL,account_generation:GEN}];
  else throw Error('Unexpected read '+table);return Response.json(data);}}});
 const filename=path.join(root,'lib/admin-trial-overview.js'),mod={exports:{}},{code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,jsc:{parser:{syntax:'ecmascript'},target:'es2022'},module:{type:'commonjs'}});
 new Function('require','module','exports',code)(id=>{if(id==='./course-progress-server')return{};if(id==='./account-session')return{normalizeAccountEmail:v=>typeof v==='string'?v.trim().toLowerCase():''};if(id==='./apple-review-login')return{ReviewLoginError:class extends Error{},requireReviewSessionIdentity:async()=>{}};if(id==='./test-environment')return{isPayPalSandboxTestEnvironment:()=>false};if(id==='./operator-trial-notifications')return{getOperatorTrialNotificationStatus:async()=>({configured:false})};throw Error('Unexpected dependency '+id);},mod,mod.exports);
 const options=mod.exports.readTrialOverviewOptions('https://fixture.invalid/admin?environment=live',{PAYPAL_PLAN_IDS:PLAN+','+TRIAL,PAYPAL_TRIAL_PLAN_IDS:TRIAL});return{calls,options,read:()=>mod.exports.getAdminTrialOverview(database,options,{nowMs:NOW})};
}
test('Direct paid PayPal without trial is shown only with a matching supported plan and positive payment covering paid_until',async()=>{
 const f=fixture({paypal:[pay()]});const result=await f.read();assert.equal(result.items.length,1);assert.equal(result.items[0].stage,'regular');assert.equal(result.items[0].trialStartedAt,null);assert.equal(result.items[0].trialUntil,null);assert.equal(result.items[0].accessUntil,pay().paid_until);const query=f.calls.find(c=>c.url.pathname.endsWith('/paypal_subscriptions'));assert.equal(query.url.searchParams.has('trial_started_at'),false);assert.equal(query.url.searchParams.get('account_deleted_at'),'is.null');assert.equal(result.windowLimit,200);
 for(const extra of[{plan_id:'P-UNKNOWN123'},{review_reason:'needs_review'},{verified_at:iso(NOW+DAY)},{trial_started_at:iso(NOW-DAY)},{trial_until:iso(NOW+DAY)},{trial_started_at:'invalid',trial_until:'invalid'}])assert.equal((await fixture({paypal:[pay(extra)]}).read()).items.length,0);
 for(const bad of[{status:'REFUNDED'},{paid_at:iso(NOW+1)},{period_until:iso(NOW+DAY-1)},{amount:'0'},{amount:'NaN'},{currency:'bad'}])assert.equal((await fixture({paypal:[pay()],payments:[payment(bad)]}).read()).items.length,0);
});
test('Historical valid trial follow-up and active trial retain original dates, while renewal-off paid coverage stays visible',async()=>{
 const history={plan_id:TRIAL,trial_started_at:iso(NOW-10*DAY),trial_until:iso(NOW-7*DAY)};const r=(await fixture({paypal:[pay({...history,status:'CANCELLED'})]}).read()).items[0];assert.equal(r.stage,'regular');assert.equal(r.renewal,false);assert.equal(r.trialStartedAt,history.trial_started_at);
 const active={plan_id:TRIAL,paid_until:null,trial_started_at:iso(NOW-DAY),trial_until:iso(NOW+DAY)};const t=(await fixture({paypal:[pay(active)],payments:[]}).read()).items[0];assert.equal(t.stage,'trial');assert.equal(t.accessUntil,active.trial_until);
});
test('Actual Supabase SDK builds optional filtered Trial embed but keeps owner INNER and all environment/order/window limits',async()=>{
 const f=fixture({apples:[apple()]});const result=await f.read();assert.equal(result.items.length,1);assert.equal(result.items[0].stage,'regular');const q=f.calls.find(c=>c.url.pathname.endsWith('/apple_subscriptions')).url.searchParams,select=q.get('select');assert.match(select,/owner:apple_account_tokens!inner/);assert.match(select,/trial:apple_subscription_transactions\(/);assert.doesNotMatch(select,/trial:apple_subscription_transactions!inner/);assert.equal(q.get('trial.is_trial'),'eq.true');assert.equal(q.get('trial.limit'),'1');assert.equal(q.get('limit'),'101');assert.equal(q.get('environment'),'eq.Production');assert.equal(q.get('owner.deleted_at'),'is.null');assert.equal(q.get('trial.order'),'purchased_at.asc');assert.equal(q.get('order'),'created_at.desc,original_transaction_id.desc');
});
test('Apple [] or null means absent history; present broken or contradictory Trial stays excluded',async()=>{
 for(const trial of[[],null])assert.equal((await fixture({apples:[apple({trial})]}).read()).items[0].stage,'regular');
 for(const trial of[undefined,[{}],[transaction({is_trial:true,purchased_at:'bad'})],[transaction({is_trial:true,original_transaction_id:'999'})],[transaction({is_trial:false})],[transaction({is_trial:true}),transaction({is_trial:true})]])assert.equal((await fixture({apples:[apple({trial})]}).read()).items.length,0);
});
test('Apple regular/grace require exact current latest evidence and absent history cannot manufacture a Trial',async()=>{
 const g=apple({status:4,auto_renew:false,grace_until:iso(NOW+2*DAY)}),row=(await fixture({apples:[g]}).read()).items[0];assert.equal(row.stage,'grace');assert.equal(row.renewal,false);
 for(const bad of[{revoked_at:iso(NOW-1)},{is_upgraded:true},{is_trial:true},{app_account_token:'33333333-3333-4333-8333-333333333333'},{environment:'Sandbox'},{expires_at:iso(NOW-1000)},{purchased_at:iso(NOW+1)}]){ const read=fixture({apples:[apple()],latest:[transaction(bad)]}).read(); if(bad.environment)await assert.rejects(read,e=>e.status===503);else assert.equal((await read).items.length,0); }
 assert.equal((await fixture({apples:[apple({is_trial:true})],latest:[transaction({is_trial:true})],regular:null}).read()).items.length,0);
 assert.equal((await fixture({apples:[apple()],regular:null}).read()).items.length,0);
});
test('Second owner-generation read still revokes a direct paid record; no write method or RPC is used',async()=>{
 const f=fixture({paypal:[pay()],secondProfiles:true});assert.equal((await f.read()).items.length,0);assert.ok(f.calls.every(c=>c.method==='GET'));
});
