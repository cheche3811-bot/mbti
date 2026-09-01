const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const load = f => fs.readFileSync(B + 'assets/js/' + f, 'utf8');
const src = load('data-bundle.js') + load('types.js') + load('questions.js')
          + load('astro.js') + load('synthesis.js');
const api = new Function(src + `; return {
  synthesize, buildProfile, matchArchetype, axisBand, getZodiacSign, calcBazi,
  PROFILE_DATA, TYPES, AXIS_KEYS, mbtiTypeToVector
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

console.log('\n========== 1. 档位判定 ==========');
ok(api.axisBand(80) === 'high', '80 → high');
ok(api.axisBand(62) === 'high', '62 → high（边界）');
ok(api.axisBand(61) === 'mid', '61 → mid');
ok(api.axisBand(50) === 'mid', '50 → mid');
ok(api.axisBand(38) === 'low', '38 → low（边界）');
ok(api.axisBand(39) === 'mid', '39 → mid');
ok(api.axisBand(10) === 'low', '10 → low');

console.log('\n========== 2. 原型匹配覆盖度 ==========');
// 遍历大量向量组合，看原型匹配率与分布
const hit = {};
let fallbackCount = 0, total = 0;
const vals = [20, 35, 50, 65, 80];
for (const e of vals) for (const o of vals) for (const c of vals) for (const a of vals) for (const s of vals) {
  const v = { extraversion:e, openness:o, conscientiousness:c, agreeableness:a, stability:s };
  const arc = api.matchArchetype(v);
  total++;
  if (!arc.matched) fallbackCount++;
  hit[arc.name] = (hit[arc.name] || 0) + 1;
}
console.log('  遍历 ' + total + ' 种向量组合');
ok(total === 3125, '组合数 5^5 = 3125');
const matchRate = Math.round((total - fallbackCount) / total * 100);
console.log('  原型命中率 ' + matchRate + '%（回退均衡型 ' + fallbackCount + ' 次）');
ok(matchRate > 75, '命中率 > 75%，实得 ' + matchRate + '%');

const usedArchetypes = Object.keys(hit).filter(n => n !== '均衡型');
ok(usedArchetypes.length >= 12, '至少 12 种原型被实际用到，实得 ' + usedArchetypes.length);
console.log('\n  原型分布（前 8）:');
Object.entries(hit).sort((a,b)=>b[1]-a[1]).slice(0,8).forEach(([n,c]) => {
  console.log('    ' + n.padEnd(6) + ' ' + String(c).padStart(4) + ' 次  ' + '█'.repeat(Math.ceil(c/60)));
});

// 检查是否有原型永远匹配不到（数据配置错误）
const defined = api.PROFILE_DATA.archetypes.map(a => a.name);
const never = defined.filter(n => !hit[n]);
ok(never.length === 0, '所有 16 个原型都能被匹配到' + (never.length ? '，未命中: ' + never.join(',') : ''));

console.log('\n========== 3. 总结内容完整性 ==========');
const z = api.getZodiacSign(5, 15);
const bz = api.calcBazi(1990, 5, 15, 14);
const syn = api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:z, bazi:bz });
const p = api.buildProfile(syn);

ok(!!p.archetype && !!p.archetype.name, '有人格原型: ' + p.archetype.name);
ok(p.oneLiner.length > 8, '有一句话概括');
ok(p.narrative.length > 60, '整体叙述充分（' + p.narrative.length + '字）');
ok(p.axisDetails.length === 5, '五轴详情齐全');
ok(p.workStyle.length >= 1, '有做事风格');
ok(p.socialStyle.length >= 1, '有人际风格');
ok(p.strengths.length >= 2, '有优势条目 ' + p.strengths.length + ' 条');
ok(p.advices.length >= 1, '有建议条目 ' + p.advices.length + ' 条');
ok(p.insight.length > 10, '有一致性洞察');

console.log('\n  ── INTJ-A + 金牛座 + 庚金日主 的总结 ──');
console.log('  【原型】' + p.archetype.face + ' ' + p.archetype.name + ' — ' + p.archetype.title);
console.log('  【概括】' + p.oneLiner);
console.log('  【叙述】' + p.narrative);
console.log('  【做事】' + p.workStyle.join('；'));
console.log('  【人际】' + p.socialStyle.join('；'));
console.log('  【优势】');
p.strengths.forEach(s => console.log('    · ' + s.axis.cn + '：' + s.text));
console.log('  【建议】');
p.advices.forEach(a => console.log('    · ' + a.axis.cn + '：' + a.text));
console.log('  【洞察】' + p.insight);
if (p.tensions.length) { console.log('  【张力】'); p.tensions.forEach(t => console.log('    · ' + t.text)); }

console.log('\n========== 4. 极端与全中间向量 ==========');
// 全高
const synHi = api.synthesize({ mbti:{type:'ENFJ',identity:'A'}, zodiac:api.getZodiacSign(7,25), bazi:null });
const pHi = api.buildProfile(synHi);
ok(pHi.strengths.length > 0 && pHi.advices.length > 0, '偏高向量有优势与建议');
console.log('  ENFJ+狮子 → ' + pHi.archetype.name + ' | ' + pHi.oneLiner);

// 构造全中间档向量（所有轴都在 39-61）
const synMid = api.synthesize({ mbti:null, zodiac:null, bazi:api.calcBazi(1990,3,3,null) });
// 手动改成全中间来测边界
const fakeSyn = JSON.parse(JSON.stringify(synMid));
api.AXIS_KEYS.forEach(k => { fakeSyn.avgVector[k] = 50; });
fakeSyn.conflicts = [];
const pMid = api.buildProfile(fakeSyn);
ok(pMid.archetype.name === '均衡型', '全中间向量 → 均衡型，实得 ' + pMid.archetype.name);
ok(pMid.strengths.length > 0, '全中间也有优势（不留空白）');
ok(pMid.advices.length > 0, '全中间也有建议（不留空白）');
ok(pMid.narrative.length > 30, '全中间也有叙述');
ok(!/居中、居中|居中，居中/.test(pMid.oneLiner), '全中间概括不出现「居中、居中」废话');
ok(pMid.oneLiner.includes('均衡') || pMid.oneLiner.includes('中间'), '全中间概括用均衡表述');
console.log('  全中间向量 → ' + pMid.archetype.name + ' | ' + pMid.oneLiner);

// 单条突出轴的情形
const fake1 = JSON.parse(JSON.stringify(synMid));
api.AXIS_KEYS.forEach(k => { fake1.avgVector[k] = 50; });
fake1.avgVector.extraversion = 80;
fake1.conflicts = [];
const p1 = api.buildProfile(fake1);
ok(!/居中、居中/.test(p1.oneLiner) && p1.oneLiner.includes('外向活跃'),
   '仅一轴突出时概括点明该特质且无重复废话');
console.log('  仅外向性突出 → ' + p1.oneLiner);

console.log('\n========== 5. 单维度降级 ==========');
[
  ['仅MBTI', {mbti:{type:'ISFP',identity:'T'},zodiac:null,bazi:null}],
  ['仅星座', {mbti:null,zodiac:api.getZodiacSign(11,10),bazi:null}],
  ['仅八字', {mbti:null,zodiac:null,bazi:api.calcBazi(1988,8,8,null)}]
].forEach(([n, inp]) => {
  const s = api.synthesize(inp);
  const pp = api.buildProfile(s);
  const okSingle = pp.insight.includes('一个维度') && pp.tensions.length === 0 && pp.narrative.length > 30;
  ok(okSingle, n + ' → ' + pp.archetype.name + '，洞察提示单维度且无张力点');
});

console.log('\n========== 6. 全 16 型 × 抽样星座 稳定性 ==========');
let errCount = 0, arcSet = new Set();
Object.keys(api.TYPES).forEach(t => {
  [1,4,7,10].forEach(mo => {
    ['A','T'].forEach(id => {
      try {
        const s = api.synthesize({
          mbti:{type:t,identity:id},
          zodiac:api.getZodiacSign(mo,15),
          bazi:api.calcBazi(1992,mo,15,10)
        });
        const pp = api.buildProfile(s);
        if (!pp.archetype.name || !pp.narrative || pp.narrative.length < 20) errCount++;
        if (!pp.strengths.length || !pp.advices.length) errCount++;
        arcSet.add(pp.archetype.name);
      } catch(e) { errCount++; console.log('    ✗ '+t+'-'+id+' 月'+mo+': '+e.message); }
    });
  });
});
ok(errCount === 0, '128 组真实组合全部生成完整总结');
ok(arcSet.size >= 8, '实际产出 ' + arcSet.size + ' 种不同原型（有区分度）');
console.log('  产出原型: ' + [...arcSet].join('、'));

console.log('\n========== 7. 文案无占位符残留 ==========');
let badText = 0;
Object.entries(api.PROFILE_DATA.axisText).forEach(([axis, bands]) => {
  ['high','mid','low'].forEach(b => {
    const t = bands[b];
    if (!t) { console.log('  ❌ ' + axis + '.' + b + ' 缺失'); badText++; return; }
    ['narrative','work','social','strength','advice'].forEach(f => {
      if (!t[f] || t[f].length < 6) { console.log('  ❌ ' + axis+'.'+b+'.'+f + ' 过短或缺失'); badText++; }
      if (/TODO|待补|xxx|占位/i.test(t[f])) { console.log('  ❌ ' + axis+'.'+b+'.'+f + ' 含占位符'); badText++; }
    });
  });
});
ok(badText === 0, '5 轴 × 3 档 × 5 类 = 75 条文案全部完整');

const arcBad = api.PROFILE_DATA.archetypes.filter(a =>
  !a.name || !a.face || !a.title || !a.desc || !Array.isArray(a.keys) || a.keys.length !== 2);
ok(arcBad.length === 0, '16 个原型字段完整（各含 2 个匹配键）');

console.log('\n' + '='.repeat(48));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(48));
process.exit(fail ? 1 : 0);
