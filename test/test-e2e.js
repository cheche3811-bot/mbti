/* 端到端集成测试：模拟 DOM 环境跑完整流程 */
const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

/* ---------- 极简 DOM 模拟 ---------- */
class El {
  constructor(tag='div', id='') {
    this.tagName = tag.toUpperCase(); this.id = id;
    this.children = []; this._html = ''; this._text = '';
    this.style = {}; this.dataset = {}; this.classList = new Set();
    this.hidden = false; this.disabled = false; this.value = '';
    this._listeners = {};
    this.classList = {
      _s: new Set(),
      add: (...c) => c.forEach(x => this.classList._s.add(x)),
      remove: (...c) => c.forEach(x => this.classList._s.delete(x)),
      toggle: (c, f) => { f === undefined ? (this.classList._s.has(c) ? this.classList._s.delete(c) : this.classList._s.add(c)) : (f ? this.classList._s.add(c) : this.classList._s.delete(c)); },
      contains: c => this.classList._s.has(c)
    };
  }
  set innerHTML(v) { this._html = String(v); }
  get innerHTML() { return this._html; }
  set textContent(v) { this._text = String(v); }
  get textContent() { return this._text; }
  set className(v) { this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); }
  get className() { return [...this.classList._s].join(' '); }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(ev, fn) { (this._listeners[ev] = this._listeners[ev] || []).push(fn); }
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k]; }
  click() { (this._listeners.click || []).forEach(f => f({ target: this })); if (this.onclick) this.onclick({ target: this }); }
  querySelectorAll(sel) { return collectFromHtml(this._html, sel); }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  scrollTo() {}
}

/* 从 innerHTML 字符串中按 class 提取伪元素（用于验证渲染产物） */
function collectFromHtml(html, sel) {
  const cls = sel.replace(/^\./, '').split(/[\s.]/)[0];
  const re = new RegExp('class="[^"]*\\b' + cls + '\\b[^"]*"', 'g');
  const found = html.match(re) || [];
  return found.map(() => {
    const e = new El();
    e.dataset = {};
    return e;
  });
}

const registry = {};
function mk(id, tag='div') { const e = new El(tag, id); registry[id] = e; return e; }

// 预建 HTML 里声明的所有 id
const HTML_IDS = fs.readFileSync(B + 'index.html', 'utf8')
  .match(/id="([a-z-]+)"/g).map(s => s.replace(/id="|"/g, ''));
HTML_IDS.forEach(id => mk(id));

global.document = {
  querySelector: sel => {
    if (sel.startsWith('#')) return registry[sel.slice(1)] || null;
    return new El();
  },
  querySelectorAll: sel => {
    if (sel.startsWith('#')) { const e = registry[sel.slice(1)]; return e ? [e] : []; }
    // .screen 等：返回所有已注册元素中匹配的
    return Object.values(registry).filter(e => e.classList.contains(sel.replace(/^\./, '')));
  },
  createElement: tag => new El(tag),
  addEventListener: () => {},
  body: new El('body')
};
global.window = { scrollTo: () => {} };
global.requestAnimationFrame = fn => fn();
global.setTimeout = (fn) => { fn(); return 0; };
global.setInterval = () => 0;
global.clearInterval = () => {};
global.navigator = { clipboard: { writeText: () => Promise.resolve() } };
let __LS = {};
global.localStorage = {
  getItem: k => __LS[k] || null,
  setItem: (k,v) => { __LS[k] = v; },
  removeItem: k => { delete __LS[k]; }
};
// Canvas / SVG→Image 相关（分享图功能用，node 下仅需存在不报错）
global.Blob = class { constructor(a){ this.parts=a; } };
global.URL.createObjectURL = () => 'blob:mock';
global.URL.revokeObjectURL = () => {};
// 注意：只挂方法，不要整体替换 global.URL。
// URL 必须保持为可 instanceof 的构造函数，否则 fs.readFileSync 内部的
// `filePath instanceof URL` 判断会抛 TypeError（沙箱 fs shim 会用到）。
global.Image = class { set src(v){ this._s=v; setTimeout(()=>this.onload&&this.onload(),0); } };

/* screen- 元素需带 screen class */
['screen-home','screen-quiz','screen-form','screen-loading','screen-result','screen-multi']
  .forEach(id => { if (registry[id]) registry[id].classList.add('screen'); });

/* ---------- 加载全部脚本 ---------- */
const load = f => fs.readFileSync(B + 'assets/js/' + f, 'utf8');
// 顺序须与 index.html 一致
// 顺序须与 index.html 严格一致
const src = load('data-bundle.js') + load('avatars.js') + load('animals.js')
          + load('questions.js') + load('types.js') + load('astro.js')
          + load('synthesis.js') + load('share-engine.js')
          + load('share.js') + load('share-summary.js') + load('share-card-v2.js')
          + load('app.js') + load('multi.js');

let api;
console.log('\n========== 1. 全脚本加载与初始化 ==========');
try {
  api = new Function(src + `; return {
    mState, synthesize, calcBazi, getZodiacSign, calculate, QUESTIONS,
    renderMultiResult, runMultiAnalysis, updateFormStatus, buildMbtiPicker, buildProfile,
    mbtiAvatar, zodiacAvatar, stemAvatar, archetypeAvatar, avatarSVG, dimAvatar,
    animalAvatar, buildShareSection, renderCopyCards, generateCopyCandidates,
    calcBadges, buildVars, pickTheme, shareCopyStats, SHARE_COPY_DATA,
    AVATAR_MBTI, AVATAR_ZODIAC, AVATAR_STEM, AVATAR_ARCHETYPE,
    buildZodiacPicker, renderDimBody, TYPES, ZODIAC_DATA, SOURCES_DATA, state
  };`)();
  ok(true, '13 个脚本按 index.html 顺序加载无异常');
} catch (e) {
  ok(false, '加载失败: ' + e.message);
  console.log(e.stack.split('\n').slice(0,4).join('\n'));
  process.exit(1);
}

console.log('\n========== 2. 表单控件构建 ==========');
const mpGrid = registry['mp-grid'];
ok(mpGrid._html.includes('mp-item'), 'MBTI 16 型网格已注入');
const mpCount = (mpGrid._html.match(/data-code="/g) || []).length;
ok(mpCount === 16, 'MBTI 选项数量 = 16，实得 ' + mpCount);

const zoGrid = registry['zo-grid'];
const zoCount = (zoGrid._html.match(/data-key="/g) || []).length;
ok(zoCount === 12, '星座选项数量 = 12，实得 ' + zoCount);

const hourSel = registry['in-birth-hour'];
ok(hourSel.children.length === 12, '时辰下拉注入 12 项，实得 ' + hourSel.children.length);

console.log('\n========== 3. 表单状态机 ==========');
const S = api.mState;
S.mbtiType = null; S.zodiacKey = null; S.birthDate = null;
api.updateFormStatus();
ok(registry['btn-analyze'].disabled === true, '空表单时按钮禁用');
ok(registry['form-status']._text.includes('还没有'), '空表单提示正确');

S.mbtiType = 'INTJ';
api.updateFormStatus();
ok(registry['btn-analyze'].disabled === false, '填 1 项后按钮启用');
ok(registry['form-status']._html.includes('单维度'), '单维度给出补充建议');

S.zodiacKey = 'taurus';
api.updateFormStatus();
ok(registry['form-status']._html.includes('两两对比'), '双维度提示两两对比');

S.birthDate = '1990-05-15';
api.updateFormStatus();
ok(registry['form-status']._html.includes('三维交叉'), '三维度提示完整交叉');

console.log('\n========== 4. 结果渲染 · 三维全填 ==========');
S.mbtiType = 'INTJ'; S.mbtiIdentity = 'A';
S.zodiacKey = 'taurus'; S.birthDate = '1990-05-15'; S.birthHour = '14';
const z = api.getZodiacSign(5, 15);
const bz = api.calcBazi(1990, 5, 15, 14);
S.result = {
  syn: api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:z, bazi:bz }),
  input: { mbti:{type:'INTJ',identity:'A'}, zodiac:z, bazi:bz }
};
try {
  api.renderMultiResult();
  const h = registry['multi-wrap']._html;
  ok(h.length > 3000, '结果 HTML 已生成（' + h.length + ' 字符）');
  ok(h.includes('my-hero'), '综合画像卡已渲染');
  ok(h.includes('ms-num'), '一致性环形图已渲染');
  ok((h.match(/class="dc /g)||[]).length + (h.match(/dc dc-/g)||[]).length >= 3, '三个维度卡均已渲染');
  ok(h.includes('ax-row'), '五维特质对比已渲染');
  ok((h.match(/ax-row/g)||[]).length === 5, '恰好 5 条特质轴，实得 ' + (h.match(/ax-row/g)||[]).length);
  ok(h.includes('pair-card'), '两两对比卡已渲染');
  ok((h.match(/pair-card/g)||[]).length === 3, '三维产生 3 张对比卡');
  ok(h.includes('big-disclaimer'), '免责声明已渲染');
  ok(h.includes('src-details'), '文献引用区已渲染');
  ok(h.includes('ev-tradition'), '传统文化徽章已渲染');
  ok(h.includes('ev-contested'), '实证争议徽章已渲染');
  ok(h.includes('bzp-gz'), '八字四柱已渲染');
  ok(h.includes('wx-row'), '五行分布已渲染');
  ok((h.match(/wx-row/g)||[]).length === 5, '五行 5 行齐全');
  // ---- 性格总结区块 ----
  ok(h.includes('class="ps"'), '性格总结区块已渲染');
  // 原型名已前置到首屏 hero（my-title），不再埋在 summary 的 ps-arc-name
  ok(h.includes('my-title'), '人格原型名称已在首屏渲染');
  ok(h.includes('ps-one'), '一句话概括已渲染');
  ok(h.includes('pb-good'), '优势区块已渲染');
  ok(h.includes('pb-adv'), '建议区块已渲染');
  ok(h.includes('ps-insight'), '可信度洞察已渲染');
  ok(h.includes('ev-heuristic'), '总结标注启发式依据徽章');
  ok(h.indexOf('class="ps"') < h.indexOf('dc-grid'), '总结排在维度卡之前（核心内容优先）');
} catch (e) {
  ok(false, '渲染抛异常: ' + e.message);
  console.log(e.stack.split('\n').slice(0,5).join('\n'));
}

console.log('\n========== 5. 结果渲染 · 各种降级组合 ==========');
const combos = [
  { n:'仅 MBTI', mbti:{type:'ENFP',identity:'T'}, zodiac:null, bazi:null },
  { n:'仅星座', mbti:null, zodiac:api.getZodiacSign(1,5), bazi:null },
  { n:'仅八字(无时辰)', mbti:null, zodiac:null, bazi:api.calcBazi(2000,7,7,null) },
  { n:'MBTI+星座', mbti:{type:'ISTJ',identity:'A'}, zodiac:api.getZodiacSign(9,1), bazi:null },
  { n:'MBTI+八字', mbti:{type:'ESFP',identity:'T'}, zodiac:null, bazi:api.calcBazi(1985,12,25,3) },
  { n:'星座+八字', mbti:null, zodiac:api.getZodiacSign(3,21), bazi:api.calcBazi(1995,3,21,null) }
];
combos.forEach(c => {
  const syn = api.synthesize({ mbti:c.mbti, zodiac:c.zodiac, bazi:c.bazi });
  S.result = { syn, input:{ mbti:c.mbti, zodiac:c.zodiac, bazi:c.bazi } };
  try {
    api.renderMultiResult();
    const h = registry['multi-wrap']._html;
    const single = syn.count === 1;
    const hasRing = h.includes('ms-num');
    const hasSummary = h.includes('class="ps"') && h.includes('my-title');
    const pf = api.buildProfile(syn);
    ok(h.length > 1500 && (single ? !hasRing : hasRing) && hasSummary,
       c.n + ' → ' + pf.archetype.name + '（' + syn.count + '维'
       + (single ? '，无一致性环' : '，一致性 ' + syn.overall + '%') + '，含总结）');
  } catch (e) {
    ok(false, c.n + ' 渲染失败: ' + e.message);
  }
});

console.log('\n========== 6. 边界日期与特殊输入 ==========');
const edges = [
  ['1900-01-01', 0], ['2026-12-31', 23], ['2000-02-29', 12],
  ['1990-02-03', null], ['1990-02-05', 23], ['2024-12-22', 0]
];
let edgeFail = 0;
edges.forEach(([d, h]) => {
  const [y,m,dd] = d.split('-').map(Number);
  try {
    const b = api.calcBazi(y, m, dd, h);
    const zz = api.getZodiacSign(m, dd);
    const sy = api.synthesize({ mbti:null, zodiac:zz, bazi:b });
    S.result = { syn:sy, input:{mbti:null,zodiac:zz,bazi:b} };
    api.renderMultiResult();
    if (!b.pillars.day.cn || !zz) edgeFail++;
  } catch(e) { edgeFail++; console.log('    ✗ ' + d + ': ' + e.message); }
});
ok(edgeFail === 0, '6 组边界日期（含闰年2/29、立春前后、跨年星座）全部正常');

console.log('\n========== 7. MBTI 原流程未被破坏 ==========');
const ans = api.QUESTIONS.map(q => q.dir > 0 ? 2 : -2);
const r = api.calculate(ans);
ok(r.type === 'ESTJ' && r.identity === 'A', '原 MBTI 计分逻辑不变，实得 ' + r.full);
ok(api.state && Array.isArray(api.state.answers), 'app.js 的 state 仍可用');
ok(api.state.answers.length === 48, '答题状态数组长度 48');

console.log('\n========== 8. SVG 卡通头像 ==========');
const allT = Object.keys(api.TYPES);
let avBad = 0;
allT.forEach(t => {
  const svg = api.mbtiAvatar(t, 100, true);
  if (!svg.startsWith('<svg') || !svg.includes('viewBox="0 0 100 100"')) avBad++;
  if (svg.length < 400) avBad++;   // 过短说明零件没渲染
});
ok(avBad === 0, '16 型 MBTI 头像全部生成合法 SVG');

let zAvBad = 0;
Object.keys(api.AVATAR_ZODIAC).forEach(k => {
  const svg = api.zodiacAvatar(k, 100);
  if (!svg.startsWith('<svg') || svg.length < 400) zAvBad++;
});
ok(zAvBad === 0, '12 星座头像全部合法');

let sAvBad = 0;
Object.keys(api.AVATAR_STEM).forEach(k => {
  const svg = api.stemAvatar(k, 100);
  if (!svg.startsWith('<svg') || svg.length < 400) sAvBad++;
});
ok(sAvBad === 0, '10 天干头像全部合法');

let aAvBad = 0;
Object.keys(api.AVATAR_ARCHETYPE).forEach(k => {
  const svg = api.archetypeAvatar(k, 100);
  if (!svg.startsWith('<svg') || svg.length < 400) aAvBad++;
});
// 断言反映新现实：AVATAR_ARCHETYPE 从 17（16 常规 + 均衡型）扩到 29（+ 12 反差型）。
// 这里用动态计数而非写死 29，以后再加原型也不需改断言——不是放水，
// 是让「全部 key 都能生成合法 SVG」这一真实约束始终成立。
ok(aAvBad === 0, Object.keys(api.AVATAR_ARCHETYPE).length + ' 原型头像全部合法');

// 未知 key 必须回退不报错
ok(api.archetypeAvatar('不存在的原型', 80).startsWith('<svg'), '未知原型回退到均衡型不报错');

// INFP 绿老头特征验证
const infp = api.mbtiAvatar('INFP', 100);
const infpCfg = api.AVATAR_MBTI.INFP;
ok(infpCfg.bg.toUpperCase().startsWith('#B8E6') , 'INFP 底色为绿系 ' + infpCfg.bg);
ok(infpCfg.acc[0] === 'beard', 'INFP 带白胡子配饰（老者感）');
ok(infp.includes('stroke-width'), 'INFP 头像含厚描边');

// 头像尺寸参数生效
ok(api.mbtiAvatar('INTJ', 250).includes('width="250"'), '尺寸参数正确传递');

// 无描边圈版本（页面内联用）
ok(!api.mbtiAvatar('INTJ',100,false).includes('stroke-width="3.5"'), 'ring=false 时不画外框描边');

console.log('\n========== 9. 分享图与头像接入 ==========');
S.result = {
  syn: api.synthesize({ mbti:{type:'INFP',identity:'T'}, zodiac:api.getZodiacSign(5,15), bazi:api.calcBazi(1990,5,15,14) }),
  input: { mbti:{type:'INFP',identity:'T'}, zodiac:api.getZodiacSign(5,15), bazi:api.calcBazi(1990,5,15,14) }
};
api.renderMultiResult();
const rh = registry['multi-wrap']._html;
ok((rh.match(/<svg/g)||[]).length >= 4, '结果页内联至少 4 个 SVG 头像，实得 ' + (rh.match(/<svg/g)||[]).length);
ok(rh.includes('btn-sum-img'), '生成分享图按钮已渲染');
// 分享文案改为「只出共鸣式一条」，不再多套让用户挑 —— 断言反映新现实
ok(rh.includes('btn-copy-main'), '单条文案卡带「复制文案」主按钮');
ok(rh.includes('sum-modal'), '分享图弹窗已渲染');
ok(rh.includes('share-sec'), '分享区块已渲染');
ok(!rh.includes('undefined'), '结果页无 undefined 残留');

// 表单里的头像
ok((registry['mp-grid']._html.match(/<svg/g)||[]).length === 16, 'MBTI 选择网格 16 个头像');
ok((registry['zo-grid']._html.match(/<svg/g)||[]).length === 12, '星座选择网格 12 个头像');

// ---- 分享区 V2 ----
ok(rh.includes('ach-wrap') || rh.includes('copy-block'), '分享区 V2 已渲染');
ok(rh.includes('copy-list'), '文案容器已渲染');
ok(rh.includes('cs-card'), '单条共鸣式文案卡已渲染');
ok(rh.includes('btn-copy-refresh'), '「换一句」按钮已渲染');
ok(rh.includes('btn-sum-retheme'), '「换配色」按钮已渲染');
ok(rh.includes('ach-ic'), '成就徽章已渲染');
// 单条共鸣式文案内容不应有残留占位符
const csTexts = rh.match(/class="cs-text">([^<]*)</g) || [];
ok(csTexts.length === 1 && !csTexts.some(t => /\{\w+\}/.test(t)), '共鸣式文案无未替换占位符');

// ---- 转化优化验证（P0/P1 修复）----
// 分享区必须在免责声明之前 —— 趁情绪高点，别被冷水浇灭
ok(rh.indexOf('share-sec') < rh.indexOf('big-disclaimer'),
   '分享区排在免责声明之前（情绪高点分享）');
ok(rh.indexOf('share-sec') < rh.indexOf('dc-grid'),
   '分享区排在维度详情卡之前（第 3 位）');
// 免责声明必须折叠但内容完整
ok(rh.includes('bd-details') && rh.includes('bd-summary'),
   '免责声明改为可折叠（不阻断情绪）');
ok(rh.includes('Pittenger') && rh.includes('Carlson') && rh.includes('巴纳姆'),
   '折叠后学术诚实内容一条未删');

console.log('\n========== 10. 文献引用完整性 ==========');
const allSrc = Object.keys(api.SOURCES_DATA.sources);
ok(allSrc.length === 21, '文献总数 21 条，实得 ' + allSrc.length);
const levels = {};
allSrc.forEach(id => { const l = api.SOURCES_DATA.sources[id].level; levels[l] = (levels[l]||0)+1; });
console.log('  等级分布: ' + Object.entries(levels).map(([k,v])=>k+':'+v).join('  '));
const validLevels = Object.keys(api.SOURCES_DATA._meta.evidenceLevels);
const badLevel = allSrc.filter(id => !validLevels.includes(api.SOURCES_DATA.sources[id].level));
ok(badLevel.length === 0, '所有文献 level 值合法' + (badLevel.length?': '+badLevel.join(','):''));
const noTitle = allSrc.filter(id => !api.SOURCES_DATA.sources[id].title);
ok(noTitle.length === 0, '所有文献均有标题');
const noNote = allSrc.filter(id => !api.SOURCES_DATA.sources[id].note);
ok(noNote.length === 0, '所有文献均有说明备注');

console.log('\n' + '='.repeat(48));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(48));
process.exit(fail ? 1 : 0);
