// Embedded PostgreSQL and explicit provider/notification doubles only.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module');
const root=path.resolve(__dirname,'../..'),local=createRequire(path.join(root,'package.json')),swc=local('next/dist/build/swc');
const {PGlite}=require(path.resolve(process.env.JL_PAYPAL_TEST_PGLITE_PATH||'missing-isolated-pglite'));
const NOW=Date.now(),DAY=86400000,ID='I-HISTORY1234',PAYMENT='SALE-HISTORY1234',PLAN='P-BBBBBBBBBBBBBBBBBBBBBBBB',EMAIL='history-buyer@example.invalid',GENERATION='11111111-1111-4111-8111-111111111111';
const iso=value=>new Date(value).toISOString();
const transaction=(override={})=>({id:PAYMENT,status:'COMPLETED',time:iso(NOW-DAY/2),amount_with_breakdown:{gross_amount:{value:'10.00',currency_code:'EUR'}},...override});
const trialPlan=()=>({id:PLAN,status:'ACTIVE',billing_cycles:[{tenure_type:'TRIAL',sequence:1,total_cycles:1,frequency:{interval_unit:'DAY',interval_count:3},pricing_scheme:{fixed_price:{value:'0.00',currency_code:'EUR'}}},{tenure_type:'REGULAR',sequence:2,total_cycles:0,frequency:{interval_unit:'MONTH',interval_count:1},pricing_scheme:{fixed_price:{value:'10.00',currency_code:'EUR'}}}]});
const ENV={NODE_ENV:'test',ACCOUNT_GENERATION_ENABLED:'true',SUPABASE_URL:'https://database.example.invalid',SUPABASE_SERVICE_ROLE_KEY:'isolated-key',JL_TEST_ENVIRONMENT:'paypal-sandbox',PAYPAL_API_BASE:'https://api-m.sandbox.paypal.com',PAYPAL_CLIENT_ID:'isolated-client',PAYPAL_SECRET:'isolated-secret',PAYPAL_WEBHOOK_ID:'isolated-webhook',NEXT_PUBLIC_PAYPAL_TRIAL_PLAN_ID:PLAN,PAYPAL_TRIAL_PLAN_IDS:PLAN,PAYPAL_PLAN_IDS:PLAN,PAYPAL_PLAN_PRICES:JSON.stringify({[PLAN]:'10.00'})};
async function createHistoryHarness(){
 const pg=new PGlite();await pg.exec('CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role BYPASSRLS;');
 await pg.exec(fs.readFileSync(path.join(root,'supabase/test-only/paypal-sandbox-bootstrap.sql'),'utf8'));
 await pg.exec('CREATE TABLE public.push_tokens(token text PRIMARY KEY,enabled boolean DEFAULT true,updated_at timestamptz DEFAULT now());');
 for(const file of ['20261003_course_progress.sql','20261003160000_activity_results.sql','20261004100000_ranked_quiz.sql','20261004110000_subscription_access.sql','20261004120000_secure_private_tables.sql','20261004130000_subscription_trial.sql','20261004190000_learning_community.sql','20261007105000_account_registration.sql','20261007110000_apple_subscriptions.sql','20261007120000_account_deletion.sql','20261009210000_paypal_account_generation.sql','20261009220000_complete_account_deletion.sql','20261014110000_operator_trial_notifications.sql'])await pg.exec(fs.readFileSync(path.join(root,'supabase/migrations',file),'utf8'));
 async function fixture(overrides={}){
  await pg.exec('TRUNCATE public.paypal_checkout_requests; TRUNCATE public.paypal_subscriptions CASCADE; TRUNCATE public.userprofile CASCADE;');
  await pg.query('INSERT INTO public.userprofile(user_id,email,is_premium,is_admin,account_generation,updated_at) VALUES(gen_random_uuid(),$1,false,false,$2,now())',[EMAIL,GENERATION]);
  await pg.query('INSERT INTO public.paypal_subscriptions(subscription_id,account_email,account_generation,plan_id,status,verified_at) VALUES($1,$2,$3,$4,\'APPROVAL_PENDING\',$5)',[ID,EMAIL,GENERATION,PLAN,iso(NOW-DAY)]);
  const state={status:'ACTIVE',start:iso(NOW-4*DAY),nextBilling:iso(NOW+2*DAY),transactions:[],rawHistory:null,pages:null,providerError:false,signature:'SUCCESS',saleState:'refunded',saleId:PAYMENT,snapshots:[],alerts:0,reads:[],...overrides};
  const database={from(table){const filters=[];return{select(){return this;},eq(key,value){filters.push([key,value]);return this;},async execute(single){
   if(table==='account_access_grants')return{data:null,error:{code:'42P01'}};
   assert.ok(['userprofile','paypal_subscriptions'].includes(table));assert.ok(filters.every(([key])=>['email','account_generation','subscription_id','account_email'].includes(key)));
   if(state.bindingError)return{data:null,error:{message:'isolated binding error'}};
   const values=filters.map(([,value])=>value),conditions=filters.map(([key],index)=>key+'=$'+(index+1)),rows=(await pg.query('SELECT * FROM public.'+table+(conditions.length?' WHERE '+conditions.join(' AND '):''),values)).rows;
   const normalized=JSON.parse(JSON.stringify(rows));return{data:single?normalized[0]||null:normalized,error:null};
  },maybeSingle(){return this.execute(true);},then(resolve,reject){return this.execute(false).then(resolve,reject);}};},async rpc(name,args){
   assert.equal(name,'apply_paypal_subscription_snapshot');state.snapshots.push(structuredClone(args.p_snapshot));if(state.beforeRpc)await state.beforeRpc(args.p_snapshot);
   if(state.rpcError)return{data:null,error:{message:'isolated RPC failure'}};
   try{return{data:(await pg.query('SELECT public.apply_paypal_subscription_snapshot($1::jsonb) AS data',[JSON.stringify(args.p_snapshot)])).rows[0].data,error:null};}catch(error){return{data:null,error};}
  }};
  const fetcher=async(target,options)=>{const url=new URL(target);assert.equal(url.origin,ENV.PAYPAL_API_BASE);state.reads.push(url.pathname+url.search);if(state.providerError)throw Error('isolated provider failure');
   if(url.pathname==='/v1/oauth2/token')return Response.json({access_token:'isolated-token'});
   if(url.pathname==='/v1/notifications/verify-webhook-signature')return Response.json({verification_status:state.signature});
   if(url.pathname==='/v1/billing/subscriptions/'+ID)return Response.json({id:ID,plan_id:PLAN,status:state.status,start_time:state.start,status_update_time:iso(NOW),billing_info:{next_billing_time:state.nextBilling}});
   if(url.pathname==='/v1/billing/plans/'+PLAN)return Response.json(trialPlan());
   if(url.pathname==='/v1/billing/subscriptions/'+ID+'/transactions'){
    if(state.historyProviderError)throw Error('isolated history transport failure');
    if(state.pages)return Response.json(state.pages.shift());if(state.historyFactory)return Response.json(state.historyFactory(url));if(state.rawHistory!==null)return Response.json(state.rawHistory);
    const start=Date.parse(url.searchParams.get('start_time')),end=Date.parse(url.searchParams.get('end_time')),rows=state.transactions.filter(row=>Date.parse(row.time)>=start&&Date.parse(row.time)<=end);return Response.json({transactions:rows,total_items:rows.length,total_pages:1});
   }
   if(url.pathname==='/v1/payments/sale/'+state.saleId)return Response.json({id:state.saleId,billing_agreement_id:ID,state:state.saleState});
   throw Error('Unexpected isolated provider path '+url.pathname);
  };
  const cache=new Map();function load(relative){const filename=path.resolve(root,relative);if(filename.endsWith('.json'))return JSON.parse(fs.readFileSync(filename,'utf8'));if(cache.has(filename))return cache.get(filename).exports;
   const {code}=swc.transformSync(fs.readFileSync(filename,'utf8'),{filename,disableNextSsg:true,jsc:{parser:{syntax:'ecmascript',jsx:true},target:'es2022'},module:{type:'commonjs'}}),module={exports:{}};cache.set(filename,module);
   new Function('require','module','exports','process','fetch',code)(id=>{if(id==='@supabase/supabase-js')return{createClient:()=>database};if(id==='./operator-trial-notifications')return{scheduleOperatorTrialNotification(){state.alerts++;}};if(id.startsWith('.'))return load(path.resolve(path.dirname(filename),path.extname(id)?id:id+'.js'));return local(id);},module,module.exports,{env:ENV},fetcher);return module.exports;
  }
  const helper=load('lib/subscription-access.js'),row=async()=>(await pg.query('SELECT to_jsonb(s) AS data FROM public.paypal_subscriptions s WHERE subscription_id=$1',[ID])).rows[0].data;
  return{state,database,helper,load,row,refresh:(paymentChange=null)=>helper.refreshVerifiedSubscription(ID,{database,nowMs:NOW,paymentChange}),payments:async()=>(await pg.query('SELECT to_jsonb(p) AS data FROM public.paypal_subscription_payments p ORDER BY payment_id')).rows.map(row=>row.data),
   webhook:(type,resource={id:ID})=>load('app/api/paypal/webhook/route.js').POST(new Request('https://jagdlatein.test/api/paypal/webhook',{method:'POST',headers:{'paypal-transmission-id':'isolated-transmission','paypal-transmission-time':iso(NOW),'paypal-cert-url':'https://api.sandbox.paypal.com/isolated-cert','paypal-transmission-sig':'isolated-signature','paypal-auth-algo':'SHA256withRSA'},body:JSON.stringify({id:'WH-ISOLATED',event_type:type,resource})})),
  };
 }
 return{fixture,pg,close:()=>pg.close()};
}
module.exports={createHistoryHarness,NOW,DAY,ID,PAYMENT,PLAN,EMAIL,GENERATION,iso,transaction};
