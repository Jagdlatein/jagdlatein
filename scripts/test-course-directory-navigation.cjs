const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const { execFileSync } = require('node:child_process');
const { createLoader, local, root } = require('./helpers/project-module.cjs');
const { setup, nodes, text } = require('./helpers/field-reader-fixture.cjs');
const load = createLoader(), props = load('pages/kurse/index.js').getStaticProps().props;
const selection = load('lib/course-directory-selection.js');
const categories = load('lib/learning-categories.js').learningCategoryDetails;
const tick = () => new Promise(resolve => setImmediate(resolve));
function parameters(url) { const parsed = new URL(url, 'https://jagdlatein.test'), query = {}; for (const key of new Set(parsed.searchParams.keys())) { const values = parsed.searchParams.getAll(key); query[key] = values.length > 1 ? values : values[0]; } return query; }
function address(query = {}) { const params = new URLSearchParams(); for (const [key, value] of Object.entries(query)) for (const item of Array.isArray(value) ? value : [value]) if (item !== undefined) params.append(key, item); return '/kurse' + (params.size ? '?' + params : ''); }
function fixture(t, query = {}, options = {}) {
  const h = setup('components/CourseDirectory.js', query, { ...options, props, router: { asPath: address(query), ...options.router } });
  h.requests = [];
  h.router.push = (href, as, options) => { const request = { href, as, options }; h.calls.push(request); h.requests.push(request); return new Promise((resolve, reject) => Object.assign(request, { resolve, reject })); };
  h.route = href => { h.router.query = parameters(href); h.router.asPath = href; h.render(); };
  h.pick = (id, value) => { const choice = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === id)[0]; assert.ok(choice, id); const button = nodes(choice.type(choice.props), node => node.type === 'button' && node.props['data-menu-choice'] === value)[0]; assert.ok(button, value); button.props.onClick(); h.render(); };
  h.cards = () => h.nodes(node => node.type === 'article');
  t.after(() => h.dispose()); return h;
}

test('Static course props preserve the complete prior projection, field set, order and all232 original route/title objects', () => {
  const source = execFileSync('git', ['show', 'a0b078b800c5eafd2a31fa5c6a95c0ee3718132c:pages/kurse/index.js'], { cwd: root, encoding: 'utf8' });
  const filename = path.join(root, 'pages/kurse/index.js'), { code } = local('next/dist/build/swc').transformSync(source, { filename, disableNextSsg: true, jsc: { parser: { syntax: 'ecmascript', jsx: true }, target: 'es2022', transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }), module = { exports: {} };
  new Function('require', 'module', 'exports', code)(id => id.endsWith('.module.css') ? {} : id.startsWith('.') ? load(path.resolve(path.dirname(filename), path.extname(id) ? id : id + '.js')) : local(id), module, module.exports);
  assert.deepEqual(props, module.exports.getStaticProps().props); assert.deepEqual(Object.keys(props).sort(), ['courses', 'detailedCount', 'miniCount']);
  assert.equal(props.courses.length, 232); assert.equal(props.miniCount, 34); assert.equal(props.detailedCount, 198);
  assert.ok(props.courses.every(course => Object.keys(course).sort().join(',') === 'category,description,format,href,id,title,totalQuestions'));
});

test('Parser distinguishes bare and format-only choice from explicit all, rejecting empty, unknown and repeated selection fields', () => {
  assert.deepEqual(selection.readCourseDirectorySelection({}), { valid: true, category: null, format: 'all' });
  assert.deepEqual(selection.readCourseDirectorySelection({ format: 'mini' }), { valid: true, category: null, format: 'mini' });
  assert.deepEqual(selection.readCourseDirectorySelection({ kategorie: 'all' }), { valid: true, category: 'all', format: 'all' });
  for (const category of categories) for (const format of ['all', 'mini', 'detailed']) assert.deepEqual(selection.readCourseDirectorySelection({ kategorie: category.slug, format }), { valid: true, category: category.slug, format });
  for (const query of [{ kategorie: '' }, { kategorie: 'unknown' }, { kategorie: ['wildkunde'] }, { kategorie: ['wildkunde', 'hundewesen'] }, { format: '' }, { format: ['all'] }, { format: 'unknown' }, new URLSearchParams('kategorie=wildkunde&kategorie=wildkunde'), new URLSearchParams('format=mini&format=detailed')]) assert.equal(selection.readCourseDirectorySelection(query).valid, false);
});

test('Readiness requires exact route and full raw/query/browser identity; target building preserves unrelated repeated context', () => {
  const router = { isReady: true, asPath: '/kurse?ref=a&ref=b&kategorie=wildkunde#old', query: { ref: ['a', 'b'], kategorie: 'wildkunde' } };
  assert.equal(selection.courseDirectoryRoute(router).ready, true);
  const target = selection.courseDirectoryTarget(router, 'hundewesen', 'mini'), url = new URL(target, 'https://jagdlatein.test');
  assert.deepEqual(url.searchParams.getAll('ref'), ['a', 'b']); assert.equal(url.searchParams.get('kategorie'), 'hundewesen'); assert.equal(url.searchParams.get('format'), 'mini'); assert.equal(url.hash, '#course-directory-top');
  const reset = new URL(selection.courseDirectoryTarget(router, null, null), 'https://jagdlatein.test'); assert.deepEqual(reset.searchParams.getAll('ref'), ['a', 'b']); assert.equal(reset.searchParams.has('kategorie'), false); assert.equal(reset.searchParams.has('format'), false);
  for (const change of [{ isReady: false }, { asPath: '/lernen/wildkunde' }, { asPath: '//other.invalid/kurse' }, { query: { ref: ['a', 'wrong'], kategorie: 'wildkunde' } }, { query: { ref: ['a', 'b'], kategorie: ['wildkunde'] } }]) assert.equal(selection.courseDirectoryRoute({ ...router, ...change }).ready, false);
  assert.equal(selection.courseDirectoryTarget(router, 'bad', 'all'), null); assert.equal(selection.courseDirectoryTarget(router, 'all', 'bad'), null);
  const previous = global.window;
  try {
    global.window = { location: { pathname: '/kurse', search: '?ref=a&ref=b&kategorie=wildkunde', hash: '#old' } };
    const initial = selection.courseDirectoryRoute(router); assert.equal(initial.ready, true);
    global.window.location.hash = '#changed'; assert.equal(selection.courseDirectoryRoute(router).ready, false); assert.notEqual(selection.courseDirectoryRoute(router).origin, initial.origin);
  } finally { if (previous === undefined) delete global.window; else global.window = previous; }
});

test('All category/format subsets are exact, ordered and immutable; bare, invalid and unready views never show default courses', t => {
  const before = JSON.stringify(props);
  for (const category of ['all', ...categories.map(item => item.slug)]) for (const format of ['all', 'mini', 'detailed']) {
    const h = fixture(t, { kategorie: category, format });
    assert.deepEqual(h.cards().map(card => card.key), props.courses.filter(course => (category === 'all' || course.category === category) && (format === 'all' || course.format === format)).map(course => course.id));
  }
  for (const query of [{}, { format: 'mini' }, { kategorie: '' }, { kategorie: 'unknown' }, { kategorie: ['wildkunde', 'hundewesen'] }, { kategorie: 'wildkunde', format: 'bad' }]) assert.equal(fixture(t, query).cards().length, 0);
  const unready = fixture(t, { kategorie: 'all' }, { ready: false }); assert.equal(unready.cards().length, 0); assert.ok(unready.nodes(node => node.type?.name === 'MenuChoice').every(choice => choice.props.disabled));
  unready.pick('course-directory-category', 'wildkunde'); assert.equal(unready.calls.length, 0);
  assert.equal(JSON.stringify(props), before);
});

test('One lower menu owns category/format/reset without duplicate grid, native selection window or extra search', t => {
  const h = fixture(t, { kategorie: 'all' });
  assert.equal(h.nodes(node => node.type?.name === 'PageMenu').length, 1); assert.equal(h.nodes(node => node.type?.name === 'LearningCategoryMenu').length, 0);
  assert.equal(h.nodes(node => ['input', 'select', 'form', 'dialog'].includes(node.type)).length, 0);
  const menu = h.nodes(node => node.type?.name === 'PageMenu')[0], choices = nodes(menu, node => node.type?.name === 'MenuChoice');
  assert.deepEqual(choices.map(choice => choice.props.id), ['course-directory-category', 'course-directory-format']);
  assert.deepEqual(nodes(choices[0].type(choices[0].props), node => node.type === 'button').map(button => button.props['data-menu-choice']), ['all', ...categories.map(category => category.slug)]);
  for (const card of h.cards()) assert.equal(nodes(card, node => node.props?.href)[0].props.prefetch, false);
});

test('Pending and accepted-before-commit choices retain the committed list; raw URL commit performs the switch and history restores it', async t => {
  const h = fixture(t, { kategorie: 'wildkunde', format: 'mini' }), before = h.cards().map(card => card.key);
  h.pick('course-directory-category', 'hundewesen'); assert.equal(h.calls.length, 1); assert.deepEqual(h.calls[0].options, { shallow: true, scroll: false }); assert.deepEqual(h.cards().map(card => card.key), before);
  h.requests[0].resolve(true); await tick(); h.render(); assert.deepEqual(h.cards().map(card => card.key), before);
  h.route(h.requests[0].href); assert.equal(h.cards().length, 0); assert.match(text(h.tree), /keine Kurse vorhanden/);
  h.route('/kurse?kategorie=wildkunde&format=mini'); assert.deepEqual(h.cards().map(card => card.key), before); assert.equal(h.calls.length, 1);
});

test('Refused, rejected and cancelled transitions preserve the committed pool and only current real failures show an alert', async t => {
  for (const result of ['false', 'reject', 'cancelled']) {
    const h = fixture(t, { kategorie: 'wildkunde' }), before = h.cards().map(card => card.key);
    h.pick('course-directory-category', 'hundewesen');
    if (result === 'false') h.requests[0].resolve(false); else h.requests[0].reject(Object.assign(new Error('Own isolated route failure'), result === 'cancelled' ? { cancelled: true } : {}));
    await tick(); h.render(); assert.deepEqual(h.cards().map(card => card.key), before);
    assert.equal(h.nodes(node => node.props?.role === 'alert').length, result === 'cancelled' ? 0 : 1);
    assert.equal(h.nodes(node => node.props?.id === 'course-directory-results')[0].props['aria-busy'], false);
  }
});

test('Current pending field intents combine, superseded failures cannot affect the later choice, and stale/unmounted handlers cannot navigate', async t => {
  const h = fixture(t, { kategorie: 'wildkunde' }), before = h.cards().map(card => card.key);
  const retained = h.nodes(node => node.type?.name === 'MenuChoice' && node.props.id === 'course-directory-category')[0].props.onChange;
  h.pick('course-directory-category', 'hundewesen'); h.pick('course-directory-format', 'mini');
  assert.deepEqual(parameters(h.requests[1].href), { kategorie: 'hundewesen', format: 'mini' }); assert.deepEqual(h.cards().map(card => card.key), before);
  h.requests[0].reject(new Error('Own obsolete failure')); await tick(); h.render(); assert.equal(h.nodes(node => node.props?.role === 'alert').length, 0);
  h.route(h.requests[1].href); h.requests[1].resolve(true); await tick(); h.render(); assert.equal(h.cards().length, 0);
  await retained({ target: { value: 'all' } }); assert.equal(h.calls.length, 2);
  const after = h.nodes(node => node.type?.name === 'MenuChoice')[0].props.onChange; h.dispose(); await after({ target: { value: 'all' } }); assert.equal(h.calls.length, 2);
});

test('Reset is a real clean selection-history step, including format-only all; it never resets course data or creates a search', async t => {
  const before = JSON.stringify(props);
  for (const query of [{ kategorie: 'wildkunde', format: 'mini', ref: 'own-fixture' }, { format: 'all', ref: 'own-fixture' }]) {
    const h = fixture(t, query); h.click('Auswahl zurücksetzen'); assert.equal(h.requests.length, 1);
    assert.deepEqual(parameters(h.requests[0].href), { ref: 'own-fixture' });
    h.route(h.requests[0].href); h.requests[0].resolve(true); await tick(); h.render(); assert.equal(h.cards().length, 0); assert.match(text(h.tree), /Wähle eine Kategorie/);
  }
  assert.equal(JSON.stringify(props), before);
  const source = fs.readFileSync(path.join(root, 'components/CourseDirectory.js'), 'utf8'); assert.doesNotMatch(source, /localStorage|sessionStorage|useCourseProgress|fetch\(|type="search"/);
});

test('An own exact pending commit returns to the top even when the final selection equals the old one; foreign context/hash changes do not', async () => {
  const React = local('react');
  function owner() {
    const slots = [], cleanups = [], focus = [], requests = []; let cursor = 0, effects = [], changed = false, tree;
    const router = { isReady: true, asPath: '/kurse?kategorie=wildkunde', query: { kategorie: 'wildkunde' }, push(href) { const request = { href }; requests.push(request); return new Promise((resolve, reject) => Object.assign(request, { resolve, reject })); } };
    const hooks = { ...React,
      useState(initial) { const i=cursor++; if(!slots[i])slots[i]={value:typeof initial==='function'?initial():initial}; return[slots[i].value,value=>{const next=typeof value==='function'?value(slots[i].value):value;changed ||= !Object.is(next,slots[i].value);slots[i].value=next;}]; },
      useRef(initial) { const i=cursor++;return slots[i] ||= {current:initial}; },
      useEffect(fn,deps) { const i=cursor++;if(!slots[i]||deps.some((value,index)=>!Object.is(value,slots[i].deps[index]))){slots[i]={deps};effects.push(()=>{cleanups[i]?.();cleanups[i]=fn();});} },
    };
    const fake = createLoader({ react:hooks,'next/router':{useRouter:()=>router},'../hooks/useSelectionPageStart':{__esModule:true,default:()=>({focusSelection:()=>focus.push(router.asPath),cancelSelectionFocus(){}})},'./PageMenu':{__esModule:true,default:()=>null,openPageMenu(){},closePageMenu(){}} });
    const Component=fake('components/CourseDirectory.js').default;
    function render(){for(let pass=0;pass<8;pass++){cursor=0;changed=false;tree=Component(props);const queued=effects;effects=[];queued.forEach(fn=>fn());if(!changed)return;}throw Error('Owner did not settle');}
    render();
    return {router,focus,requests,render,pick(value){nodes(tree,node=>node.type?.name==='MenuChoice'&&node.props.id==='course-directory-category')[0].props.onChange({target:{value}});render();},dispose(){cleanups.forEach(fn=>fn?.());}};
  }
  for (const alteration of ['exact', 'foreign-context', 'foreign-hash']) {
    const h=owner();
    try {
      assert.equal(h.focus.length,1);h.pick('hundewesen');h.pick('wildkunde');assert.equal(h.requests.length,2);assert.equal(h.focus.length,1);
      h.requests[1].resolve(true);await tick();h.render();assert.equal(h.focus.length,1,'Accepted promise without commit does not focus');
      const url=new URL(h.requests[1].href,'https://jagdlatein.test');if(alteration==='foreign-context')url.searchParams.set('ref','foreign');if(alteration==='foreign-hash')url.hash='foreign-anchor';
      h.router.asPath=url.pathname+url.search+url.hash;h.router.query=parameters(h.router.asPath);h.render();
      assert.equal(h.focus.length,alteration==='exact'?2:1,alteration);
      if(alteration==='exact')assert.equal(h.focus.at(-1),h.requests[1].href);
      h.requests[0].resolve(false);await tick();h.render();assert.equal(h.focus.length,alteration==='exact'?2:1);
    }finally{h.dispose();}
  }
  const previousWindow=global.window;
  try {
    for(const phase of ['browser-first','router-first'])for(const outcome of ['success','false','reject','cancelled']){
      global.window={location:{pathname:'/kurse',search:'?kategorie=wildkunde',hash:''}};
      const h=owner();
      try {
        h.pick('hundewesen');h.pick('wildkunde');const target=h.requests[1].href,url=new URL(target,'https://jagdlatein.test');
        const browser=()=>Object.assign(global.window.location,{pathname:url.pathname,search:url.search,hash:url.hash});
        const route=()=>{h.router.asPath=target;h.router.query=parameters(target);};
        if(phase==='browser-first')browser();else route();h.render();assert.equal(h.focus.length,1,phase+' unready gap');
        if(outcome==='success')h.requests[1].resolve(true);else if(outcome==='false')h.requests[1].resolve(false);else h.requests[1].reject(Object.assign(new Error('Own gap failure'),outcome==='cancelled'?{cancelled:true}:{}));
        await tick();h.render();assert.equal(h.focus.length,1,'No promise-only focus across an unready gap');
        browser();route();h.render();assert.equal(h.focus.length,outcome==='success'?2:1,phase+' '+outcome);
        h.requests[0].resolve(false);await tick();h.render();assert.equal(h.focus.length,outcome==='success'?2:1,'Old failure cannot revive or remove the latest marker');
      }finally{h.dispose();}
    }
  }finally{if(previousWindow===undefined)delete global.window;else global.window=previousWindow;}
});
