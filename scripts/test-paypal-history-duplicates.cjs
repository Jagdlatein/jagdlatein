const test=require('node:test'),assert=require('node:assert/strict');
const {createHistoryHarness,NOW,DAY,ID,PAYMENT,iso,transaction}=require('./helpers/paypal-history-fixture.cjs');
let harness;test.before(async()=>{harness=await createHistoryHarness();});test.after(async()=>{await harness?.close();});
const unavailable=promise=>assert.rejects(promise,error=>error.status===503);
const conflict=()=>[transaction({status:'REFUNDED'}),transaction()];
const terminal=(status='REFUNDED',id=PAYMENT)=>({payment_id:id,status});
const nullPayment=change=>({...change,paid_at:null,period_until:null,amount:null,currency:null});
function assertQuarantine(snapshot,change){assert.deepEqual(snapshot.payments,[nullPayment(change)]);assert.equal(snapshot.review_reason,'transaction_history_requires_review');assert.equal(Object.hasOwn(snapshot,'trial_started_at'),false);assert.equal(Object.hasOwn(snapshot,'trial_until'),false);}

test('Exact duplicates within a list, across pages and overlapping windows create one unchanged funded payment',async()=>{
 const payment=transaction();const variants=[{transactions:[payment,structuredClone(payment)]},{pages:[{transactions:[payment],total_items:2,total_pages:2,links:[{rel:'next',href:`https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${ID}/transactions?page=2`,method:'GET'}]},{transactions:[structuredClone(payment)],total_items:2,total_pages:2},{transactions:[],total_items:0,total_pages:1}]},{rawHistory:{transactions:[payment],total_pages:1,total_items:1}}];
 let expected;
 for(const variant of variants){const ctx=await harness.fixture(variant);await ctx.refresh();const rows=await ctx.payments();assert.equal(rows.length,1);assert.equal(rows[0].status,'COMPLETED');const fields=({paid_at,period_until,amount,currency})=>({paid_at,period_until,amount,currency});if(expected)assert.deepEqual(fields(rows[0]),expected);else expected=fields(rows[0]);assert.equal(ctx.helper.accessFromSubscriptions([await ctx.row()],NOW).paid,true);}
});

test('Used raw status/time/currency/amount disagreements fail before any ledger write in both orders',async()=>{
 const changes=[q=>{q.status='REFUNDED';},q=>{q.status='REVERSED';},q=>{q.status='PENDING';},q=>{q.status='FAILED';},q=>{q.status='PARTIALLY_REFUNDED';},q=>{q.time=iso(NOW-DAY);},q=>{q.amount_with_breakdown.gross_amount.value='5.00';},q=>{q.amount_with_breakdown.gross_amount.currency_code='USD';},q=>{q.amount_with_breakdown.gross_amount.value='10.0';},q=>{q.time=q.time.replace('Z','+00:00');}];
 for(const change of changes){const altered=transaction();change(altered);for(const rows of[[transaction(),altered],[altered,transaction()]]){const ctx=await harness.fixture({rawHistory:{transactions:rows}});await unavailable(ctx.refresh());assert.equal(ctx.state.snapshots.length,0);assert.equal((await ctx.payments()).length,0);assert.equal(ctx.helper.accessFromSubscriptions([await ctx.row()],NOW).paid,false);}}
});

test('Different payer, fees, metadata order and unknown fields do not change identical payment evidence',async()=>{
 const first=transaction({payer_email:'first@example.invalid'}),second={ignored:'extra',amount_with_breakdown:{fee_amount:{value:'1.00',currency_code:'EUR'},gross_amount:{currency_code:'EUR',value:'10.00'}},time:first.time,status:first.status,id:first.id,payer_email:'second@example.invalid'};
 for(const rows of[[first,second],[second,first]]){const ctx=await harness.fixture({transactions:rows});await ctx.refresh();assert.equal((await ctx.payments()).length,1);assert.equal((await ctx.payments())[0].amount,'10.00');assert.doesNotMatch(JSON.stringify(ctx.state.snapshots),/payer_email|first@example|second@example|ignored|fee_amount/);}
});

test('Malformed-first/valid-last and reverse ordering cannot hide invalid occurrence validation',async()=>{
 const changes=[q=>{q.time='not-a-time';},q=>{q.time=iso(NOW+1);},q=>{q.status='UNKNOWN';}];
 for(const change of changes){const bad=transaction();change(bad);for(const rows of[[bad,transaction()],[transaction(),bad]]){const ctx=await harness.fixture({rawHistory:{transactions:rows}});await unavailable(ctx.refresh());assert.equal(ctx.state.snapshots.length,0);}}
});

test('Signed known refunds/reversals quarantine contradictory or malformed histories with only the exact event payment',async()=>{
 for(const status of['REFUNDED','REVERSED'])for(const malformed of[null,'time','future','status','null'])for(const reversed of[false,true]){
  const ctx=await harness.fixture({transactions:[transaction()]});await ctx.refresh();const original=(await ctx.payments())[0];ctx.state.snapshots=[];ctx.state.alerts=0;
  const bad=malformed==='time'?transaction({time:'invalid'}):malformed==='future'?transaction({time:iso(NOW+1)}):malformed==='status'?transaction({status:'UNKNOWN'}):null;
  let rows=malformed?[bad,transaction()]:conflict();if(reversed)rows.reverse();ctx.state.rawHistory={transactions:rows};
  const response=await ctx.webhook(status==='REFUNDED'?'PAYMENT.SALE.REFUNDED':'PAYMENT.SALE.REVERSED',status==='REFUNDED'?{id:'REFUND-ISOLATED',sale_id:PAYMENT}:{id:PAYMENT});assert.equal(response.status,200);assert.equal((await response.json()).premium,false);
  assertQuarantine(ctx.state.snapshots[0],terminal(status));const result=(await ctx.payments())[0];for(const field of['paid_at','period_until','amount','currency'])assert.equal(result[field],original[field]);assert.equal(result.status,status);assert.equal(ctx.state.alerts,0);assert.equal((await ctx.row()).paid_until,null);
  ctx.state.rawHistory=null;ctx.state.transactions=[transaction()];await ctx.refresh();assert.equal((await ctx.payments())[0].status,status);assert.equal(ctx.helper.accessFromSubscriptions([await ctx.row()],NOW).paid,false);
 }
});

test('Conflict on another payment ID never adopts it or widens the signed event to that ID; old other funding keeps only its hard expiry',async()=>{
 const other=transaction({id:'SALE-OTHER1234',time:iso(NOW-DAY)}),ctx=await harness.fixture({transactions:[transaction(),other]});await ctx.refresh();const before=await ctx.payments(),oldOther=before.find(row=>row.payment_id===other.id);ctx.state.snapshots=[];ctx.state.alerts=0;
 ctx.state.rawHistory={transactions:[transaction({id:'SALE-NEWFUNDED',time:iso(NOW-1000)}),{...other,status:'REFUNDED'},other]};await ctx.refresh(terminal());assertQuarantine(ctx.state.snapshots[0],terminal());const rows=await ctx.payments();assert.equal(rows.length,2);assert.equal(rows.find(row=>row.payment_id===PAYMENT).status,'REFUNDED');assert.deepEqual(rows.find(row=>row.payment_id===other.id),oldOther);assert.equal((await ctx.row()).paid_until,oldOther.period_until);assert.equal(ctx.helper.accessFromSubscriptions([await ctx.row()],Date.parse(oldOther.period_until)).paid,false);assert.equal(ctx.state.alerts,0);
});

test('A new trial cannot be created from rejected history or a terminal event for an unknown payment ID',async()=>{
 const change=terminal('REFUNDED','SALE-UNKNOWN123'),ctx=await harness.fixture({start:iso(NOW-DAY),saleId:change.payment_id,rawHistory:{transactions:conflict()}});const response=await ctx.webhook('PAYMENT.SALE.REFUNDED',{sale_id:change.payment_id});assert.equal(response.status,200);assert.equal((await response.json()).premium,false);const row=await ctx.row();assertQuarantine(ctx.state.snapshots[0],change);assert.equal(row.trial_started_at,null);assert.equal(row.trial_until,null);assert.equal(row.paid_until,null);assert.equal(ctx.helper.accessFromSubscriptions([row],NOW).paid,false);assert.deepEqual((await ctx.payments()).map(({payment_id,status,paid_at,period_until,amount,currency})=>({payment_id,status,paid_at,period_until,amount,currency})),[nullPayment(change)]);assert.equal(ctx.state.alerts,0);
});

test('Pinned trials with ordinary or schedule-change blocks keep their exact window and remain blocked',async()=>{
 for(const reason of['payment_amount_requires_review','trial_schedule_changed']){
  const ctx=await harness.fixture({start:iso(NOW-DAY)});await ctx.refresh();const before=await ctx.row();await harness.pg.query('UPDATE public.paypal_subscriptions SET review_reason=$1 WHERE subscription_id=$2',[reason,ID]);ctx.state.rawHistory={transactions:conflict()};ctx.state.snapshots=[];ctx.state.alerts=0;const result=await ctx.refresh(terminal());assertQuarantine(ctx.state.snapshots[0],terminal());assert.equal(result.trial_started_at,before.trial_started_at);assert.equal(result.trial_until,before.trial_until);assert.ok(result.review_reason);assert.equal(ctx.helper.accessFromSubscriptions([result],NOW).paid,false);assert.equal(ctx.state.alerts,0);
 }
});

test('An unknown terminal event creates only a null-metadata tombstone that a later completed replay cannot fund',async()=>{
 const unknown='SALE-UNKNOWN999',ctx=await harness.fixture({saleId:unknown,rawHistory:{transactions:conflict()}});const response=await ctx.webhook('PAYMENT.SALE.REVERSED',{id:unknown});assert.equal(response.status,200);assert.equal((await response.json()).premium,false);assertQuarantine(ctx.state.snapshots[0],terminal('REVERSED',unknown));
 ctx.state.rawHistory=null;ctx.state.transactions=[transaction({id:unknown})];await ctx.refresh();const payments=await ctx.payments();assert.equal(payments.length,1);assert.equal(payments[0].status,'REVERSED');for(const field of['paid_at','period_until','amount','currency'])assert.equal(payments[0][field],null);assert.equal(ctx.helper.accessFromSubscriptions([await ctx.row()],NOW).paid,false);
});

test('PARTIALLY_REFUNDED, unsupported terminal values and invalid exact IDs never enter quarantine',async()=>{
 for(const change of[terminal('PARTIALLY_REFUNDED'),terminal('COMPLETED'),terminal('REFUNDED','bad'),terminal('refunded'),{payment_id:[PAYMENT],status:'REFUNDED'}]){const ctx=await harness.fixture({rawHistory:{transactions:conflict()}});await unavailable(ctx.refresh(change));assert.equal(ctx.state.snapshots.length,0);assert.equal((await ctx.payments()).length,0);}
 const partial=await harness.fixture({saleState:'partially_refunded',rawHistory:{transactions:conflict()}});assert.equal((await partial.webhook('PAYMENT.SALE.REFUNDED',{sale_id:PAYMENT})).status,503);assert.equal(partial.state.snapshots.length,0);
});

test('Generic provider/auth/binding/list/pagination/RPC failures do not get a terminal-event bypass',async()=>{
 for(const variant of[{providerError:true},{historyProviderError:true},{bindingError:true},{rawHistory:{transactions:null}},{rawHistory:{transactions:[],links:[{rel:'next',href:'https://attacker.example.invalid/transactions'}]}}]){const ctx=await harness.fixture(variant);assert.equal((await ctx.webhook('PAYMENT.SALE.REFUNDED',{sale_id:PAYMENT})).status,503);assert.equal(ctx.state.snapshots.length,0);}
 const unsigned=await harness.fixture({signature:'FAILURE',rawHistory:{transactions:conflict()}});assert.equal((await unsigned.webhook('PAYMENT.SALE.REFUNDED',{sale_id:PAYMENT})).status,401);assert.equal(unsigned.state.snapshots.length,0);
 const rpc=await harness.fixture({rpcError:true,rawHistory:{transactions:conflict()}});await unavailable(rpc.refresh(terminal()));assert.equal(rpc.state.snapshots.length,1);assert.equal((await rpc.payments()).length,0);assert.equal(rpc.state.alerts,0);
});

test('Deletion between positive binding and quarantine RPC cannot recreate a contract or grant access',async()=>{
 const ctx=await harness.fixture({rawHistory:{transactions:conflict()},beforeRpc:async()=>{await harness.pg.exec('DELETE FROM public.paypal_subscriptions; DELETE FROM public.userprofile;');}});
 assert.equal(await ctx.refresh(terminal()),null);assert.equal((await harness.pg.query('SELECT count(*)::int AS count FROM public.paypal_subscriptions')).rows[0].count,0);assert.equal((await ctx.payments()).length,0);assert.equal(ctx.state.alerts,0);
});
