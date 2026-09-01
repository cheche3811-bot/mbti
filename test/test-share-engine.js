const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const load = f => fs.readFileSync(B + 'assets/js/' + f, 'utf8');

// localStorage 模拟（引擎依赖）
let LS = {};
global.localStorage = {
  getItem: k => LS[k] || null,
  setItem: (k, v) => { LS[k] = v; },
  removeItem: k => { delete LS[k]; }
};

const src = load('data-bundle.js') + load('types.js') + load('animals.js')
          + load('astro.js') + load('synthesis.js') + load('share-engine.js');
const api = new Function(src + `; return {
  buildVars, calcBadges, evalCond, interpolate, generateCopyCandidates,
  pickTheme, shareCopyStats, pickTemplate,
  synthesize, buildProfile, getZodiacSign, calcBazi,
  SHARE_COPY_DATA, TYPES, ANIMAL_SPEC
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

const D = api.SHARE_COPY_DATA;

console.log('\n========== 1. 模板库规模 ==========');
const st = api.shareCopyStats();
console.log('  ' + JSON.stringify(st.perStyle));
// 6 类 = 原 5 类 + contrast（反差式）。反差式为「三维说法互相打架」的场景而设：
// 一致性低时，「两个体系各执一词」才是这个人最鲜明的特点，不该被回避。
ok(st.styleCount === 6, '6 类风格（含反差式），实得 ' + st.styleCount);
ok(!!D.styles.contrast, '存在 contrast（反差式）风格');
// 反差式每个模板都必须依赖分歧变量 —— 否则在无分歧场景下会输出「差了 undefined 分」
const conBad = D.styles.contrast.templates.filter(t =>
  !(t.needs || []).some(n => n.startsWith('split') || n === 'contrastLine'));
ok(conBad.length === 0, '反差式模板全部依赖分歧变量' +
   (conBad.length ? '，缺: ' + conBad.map(t => t.id).join(',') : ''));
ok(st.templateTotal >= 24, '模板总数 ≥24，实得 ' + st.templateTotal);
// 10 条 = 原 9 条 + big-split（反差 {splitGap} 分）。一致性低的用户需要一条
// 能炫耀的徽章：原本只有「多面人格」这种描述性标签，没有可晒的数字。
ok(st.badgeRules === 10, '10 条徽章规则，实得 ' + st.badgeRules);
ok(st.themes === 4, '4 套配色主题，实得 ' + st.themes);

console.log('\n========== 2. 模板 ID 唯一性与 needs 合法性 ==========');
const allIds = [], allVarsUsed = new Set();
let needBad = 0;
const declaredVars = Object.keys(D._meta.variables);
Object.entries(D.styles).forEach(([k, s]) => {
  s.templates.forEach(t => {
    allIds.push(t.id);
    // 提取模板里实际用到的变量
    (t.text.match(/\{(\w+)\}/g) || []).forEach(m => {
      const name = m.slice(1, -1);
      allVarsUsed.add(name);
      // 模板用到的可选变量必须在 needs 里声明（否则会出现未替换占位符）
      const OPTIONAL = ['score','scoreLabel','rarity','zodiac','dayMaster','animal',
                        'topTrait','topTraitVal','secondTrait','secondTraitVal',
                        'strength','advice','conflictAxis','badge','mbti','mbtiCn','dimList'];
      if (OPTIONAL.includes(name) && !(t.needs || []).includes(name)) {
        console.log('    ✗ ' + t.id + ' 用了 {' + name + '} 但未在 needs 声明');
        needBad++;
      }
    });
  });
});
ok(new Set(allIds).size === allIds.length, '模板 ID 全部唯一（' + allIds.length + ' 个）');
ok(needBad === 0, '所有可选变量都在 needs 中正确声明');

const undeclared = [...allVarsUsed].filter(v => !declaredVars.includes(v));
ok(undeclared.length === 0, '所有变量都在 _meta.variables 有文档' +
   (undeclared.length ? '，缺: ' + undeclared.join(',') : ''));

console.log('\n========== 3. 条件求值器（不用 eval）==========');
const tv = { rarityNum: 1.5, rarity: '1.5%', score: 88, dimCount: 3, maxTrait: 82, minTrait: 18, allMid: false };
ok(api.evalCond('rarity<2', tv) === true, 'rarity<2 → true（1.5%）');
ok(api.evalCond('rarity<4', tv) === true, 'rarity<4 → true');
ok(api.evalCond('score>=85', tv) === true, 'score>=85 → true（88）');
ok(api.evalCond('score>=95', tv) === false, 'score>=95 → false');
ok(api.evalCond('dimCount==3', tv) === true, 'dimCount==3 → true');
ok(api.evalCond('maxTrait>=80', tv) === true, 'maxTrait>=80 → true');
ok(api.evalCond('minTrait<=20', tv) === true, 'minTrait<=20 → true');
ok(api.evalCond('allMid', tv) === false, '裸布尔 allMid → false');
ok(api.evalCond('score>=85', {}) === false, '变量缺失时安全返回 false');
// 注入安全性
ok(api.evalCond('1;process.exit(1)', tv) === false, '恶意字符串不执行（无 eval）');

console.log('\n========== 4. 徽章计算 ==========');
const z = api.getZodiacSign(5, 15);
const bz = api.calcBazi(1990, 5, 15, 14);

// INFJ 稀有 1.5%
const synA = api.synthesize({ mbti:{type:'INFJ',identity:'A'}, zodiac:z, bazi:bz });
const profA = api.buildProfile(synA);
const varsA = api.buildVars(synA, profA, { mbti:{type:'INFJ',identity:'A'}, zodiac:z, bazi:bz });
const badgesA = api.calcBadges(varsA);
console.log('  INFJ-A + 金牛 + 庚金 解锁徽章:');
badgesA.forEach(b => console.log('    ' + b.icon + ' ' + b.label + ' — ' + b.sub + ' (w' + b.weight + ')'));
ok(badgesA.length > 0, '至少解锁 1 个徽章，实得 ' + badgesA.length);
ok(badgesA.some(b => b.id === 'ultra-rare'), 'INFJ(1.5%) 解锁「极稀有人格」');
ok(!badgesA.some(b => b.id === 'rare'), '稀有度徽章去重：有 ultra 就不出 rare');
ok(badgesA.some(b => b.id === 'full-report'), '三维全填解锁「完整版报告」');
ok(badgesA[0].weight >= badgesA[badgesA.length-1].weight, '徽章按权重降序排列');
// 徽章文案已插值
ok(!badgesA.some(b => /\{|\}/.test(b.label + b.sub)), '徽章文案无未替换占位符');

// 常见型 ISFJ 13.8% 不应有稀有徽章
const synB = api.synthesize({ mbti:{type:'ISFJ',identity:'A'}, zodiac:z, bazi:null });
const profB = api.buildProfile(synB);
const varsB = api.buildVars(synB, profB, { mbti:{type:'ISFJ',identity:'A'}, zodiac:z, bazi:null });
const badgesB = api.calcBadges(varsB);
const RARITY_BADGES = ['ultra-rare', 'rare'];   // 注意：rare-low 是低分特质徽章，不属稀有度
ok(!badgesB.some(b => RARITY_BADGES.includes(b.id)), 'ISFJ(13.8%) 不解锁人口稀有度徽章');
ok(!badgesB.some(b => b.id === 'full-report'), '两维度不解锁完整版徽章');

console.log('\n========== 5. 文案生成与占位符完整性（关键）==========');
const inputA = { mbti:{type:'INFJ',identity:'A'}, zodiac:z, bazi:bz };
const cands = api.generateCopyCandidates(synA, profA, inputA);
ok(cands.length >= 4, '生成 ≥4 套候选，实得 ' + cands.length);

let phBad = 0;
cands.forEach(c => {
  const leftover = c.text.match(/\{(\w+)\}/g);
  if (leftover) { console.log('    ✗ ' + c.styleKey + ' 残留占位符: ' + leftover.join(',')); phBad++; }
});
ok(phBad === 0, '所有候选文案无未替换占位符');

console.log('\n  ── 生成的 5 套候选 ──');
cands.forEach(c => {
  console.log('\n  【' + c.icon + ' ' + c.styleName + '】' + c.len + '字 ' + (c.overLimit ? '⚠️超长' : '✓') + ' [' + c.templateId + ']');
  c.text.split('\n').forEach(l => console.log('    ' + l));
});

console.log('\n========== 6. 长度控制 ==========');
let lenBad = 0;
const overDetail = {};
Object.keys(D._meta.lengthGuide).forEach(pf => {
  const max = D._meta.lengthGuide[pf].max;
  for (let i = 0; i < 40; i++) {
    const cs = api.generateCopyCandidates(synA, profA, inputA, { platform: pf });
    cs.forEach(c => {
      if (c.len > max) {
        lenBad++;
        const k = pf + '/' + c.templateId;
        overDetail[k] = Math.max(overDetail[k] || 0, c.len - max);
      }
    });
  }
});
if (lenBad) {
  console.log('  超限详情（平台/模板 → 超出字数）:');
  Object.entries(overDetail).sort((a,b)=>b[1]-a[1]).slice(0,8)
    .forEach(([k,v]) => console.log('    ' + k + ' 超 ' + v + ' 字'));
}
ok(lenBad === 0, '各平台文案均未超长（含 CTA 附加后）');

// 朋友圈不折叠检查
const wxCands = api.generateCopyCandidates(synA, profA, inputA, { platform:'wechat_moments' });
const shortEnough = wxCands.filter(c => c.len <= 112).length;
console.log('  朋友圈 ≤112 字（不折叠）的候选: ' + shortEnough + '/' + wxCands.length);
// 拼接链接后（URL 约 40 字符），112 字免折叠的名额变紧，这是有意的权衡：
// 宁可折叠也要保证链接在。极简式不加 CTA，天然最短，保证至少一套免折叠。
ok(shortEnough >= 1, '至少 1 套不触发朋友圈折叠（含链接后的现实约束）');
const minLen = Math.min(...wxCands.map(c => c.len));
ok(minLen <= 60, '最短候选 ' + minLen + ' 字（配图发送场景可用）');

console.log('\n========== 7. 轮换去重机制 ==========');
LS = {};   // 清空
const seen = new Set();
let dupInRow = 0;
for (let round = 0; round < 6; round++) {
  const cs = api.generateCopyCandidates(synA, profA, inputA);
  cs.forEach(c => {
    const key = c.styleKey + ':' + c.templateId;
    if (seen.has(key) && round < 3) dupInRow++;
    seen.add(key);
  });
}
console.log('  6 轮生成共出现 ' + seen.size + ' 种不同模板组合');
ok(seen.size >= 12, '轮换有效，去重后 ≥12 种组合，实得 ' + seen.size);
ok(dupInRow <= 3, '前 3 轮重复次数 ≤3，实得 ' + dupInRow);

// localStorage 记录上限
const usedRaw = LS['tri_persona_used_copy'];
ok(usedRaw && JSON.parse(usedRaw).length <= 40, 'localStorage 记录不超过 40 条');

// localStorage 不可用时不报错
const savedLS = global.localStorage;
global.localStorage = { getItem: () => { throw new Error('blocked'); },
                        setItem: () => { throw new Error('blocked'); } };
let lsSafe = true;
try { api.generateCopyCandidates(synA, profA, inputA); } catch(e) { lsSafe = false; }
ok(lsSafe, '隐私模式（localStorage 抛错）下静默降级不崩溃');
global.localStorage = savedLS;

console.log('\n========== 8. 单维度降级 ==========');
[
  ['仅MBTI', { mbti:{type:'ENFP',identity:'T'}, zodiac:null, bazi:null }],
  ['仅星座', { mbti:null, zodiac:api.getZodiacSign(1,5), bazi:null }],
  ['仅八字', { mbti:null, zodiac:null, bazi:api.calcBazi(2000,7,7,null) }]
].forEach(([n, inp]) => {
  const s = api.synthesize(inp);
  const p = api.buildProfile(s);
  const cs = api.generateCopyCandidates(s, p, inp);
  const noPh = cs.every(c => !/\{\w+\}/.test(c.text));
  ok(cs.length >= 2 && noPh, n + ' → ' + cs.length + ' 套候选，无残留占位符');
});

console.log('\n========== 9. 配色主题 ==========');
const themes = new Set();
for (let i = 0; i < 60; i++) themes.add(api.pickTheme().id);
ok(themes.size === 4, '随机能取到全部 4 套主题，实得 ' + themes.size);
// 稳定映射
const t1 = api.pickTheme('INFJ-A'), t2 = api.pickTheme('INFJ-A');
ok(t1.id === t2.id, '传入 seedKey 时映射稳定（同 key 同主题）');
let themeBad = 0;
D.themes.list.forEach(t => {
  ['bg','band','ink','accent','sub','deco'].forEach(f => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(t[f])) { console.log('    ✗ '+t.id+'.'+f); themeBad++; }
  });
});
ok(themeBad === 0, '4 套主题色值全部合法');

console.log('\n========== 10. 全 16 型 × 多组合 稳定性 ==========');
let stableBad = 0, totalGen = 0, allBadges = new Set();
Object.keys(api.TYPES).forEach(t => {
  [[5,15,14],[1,5,null],[11,10,3]].forEach(([mo,d,h]) => {
    const inp = {
      mbti: { type:t, identity:'A' },
      zodiac: api.getZodiacSign(mo, d),
      bazi: api.calcBazi(1992, mo, d, h)
    };
    try {
      const s = api.synthesize(inp);
      const p = api.buildProfile(s);
      const cs = api.generateCopyCandidates(s, p, inp);
      totalGen += cs.length;
      cs.forEach(c => {
        if (/\{\w+\}/.test(c.text)) { console.log('    ✗ '+t+' '+c.styleKey+' 残留'); stableBad++; }
        if (c.text.length < 8) { console.log('    ✗ '+t+' '+c.styleKey+' 过短'); stableBad++; }
      });
      const vv = api.buildVars(s, p, inp);
      api.calcBadges(vv).forEach(b => allBadges.add(b.id));
    } catch(e) { stableBad++; console.log('    ✗ '+t+': '+e.message); }
  });
});
ok(stableBad === 0, '48 组组合共生成 ' + totalGen + ' 条文案，全部合规');
// 补充极端场景样本：单维度向量更极端，容易触发特质类徽章
Object.keys(api.TYPES).forEach(t => {
  ['A','T'].forEach(id => {
    [
      { mbti:{type:t,identity:id}, zodiac:null, bazi:null },
      { mbti:{type:t,identity:id}, zodiac:api.getZodiacSign(7,25), bazi:null },
      { mbti:null, zodiac:api.getZodiacSign(1,5), bazi:api.calcBazi(1988,8,8,12) }
    ].forEach(inp => {
      const s2 = api.synthesize(inp);
      if (!s2) return;
      const p2 = api.buildProfile(s2);
      api.calcBadges(api.buildVars(s2, p2, inp)).forEach(b => allBadges.add(b.id));
    });
  });
});
console.log('  实际触发的徽章种类: ' + [...allBadges].sort().join(', '));
ok(allBadges.size >= 7, '至少 7 种徽章能被真实数据触发，实得 ' + allBadges.size);

// 检查是否有徽章永远触发不到（配置错误）
const definedBadges = D.badges.rules.map(r => r.id);
const neverFired = definedBadges.filter(id => !allBadges.has(id));
console.log('  未触发的徽章: ' + (neverFired.length ? neverFired.join(', ') : '无'));

console.log('\n========== 11. CTA 链接拼接（传播闭环）==========');
const siteUrl = D.site && D.site.url;
ok(!!siteUrl, 'share-copy.json 含 site.url 配置：' + siteUrl);
ok(!!(D.site && D.site.shortLabel), 'site.shortLabel 存在（分享图回链用）');
// 所有 CTA 必须含 {url} 占位符 —— 否则「👉」后面是空的
const ctaNoUrl = D.cta.list.filter(c => !c.includes('{url}'));
ok(ctaNoUrl.length === 0, '全部 CTA 含 {url} 占位符' + (ctaNoUrl.length ? '，缺: ' + ctaNoUrl.join(' | ') : ''));
// 生成的文案里 URL 必须已展开
const ctaCands = api.generateCopyCandidates(synA, profA, inputA, { withCta: true });
const nonMinimal = ctaCands.filter(c => c.styleKey !== 'minimal');
const withLink = nonMinimal.filter(c => c.text.includes(siteUrl));
ok(withLink.length === nonMinimal.length,
   '非极简式文案全部含可点击链接 ' + withLink.length + '/' + nonMinimal.length);
ok(!ctaCands.some(c => c.text.includes('{url}')), '无 {url} 占位符残留');
// 加了 URL 后仍不能超长
ok(!ctaCands.some(c => c.len > 120), '拼接链接后仍未超朋友圈上限');

console.log('\n========== 12. 反差场景（INFP + 白羊座）==========');
// 真实用户案例：INFP-A + 白羊座，一致性 37 分，外向性分歧 46 分。
// 改造前这里会输出「均衡型」+ 自相矛盾的两条徽章，用户说「没有 get 到我的点」。
const aries = api.getZodiacSign(4, 10);
const inpC = { mbti:{type:'INFP',identity:'A'}, zodiac:aries, bazi:null };
const synC = api.synthesize(inpC);
const profC = api.buildProfile(synC);
console.log('  一致性 ' + synC.overall + '%（' + synC.level.label + '）');
console.log('  原型 ' + profC.archetype.face + ' ' + profC.archetype.name + ' — ' + profC.archetype.title);

ok(synC.conflicts.length > 0, 'INFP + 白羊确实存在分歧轴');
ok(profC.archetype.contrast === true, '命中反差型原型，实得「' + profC.archetype.name + '」');
ok(profC.archetype.name !== '均衡型', '不再是「均衡型」');
ok(!!profC.archetype.contrastLine, '反差型原型带 contrastLine 金句');

// 徽章不能自相矛盾：多面人格（分歧）与均衡（无分歧）互斥
const varsC = api.buildVars(synC, profC, inpC);
const badgesC = api.calcBadges(varsC);
badgesC.forEach(b => console.log('    ' + b.icon + ' ' + b.label + ' — ' + b.sub));
const hasSplit = badgesC.some(b => b.id === 'split-soul');
const hasBalanced = badgesC.some(b => b.id === 'balanced');
ok(!(hasSplit && hasBalanced), '「多面人格」与「均衡」不再同时出现（互斥）');

// 反差式文案必须出现，且不能提「均衡型」
const candsC = api.generateCopyCandidates(synC, profC, inpC);
const conC = candsC.find(c => c.styleKey === 'contrast');
ok(!!conC, '反差式文案已生成');
ok(!candsC.some(c => c.text.includes('均衡型')), '候选文案中不再出现「均衡型」');
ok(candsC.every(c => !/\{\w+\}/.test(c.text)), '全部候选无未替换占位符');
// 分歧变量必须真的插值进去了，而不是空字符串
if (conC) {
  console.log('  【反差式】' + conC.len + '字 [' + conC.templateId + ']');
  conC.text.split('\n').forEach(l => console.log('    ' + l));
  ok(/\d/.test(conC.text), '反差式文案含具体分歧数值');
}

console.log('\n========== 13. 品牌信息 ==========');
ok(!!D.brand.name && !!D.brand.en && !!D.brand.tagline && !!D.brand.mark, '品牌四要素齐备');
console.log('  ' + D.brand.mark + ' ' + D.brand.name + ' / ' + D.brand.en + ' — ' + D.brand.tagline);

console.log('\n' + '='.repeat(52));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(52));
process.exit(fail ? 1 : 0);
