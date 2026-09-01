const fs = require('fs');
const B = require('path').join(__dirname, '..') + '/';
const src = fs.readFileSync(B + 'assets/js/data-bundle.js', 'utf8')
          + fs.readFileSync(B + 'assets/js/astro.js', 'utf8');
const api = new Function(src + `; return {
  getZodiacSign, calcBazi, getDayPillar, getYearPillar, getHourPillar,
  toJulianDay, ZODIAC_DATA, BAZI_DATA, STEMS_CN, BRANCHES_CN, getHourOptions
};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

console.log('\n========== 1. 儒略日换算 ==========');
// 已知：2000-01-01 的儒略日为 2451545
ok(api.toJulianDay(2000, 1, 1) === 2451545, '2000-01-01 → JD 2451545');
ok(api.toJulianDay(1900, 1, 31) === 2415051, '1900-01-31 → JD 2415051（甲辰基准日）');

console.log('\n========== 2. 日柱干支（对照万年历真实数据）==========');
// 基准日自身必须是甲辰
const base = api.getDayPillar(1900, 1, 31);
ok(base.cn === '甲辰', '1900-01-31 = 甲辰（基准自校验）实得 ' + base.cn);

// 已知对照：2000-01-01 为戊午日
const d1 = api.getDayPillar(2000, 1, 1);
ok(d1.cn === '戊午', '2000-01-01 = 戊午，实得 ' + d1.cn);

// 已知对照：2024-01-01 为甲子日（经 2000-01-01 戊午 与 1949-10-01 甲子 双锚点反推确认）
const d2 = api.getDayPillar(2024, 1, 1);
ok(d2.cn === '甲子', '2024-01-01 = 甲子，实得 ' + d2.cn);

// 已知对照：1949-10-01 为甲子日
const d3 = api.getDayPillar(1949, 10, 1);
ok(d3.cn === '甲子', '1949-10-01 = 甲子，实得 ' + d3.cn);

console.log('\n========== 3. 干支循环闭合性 ==========');
// 连续 60 天应恰好走完一轮且不重复
const seen = new Set();
let cur = new Date(2024, 0, 1);
for (let i = 0; i < 60; i++) {
  const p = api.getDayPillar(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
  seen.add(p.cn);
  cur.setDate(cur.getDate() + 1);
}
ok(seen.size === 60, '连续 60 日产生 60 个不重复干支，实得 ' + seen.size);

// 第 61 天应回到起点
const p0 = api.getDayPillar(2024, 1, 1);
const d61 = new Date(2024, 0, 1); d61.setDate(d61.getDate() + 60);
const p61 = api.getDayPillar(d61.getFullYear(), d61.getMonth() + 1, d61.getDate());
ok(p0.cn === p61.cn, '第 61 天回到起点（60 循环闭合）' + p0.cn + ' = ' + p61.cn);

console.log('\n========== 4. 年柱与立春换年 ==========');
// 1984 为甲子年
const y1 = api.getYearPillar(1984, 6, 1);
ok(y1.cn === '甲子', '1984-06-01 = 甲子年，实得 ' + y1.cn);
// 2024 为甲辰年
const y2 = api.getYearPillar(2024, 6, 1);
ok(y2.cn === '甲辰', '2024-06-01 = 甲辰年，实得 ' + y2.cn);
// 立春前应算前一年：2024-01-15 立春前 → 癸卯年
const y3 = api.getYearPillar(2024, 1, 15);
ok(y3.cn === '癸卯' && y3.lichunAdjusted, '2024-01-15（立春前）= 癸卯年，实得 ' + y3.cn + ' adjusted=' + y3.lichunAdjusted);
// 立春后不调整
const y4 = api.getYearPillar(2024, 2, 10);
ok(y4.cn === '甲辰' && !y4.lichunAdjusted, '2024-02-10（立春后）= 甲辰年，实得 ' + y4.cn);

console.log('\n========== 5. 时柱五鼠遁 ==========');
// 甲日子时 = 甲子
const h1 = api.getHourPillar(0, 0);
ok(h1.cn === '甲子', '甲日 00:00 = 甲子时，实得 ' + h1.cn);
// 甲日午时(12点) = 庚午
const h2 = api.getHourPillar(12, 0);
ok(h2.cn === '庚午', '甲日 12:00 = 庚午时，实得 ' + h2.cn);
// 23点属次日子时范围，甲日23点 = 甲子
const h3 = api.getHourPillar(23, 0);
ok(h3.cn === '甲子', '甲日 23:00 = 甲子时（子时跨日），实得 ' + h3.cn);
// 乙日子时 = 丙子
const h4 = api.getHourPillar(0, 1);
ok(h4.cn === '丙子', '乙日 00:00 = 丙子时，实得 ' + h4.cn);

console.log('\n========== 6. 星座日期区间完整性 ==========');
// 遍历全年 366 天，每天必须且只能命中一个星座
let miss = [], multi = [];
const cnt = {};
for (let m = 1; m <= 12; m++) {
  const dim = new Date(2024, m, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    const r = api.getZodiacSign(m, d);
    if (!r) miss.push(m + '/' + d);
    else cnt[r.key] = (cnt[r.key] || 0) + 1;
  }
}
ok(miss.length === 0, '全年 366 天无遗漏' + (miss.length ? '，缺: ' + miss.slice(0,5).join(',') : ''));
ok(Object.keys(cnt).length === 12, '恰好覆盖 12 星座，实得 ' + Object.keys(cnt).length);
const totalDays = Object.values(cnt).reduce((a,b)=>a+b,0);
ok(totalDays === 366, '天数合计 366（2024闰年），实得 ' + totalDays);

console.log('\n  各星座天数分布:');
Object.entries(cnt).forEach(([k,v]) => {
  const s = api.ZODIAC_DATA.signs.find(x=>x.key===k);
  console.log('    ' + s.cn + ' ' + v + '天');
});

console.log('\n========== 7. 星座边界准确性 ==========');
ok(api.getZodiacSign(3, 21).key === 'aries', '3/21 = 白羊座');
ok(api.getZodiacSign(3, 20).key === 'pisces', '3/20 = 双鱼座');
ok(api.getZodiacSign(12, 22).key === 'capricorn', '12/22 = 摩羯座');
ok(api.getZodiacSign(1, 19).key === 'capricorn', '1/19 = 摩羯座（跨年正确）');
ok(api.getZodiacSign(1, 20).key === 'aquarius', '1/20 = 水瓶座');
ok(api.getZodiacSign(3, 21).nearBoundary === true, '3/21 标记为交界日');
ok(api.getZodiacSign(4, 5).nearBoundary === false, '4/05 非交界日');

console.log('\n========== 8. 完整排盘与五行统计 ==========');
const bz = api.calcBazi(1990, 5, 15, 14);
console.log('  1990-05-15 14:00 排盘:');
console.log('    年柱 ' + bz.pillars.year.cn + ' | 月柱 ' + bz.pillars.month.cn +
            ' | 日柱 ' + bz.pillars.day.cn + ' | 时柱 ' + bz.pillars.hour.cn);
console.log('    日主 ' + bz.dayMaster.cn + '（' + bz.dayMaster.elementCn + '）' + bz.dayMaster.title);
console.log('    生肖 ' + bz.zodiacAnimal);
console.log('    五行 ' + bz.elements.map(e=>e.data.cn+':'+e.count).join(' '));
const sum = bz.elements.reduce((s,e)=>s+e.count,0);
ok(sum === 8, '四柱八字五行总数=8，实得 ' + sum);
ok(bz.hasHour === true, '含时辰标记正确');

// 不填时辰的降级
const bz2 = api.calcBazi(1990, 5, 15, null);
const sum2 = bz2.elements.reduce((s,e)=>s+e.count,0);
ok(sum2 === 6 && !bz2.hasHour, '无时辰降级为三柱六字，实得 ' + sum2);
ok(bz2.pillars.hour === null, '无时辰时 hour 为 null');

console.log('\n========== 9. 五行向量完整性 ==========');
const AXES = api.TRAITS_DATA ? null : null;
// 检查所有天干都有 vector 且五轴齐全
let vecBad = 0;
api.BAZI_DATA.stems.forEach(s => {
  const keys = Object.keys(s.vector);
  if (keys.length !== 5) { console.log('  ❌ ' + s.cn + ' vector 轴数=' + keys.length); vecBad++; }
  keys.forEach(k => {
    if (s.vector[k] < 0 || s.vector[k] > 100) { console.log('  ❌ ' + s.cn + '.' + k + '=' + s.vector[k] + ' 越界'); vecBad++; }
  });
});
ok(vecBad === 0, '10 天干特质向量五轴齐全且值域合法');

let zBad = 0;
api.ZODIAC_DATA.signs.forEach(s => {
  if (Object.keys(s.vector).length !== 5) { console.log('  ❌ ' + s.cn); zBad++; }
});
ok(zBad === 0, '12 星座特质向量五轴齐全');

console.log('\n========== 10. 时辰选项 ==========');
const opts = api.getHourOptions();
ok(opts.length === 12, '12 个时辰选项，实得 ' + opts.length);
console.log('  前3项: ' + opts.slice(0,3).map(o=>o.label).join(' | '));

console.log('\n' + '='.repeat(46));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(46));
process.exit(fail ? 1 : 0);
