const fs = require('fs');
const B = require('path').join(__dirname, '..') + '/';
const load = f => fs.readFileSync(B + 'assets/js/' + f, 'utf8');

// ============ 浏览器全局 mock ============
let __search = '';
const __base = 'https://cheche3811-bot.github.io/mbti/';
const replaced = [];
global.location = {
  get search() { return __search; },
  get href() { return __base + __search; },
  origin: 'https://cheche3811-bot.github.io',
  pathname: '/mbti/',
  protocol: 'https:'
};
global.history = { replaceState: (s, t, url) => { replaced.push(url); } };
global.window = {};

// ============ app/multi 依赖 mock ============
global.state = { result: null, idx: 0, answers: [] };
global.renderResult = () => {};
global.go = (id) => { global.__goneTo = id; };
global.mState = { mbtiType: null, mbtiIdentity: null, mbtiPercent: null, zodiacKey: null, birthDate: null, birthHour: '', result: null };
global.runMultiAnalysis = () => { global.__ranMulti = true; };

const src = load('data-bundle.js') + load('types.js') + load('astro.js') + load('share-url.js');
const api = new Function(src + `; return {
  baseUrl, buildResultQuery, writeResultUrl, parseShareParams, isSharedView,
  estimatedPercent, applySharedUrlOnLoad, resetSharedView
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

const PERCENT = {
  EI: { firstPct: 82, secondPct: 18 },
  SN: { firstPct: 35, secondPct: 65 },
  TF: { firstPct: 71, secondPct: 29 },
  JP: { firstPct: 58, secondPct: 42 },
  AT: { firstPct: 90, secondPct: 10 }
};

console.log('\n========== 1. buildResultQuery 编码 ==========');
const q1 = api.buildResultQuery({ type: 'INFJ', identity: 'A', percent: PERCENT }, 'taurus', '1990-05-15-14');
ok(q1 === 't=INFJ-A&p=82,35,71,58,90&z=taurus&b=1990-05-15-14',
  '完整三维 → ' + q1);

const q2 = api.buildResultQuery({ type: 'ENFP', identity: 'T', percent: null }, null, null);
ok(q2 === 't=ENFP-T', '仅 MBTI 无百分比 → ' + q2);

const q3 = api.buildResultQuery(null, 'leo', null);
ok(q3 === 'z=leo', '仅星座 → ' + q3);

console.log('\n========== 2. parseShareParams 解析（往返一致） ==========');
__search = '?' + q1;
const p1 = api.parseShareParams();
ok(p1.mbti.type === 'INFJ' && p1.mbti.identity === 'A', 't=INFJ-A 解析 type/identity');
ok(p1.mbti.percent && p1.mbti.percent.EI.firstPct === 82 && p1.mbti.percent.AT.firstPct === 90, 'p=82,35,71,58,90 精确百分比还原');
ok(p1.zodiac === 'taurus', 'z=taurus 解析');
ok(p1.bazi.date === '1990-05-15' && p1.bazi.hour === '14', 'b=1990-05-15-14 解析 date/hour');

__search = '?b=1990-05-15';
const p2 = api.parseShareParams();
ok(p2.bazi.date === '1990-05-15' && p2.bazi.hour === '', 'b=1990-05-15（无时辰）解析 hour 为空');

// 非法输入防御
__search = '?t=ZZZZ&z=nope&b=bad';
const p3 = api.parseShareParams();
ok(p3.mbti === null, '非法 t=ZZZZ → mbti 忽略');
ok(p3.zodiac === null, '非法 z=nope → zodiac 忽略');
ok(p3.bazi === null, '非法 b=bad → bazi 忽略');
__search = '';

console.log('\n========== 3. estimatedPercent 兜底 ==========');
const ep = api.estimatedPercent('INFJ', 'A');
ok(ep.EI.firstPct === 25 && ep.SN.firstPct === 25 && ep.TF.firstPct === 25, 'INFJ 前三轴 firstPct=25（I/N/F 反向）');
ok(ep.JP.firstPct === 75 && ep.AT.firstPct === 75, 'INFJ-A 的 JP/AT firstPct=75');

console.log('\n========== 4. 回流路由（MBTI-only → 单独结果页） ==========');
global.__goneTo = null;
global.state.result = null;
global.__ranMulti = false;
__search = '?t=INFJ-A&p=82,35,71,58,90';
api.applySharedUrlOnLoad();
ok(global.__goneTo === 'result', '跳转到 result 屏');
ok(global.state.result && global.state.result.full === 'INFJ-A', 'state.result.full 重建');
ok(global.state.result.percent.EI.firstPct === 82, '精确百分比带入（非 75% 估算）');
ok(global.window.__sharedView === true, '标记共享视图');
ok(global.__ranMulti === false, '未触发三维分析（MBTI-only 走单独页）');

console.log('\n========== 5. 回流路由（三维 → 综合页） ==========');
global.__goneTo = null;
global.__ranMulti = false;
Object.assign(global.mState, { mbtiType: null, mbtiIdentity: null, mbtiPercent: null, zodiacKey: null, birthDate: null, birthHour: '' });
__search = '?t=INFJ-A&z=taurus&b=1990-05-15-14';
api.applySharedUrlOnLoad();
ok(global.__ranMulti === true, '触发了三维分析');
ok(global.mState.mbtiType === 'INFJ' && global.mState.zodiacKey === 'taurus', 'mState 预填 MBTI + 星座');
ok(global.mState.birthDate === '1990-05-15' && global.mState.birthHour === '14', 'mState 预填生日 + 时辰');
ok(global.mState.mbtiPercent === null, '无 p 参数时 percent 为空（估算兜底）');

console.log('\n========== 6. 回流路由（仅生日 → 自动推导星座） ==========');
global.__ranMulti = false;
Object.assign(global.mState, { mbtiType: null, mbtiIdentity: null, mbtiPercent: null, zodiacKey: null, birthDate: null, birthHour: '' });
__search = '?b=1990-05-15';
api.applySharedUrlOnLoad();
ok(global.mState.zodiacKey === 'taurus', '1990-05-15 自动推导 taurus（实得 ' + global.mState.zodiacKey + '）');
ok(global.mState.mbtiType === null, '无 t 参数时 MBTI 为空');

console.log('\n========== 7. writeResultUrl / resetSharedView ==========');
__search = '';
const url = api.writeResultUrl({ type: 'INTJ', identity: 'T', percent: PERCENT }, null, null);
ok(url === __base + '?t=INTJ-T&p=82,35,71,58,90', 'writeResultUrl 返回带参链接');
ok(global.window.__currentShareUrl === url, '__currentShareUrl 已写入（供文案引擎用）');

api.resetSharedView();
ok(global.window.__sharedView === false, 'resetSharedView 清除共享标记');
ok(replaced.some(u => u === __base), 'resetSharedView 清空地址栏参数');

console.log('\n' + '='.repeat(46));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(46));
process.exit(fail === 0 ? 0 : 1);
