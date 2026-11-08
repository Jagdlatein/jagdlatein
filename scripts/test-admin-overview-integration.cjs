// Actual admin page with synthetic identity results. No live credentials,
// customer records, notifications or billing providers are used.
const test = require('node:test');
const assert = require('node:assert/strict');
const {createLoader, local} = require('./helpers/project-module.cjs');
const React = local('react');
const {renderToStaticMarkup} = local('react-dom/server');

function page({result={props:{}}, sandbox=false, broken=false}={}) {
  const calls=[];
  const load=createLoader({
    'next/head':({children})=>React.createElement(React.Fragment,null,children),
    'next/link':({href,children,...props})=>React.createElement('a',{href,...props},children),
    '../components/Seo':()=>null,
    '../components/AdminOverview':({testEnvironment})=>React.createElement('section',{'data-admin-overview':testEnvironment?'sandbox':'live'},'Geschützte Auswertung'),
    '../lib/account-access':{async getPaidPageProps(context,options){calls.push({context,options});return result;}},
    '../lib/test-environment':{isPayPalSandboxTestEnvironment(){calls.push('environment');if(broken)throw new Error('Synthetic invalid configuration');return sandbox;}}
  });
  return {...load('pages/admin.js'),calls};
}

test('The admin page retains its existing admin-only server guard and passes through denials before environment work',async()=>{
  const denial={redirect:{destination:'/preise?next=%2Fadmin',permanent:false}};
  const f=page({result:denial}),context={req:{synthetic:true}};
  assert.equal(await f.getServerSideProps(context),denial);
  assert.deepEqual(f.calls,[{context,options:{adminOnly:true}}]);
});

test('Authorized server props only add the deployment environment; broken configuration fails closed',async()=>{
  const f=page({result:{props:{retained:'existing'}},sandbox:true});
  assert.deepEqual(await f.getServerSideProps({}),{props:{retained:'existing',testEnvironment:true}});
  const broken=page({broken:true});
  assert.deepEqual(await broken.getServerSideProps({}),{redirect:{destination:'/konto?access=unavailable',permanent:false}});
});

test('The single admin page includes the dashboard, management destinations and existing closed question editor without private SSR aggregates',()=>{
  const f=page(),html=renderToStaticMarkup(React.createElement(f.default,{testEnvironment:false}));
  assert.match(html,/<meta name="robots" content="noindex, nofollow"/);
  assert.match(html,/data-admin-overview="live"/);
  assert.match(html,/<details[^>]+id="admin-fragen"/);
  assert.doesNotMatch(html,/<details[^>]+\bopen(?:=|\s|>)/);
  for(const href of ['/admin/testabos','/admin/import','/admin/glossar','/admin/push','/online-kurse?ansicht=verwaltung','/konto']) assert.ok(html.includes(`href="${href}"`),href);
  for(const text of ['Fragen-Editor','ID (einzigartig)','Fragetext','Export nach questions.js']) assert.ok(html.includes(text),text);
  assert.doesNotMatch(html,/@example|account_generation|subscription_id|transaction_id/);
});
