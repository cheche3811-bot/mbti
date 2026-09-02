const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const load = f => fs.readFileSync(B + 'assets/js/' + f, 'utf8');

const src = load('data-bundle.js') + load('types.js') + load('astro.js')
          + load('synthesis.js') + load('compatibility.js');
const api = new Function(src + `; return {
  coupleMatch, computeScore, findBestMatch, buildAdvice, personVector,
  getZodiacSign, COMPAT_DATA, TYPES, ZODIAC_DATA
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

const z = (m, d) => ({ zodiac: api.getZodiacSign(m, d), mbti: null, bazi: null });

console.log('\n========== 1. 契合度区分度（同元素高 / 相克低） ==========');
const fireFire = api.coupleMatch(z(4, 5), z(8, 5));       // 白羊+狮子
const waterWater = api.coupleMatch(z(7, 5), z(2, 19));    // 巨蟹+双鱼
const fireWater = api.coupleMatch(z(4, 5), z(7, 5));      // 白羊+巨蟹
ok(fireFire.score >= 80, '火火（白羊+狮子）高分，实得 ' + fireFire.score);
ok(waterWater.score >= 70, '水水（巨蟹+双鱼）较高分，实得 ' + waterWater.score);
ok(fireWater.score < fireFire.score, '火水（白羊+巨蟹）明显低于火火：' + fireWater.score + ' < ' + fireFire.score);
ok(fireWater.level.label === '差异较大' || fireWater.level.label === '需要磨合',
   '火水落入低分档（差异较大/需要磨合），实得「' + fireWater.level.label + '」');

console.log('\n========== 2. 完全相同 = 满分 ==========');
const same = api.coupleMatch(z(4, 5), z(4, 5));
ok(same.score === 100, '同星座满分 100，实得 ' + same.score);
ok(same.level.label === '天作之合', '同星座「天作之合」');

console.log('\n========== 3. 结构完整性 ==========');
const m = api.coupleMatch({ mbti: { type: 'INFP', identity: 'A' }, zodiac: api.getZodiacSign(4, 5), bazi: null }, z(8, 5));
ok(m && typeof m.score === 'number' && m.score >= 0 && m.score <= 100, '分数在 0-100');
ok(m.level && m.level.label && m.level.face && m.level.desc, '等级四要素齐全');
ok(Array.isArray(m.advice) && m.advice.length >= 3, '相处建议 ≥3 条，实得 ' + m.advice.length);
ok(m.advice.every(a => a.axis && a.text.length >= 6), '每条建议带轴名 + 文案');

console.log('\n========== 4. 相处建议覆盖 5 轴 ==========');
const advAxes = new Set(m.advice.map(a => a.axis));
ok(advAxes.size === 5, '建议覆盖 5 轴，实得 ' + advAxes.size + ' 轴');

console.log('\n========== 5. 理想型推荐 ==========');
const self = { mbti: { type: 'INFP', identity: 'A' }, zodiac: api.getZodiacSign(4, 5), bazi: null };
const best = api.findBestMatch(self);
ok(best.length === 3, '返回 top 3，实得 ' + best.length);
ok(best.every(b => b.type && b.signCn && typeof b.score === 'number'), '每条含 type/signCn/score');
ok(best[0].score >= best[1].score && best[1].score >= best[2].score, '按分数降序');

console.log('\n========== 6. 空输入防御 ==========');
ok(api.coupleMatch({ mbti: null, zodiac: null, bazi: null }, z(4, 5)) === null, '一方全空 → null');
ok(api.findBestMatch({ mbti: null, zodiac: null, bazi: null }).length === 0, '自己全空 → 理想型空');

console.log('\n========== 7. 等级阈值无空档 ==========');
const L = api.COMPAT_DATA.levels;
ok(L[0].min === 85 && L[L.length - 1].min === 0, '最高档 85 起、最低档 0 起');
let gap = 0;
for (let i = 1; i < L.length; i++) if (L[i - 1].min <= L[i].min) gap++;
ok(gap === 0, '阈值严格递减，无空档');

console.log('\n' + '='.repeat(48));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(48));
process.exit(fail ? 1 : 0);
