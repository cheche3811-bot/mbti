const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const src = fs.readFileSync(B + 'assets/js/data-bundle.js', 'utf8')
          + fs.readFileSync(B + 'assets/js/types.js', 'utf8')
          + fs.readFileSync(B + 'assets/js/questions.js', 'utf8')
          + fs.readFileSync(B + 'assets/js/astro.js', 'utf8')
          + fs.readFileSync(B + 'assets/js/synthesis.js', 'utf8');
const api = new Function(src + `; return {
  synthesize, buildSynthesisText, mbtiToVector, mbtiTypeToVector,
  cosineSimilarity, getZodiacSign, calcBazi, calculate, QUESTIONS,
  TRAITS_DATA, TYPES, AXIS_KEYS
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

console.log('\n========== 1. MBTI → 大五向量映射 ==========');
// ENFP-A：E高、N高(SN firstPct低)、F高(TF firstPct低)、P高(JP firstPct低)、A
const enfp = api.mbtiTypeToVector('ENFP', 'A');
console.log('  ENFP-A 向量:', JSON.stringify(enfp));
ok(enfp.extraversion > 60, 'E → 外向性偏高 (' + enfp.extraversion + ')');
ok(enfp.openness > 60, 'N → 开放性偏高 (' + enfp.openness + ')');
ok(enfp.agreeableness > 55, 'F → 宜人性偏高 (' + enfp.agreeableness + ')');
ok(enfp.conscientiousness < 45, 'P → 尽责性偏低 (' + enfp.conscientiousness + ')');
ok(enfp.stability > 55, 'A → 稳定性偏高 (' + enfp.stability + ')');

const istj = api.mbtiTypeToVector('ISTJ', 'T');
console.log('  ISTJ-T 向量:', JSON.stringify(istj));
ok(istj.extraversion < 40, 'I → 外向性偏低 (' + istj.extraversion + ')');
ok(istj.openness < 40, 'S → 开放性偏低 (' + istj.openness + ')');
ok(istj.conscientiousness > 60, 'J → 尽责性偏高 (' + istj.conscientiousness + ')');
ok(istj.stability < 45, 'T → 稳定性偏低 (' + istj.stability + ')');

console.log('\n========== 2. 余弦相似度区分度（关键）==========');
// 完全相同 → 100%
const same = api.cosineSimilarity(enfp, enfp);
ok(same === 100, '相同向量 = 100%，实得 ' + same);

// 完全相反 → 应接近 0
const opposite = {};
Object.keys(enfp).forEach(k => opposite[k] = 100 - enfp[k]);
const opp = api.cosineSimilarity(enfp, opposite);
ok(opp <= 5, '完全相反向量 ≈ 0%，实得 ' + opp);

// ENFP vs ISTJ 应明显偏低（性格几乎对立）
const enfpIstj = api.cosineSimilarity(enfp, istj);
console.log('  ENFP vs ISTJ = ' + enfpIstj + '%');
ok(enfpIstj < 30, 'ENFP vs ISTJ 相似度低于 30%，实得 ' + enfpIstj);

// ENFP vs ENFJ 应较高（只差一个字母）
const enfj = api.mbtiTypeToVector('ENFJ', 'A');
const enfpEnfj = api.cosineSimilarity(enfp, enfj);
console.log('  ENFP vs ENFJ = ' + enfpEnfj + '%');
ok(enfpEnfj > 60, 'ENFP vs ENFJ 相似度高于 60%，实得 ' + enfpEnfj);
ok(enfpEnfj > enfpIstj, '相近类型相似度 > 对立类型（区分度有效）');

console.log('\n========== 3. 一致性分布检验（防止虚高）==========');
// 遍历全部 16 型 × 12 星座，看一致性分布是否合理散开
const allTypes = Object.keys(api.TYPES);
const signs = api.TRAITS_DATA ? null : null;
let scores = [];
allTypes.forEach(t => {
  for (let m = 1; m <= 12; m++) {
    const z = api.getZodiacSign(m, 15);
    const syn = api.synthesize({
      mbti: { type: t, identity: 'A' },
      zodiac: z,
      bazi: null
    });
    scores.push(syn.overall);
  }
});
scores.sort((a,b)=>a-b);
const min = scores[0], max = scores[scores.length-1];
const avg = Math.round(scores.reduce((a,b)=>a+b,0)/scores.length);
const median = scores[Math.floor(scores.length/2)];
console.log('  192 组 MBTI×星座 一致性分布:');
console.log('    最低 ' + min + '% | 中位 ' + median + '% | 平均 ' + avg + '% | 最高 ' + max + '%');
ok(max - min > 40, '分布跨度 > 40 个百分点（有区分度），实得 ' + (max-min));
ok(avg > 30 && avg < 70, '平均值落在合理区间 30-70%，实得 ' + avg);
ok(min < 30, '存在低一致性组合（未虚高），最低 ' + min + '%');
ok(max > 75, '存在高一致性组合，最高 ' + max + '%');

// 分布直方图
const buckets = {};
scores.forEach(s => { const b = Math.floor(s/10)*10; buckets[b]=(buckets[b]||0)+1; });
console.log('\n  分布直方图:');
Object.keys(buckets).sort((a,b)=>a-b).forEach(b => {
  console.log('    ' + String(b).padStart(3) + '-' + String(+b+9).padStart(3) + '%  ' +
              '█'.repeat(Math.ceil(buckets[b]/3)) + ' ' + buckets[b]);
});

console.log('\n========== 4. 三维组合与降级 ==========');
const z1 = api.getZodiacSign(5, 15);
const bz1 = api.calcBazi(1990, 5, 15, 14);

// 三维全填
const s3 = api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:z1, bazi:bz1 });
ok(s3.count === 3, '三维全填 count=3');
ok(s3.pairs.length === 3, '三维产生 3 组两两对比，实得 ' + s3.pairs.length);
ok(s3.overall !== null, '三维有整体一致性 = ' + s3.overall + '%');
console.log('  三维: ' + s3.dims.map(d=>d.label+'('+d.title+')').join(' + '));
console.log('  两两: ' + s3.pairs.map(p=>p.a+'↔'+p.b+' '+p.score+'%').join(' | '));

// 双维度：MBTI + 星座
const s2a = api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:z1, bazi:null });
ok(s2a.count === 2 && s2a.pairs.length === 1, 'MBTI+星座 → 1 组对比');
// 双维度：星座 + 八字
const s2b = api.synthesize({ mbti:null, zodiac:z1, bazi:bz1 });
ok(s2b.count === 2 && s2b.overall !== null, '星座+八字 → 有一致性 ' + s2b.overall + '%');
// 双维度：MBTI + 八字
const s2c = api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:null, bazi:bz1 });
ok(s2c.count === 2, 'MBTI+八字 → count=2');

// 单维度：不应有一致性
const s1a = api.synthesize({ mbti:{type:'INTJ',identity:'A'}, zodiac:null, bazi:null });
ok(s1a.count === 1 && s1a.overall === null, '单维度 overall=null（无可比对象）');
ok(s1a.pairs.length === 0 && s1a.conflicts.length === 0, '单维度无对比无冲突');
const s1b = api.synthesize({ mbti:null, zodiac:z1, bazi:null });
ok(s1b.count === 1 && s1b.dominant.length === 3, '仅星座也能输出主导特质');
const s1c = api.synthesize({ mbti:null, zodiac:null, bazi:bz1 });
ok(s1c.count === 1, '仅八字可用');

// 全空
const s0 = api.synthesize({ mbti:null, zodiac:null, bazi:null });
ok(s0 === null, '全空返回 null');

console.log('\n========== 5. 冲突与共识识别 ==========');
console.log('  INTJ+金牛+庚金 冲突点: ' + (s3.conflicts.length ? s3.conflicts.map(c=>c.axis.cn+'(差'+c.gap+')').join(', ') : '无'));
console.log('  共识特质: ' + (s3.consensus.length ? s3.consensus.map(c=>c.label).join(', ') : '无'));
ok(Array.isArray(s3.conflicts), '冲突列表结构正确');
// 构造必然冲突的组合：ENFP(外向高) + 摩羯(外向32)
const zCap = api.getZodiacSign(1, 5);
const sConf = api.synthesize({ mbti:{type:'ENFP',identity:'A'}, zodiac:zCap, bazi:null });
ok(sConf.conflicts.length > 0, 'ENFP+摩羯 应识别出冲突，实得 ' + sConf.conflicts.length + ' 处');
console.log('  ENFP+摩羯 冲突: ' + sConf.conflicts.map(c=>c.axis.cn+' 差'+c.gap).join(', '));

console.log('\n========== 6. 向量值域合法性 ==========');
let outOfRange = 0;
allTypes.forEach(t => {
  ['A','T'].forEach(id => {
    const v = api.mbtiTypeToVector(t, id);
    Object.entries(v).forEach(([k,val]) => {
      if (val < 0 || val > 100 || !Number.isFinite(val)) { outOfRange++; console.log('  ❌ '+t+'-'+id+'.'+k+'='+val); }
    });
  });
});
ok(outOfRange === 0, '32 组 MBTI 向量全部落在 0-100');

// 八字向量值域
let bzBad = 0;
for (let mo=1; mo<=12; mo++) {
  for (let h=0; h<24; h+=3) {
    const b = api.calcBazi(1995, mo, 15, h);
    const sv = api.synthesize({mbti:null,zodiac:null,bazi:b});
    Object.values(sv.avgVector).forEach(val => { if(val<0||val>100) bzBad++; });
  }
}
ok(bzBad === 0, '96 组八字向量全部合法');

console.log('\n========== 7. 文案生成 ==========');
const t3 = api.buildSynthesisText(s3);
const t1 = api.buildSynthesisText(s1a);
ok(t3.includes('%') && t3.length > 50, '三维文案含百分比且完整（' + t3.length + '字）');
ok(t1.includes('一个维度'), '单维度文案说明无从交叉');
console.log('\n  三维文案示例:');
console.log('  ' + t3.replace(/<\/?b>/g,'').substring(0,160) + '…');
console.log('\n  单维度文案:');
console.log('  ' + t1.substring(0,110) + '…');

console.log('\n========== 8. 与真实答题结果打通 ==========');
// 模拟真实作答（全部偏向 E/N/F/P）
const answers = api.QUESTIONS.map(q => {
  if (q.dim==='EI') return q.dir>0? 2:-2;
  if (q.dim==='SN') return q.dir>0? -2:2;
  if (q.dim==='TF') return q.dir>0? -2:2;
  if (q.dim==='JP') return q.dir>0? -2:2;
  return q.dir>0? 2:-2;
});
const realResult = api.calculate(answers);
console.log('  模拟作答结果: ' + realResult.full);
const synReal = api.synthesize({ mbti: realResult, zodiac: z1, bazi: bz1 });
ok(synReal.dims[0].estimated === false, '真实答题向量非估算（有百分比）');
ok(synReal.overall !== null, '真实结果可参与综合，一致性 ' + synReal.overall + '%');
console.log('  MBTI向量(真实百分比): ' + JSON.stringify(synReal.dims[0].vector));
const estVec = api.mbtiTypeToVector(realResult.type, realResult.identity);
console.log('  MBTI向量(手填估算): ' + JSON.stringify(estVec));

console.log('\n' + '='.repeat(46));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(46));
process.exit(fail ? 1 : 0);
