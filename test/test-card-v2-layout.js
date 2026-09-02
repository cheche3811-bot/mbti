/* 分享图 V2 布局核算：从源码提取常量，穷举文案组合验证不溢出 */
const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const code = fs.readFileSync(B + 'assets/js/share-card-v2.js', 'utf8');

function pick(re, label, fallback) {
  const m = code.match(re);
  if (!m) { console.log('⚠️  未提取到: ' + label + '，用默认 ' + fallback); return fallback; }
  return Number(m[1]);
}

const H = pick(/V2_W = 1080, V2_H = (\d+)/, '画布高', 1920);
const PAD = pick(/V2_PAD = (\d+)/, '边距', 84);
const INNER = 1080 - PAD * 2;

const titleY = pick(/v2Wrap\(c, arc\.title, V2_W \/ 2, (\d+)/, '副标题Y', 690);
const titleLH = pick(/v2Wrap\(c, arc\.title, V2_W \/ 2, \d+, [^,]+, (\d+)\)/, '副标题行高', 44);
const quoteGap = pick(/let cy = y \+ (\d+);/, '金句上间距', 34);
const quoteBase = pick(/const qH = (\d+) \+ qL/, '金句基高', 68);
const quoteLH = pick(/const qH = \d+ \+ qL \* (\d+)/, '金句行高', 58);
const quoteAfter = pick(/cy \+= qH \+ (\d+);/, '金句下间距', 40);
const badgeH = pick(/const bH = (\d+);/, '徽章高', 132);
const badgeAfter = pick(/cy \+= bH \+ (\d+);/, '徽章下间距', 40);
const rowH = pick(/const rowH = (\d+);/, '五维行高', 74);
const barBase = pick(/const barCardH = (\d+) \+ axes\.length/, '五维卡基高', 84);
const barAfter = pick(/cy \+= barCardH \+ (\d+);/, '五维卡下间距', 40);
const dimPillH = 52;
const footOff = pick(/const footY = V2_H - (\d+);/, '品牌区偏移', 210);

console.log('提取到的布局参数:');
console.log(`  画布 1080×${H} | 边距 ${PAD} | 内容宽 ${INNER}`);
console.log(`  副标题 Y${titleY} LH${titleLH} | 金句 ${quoteBase}+${quoteLH}n`);
console.log(`  徽章 ${badgeH} | 五维 ${barBase}+${rowH}×5 | 品牌区起点 ${H - footOff}`);
console.log('');

// 品牌区顶部还有分隔装饰（footY - 26），实际可用下界要再留出
const footTop = H - footOff - 46;

function layout(titleLen, oneLen, badgeCount) {
  // 30px 字号，中文约等宽
  const tLines = Math.max(1, Math.ceil(titleLen * 30 / (INNER - 40)));
  let y = titleY + tLines * titleLH;
  // 40px 字号
  const qLines = Math.max(1, Math.ceil(oneLen * 40 / (INNER - 96)));
  const qH = quoteBase + qLines * quoteLH;
  let cy = y + quoteGap + qH + quoteAfter;
  if (badgeCount > 0) cy += badgeH + badgeAfter;
  cy += (barBase + 5 * rowH) + barAfter;
  cy += dimPillH;      // 维度标签
  return { end: cy, tLines, qLines };
}

// 穷举真实文案组合
const titles = [
  '点子多、推得动的开拓者', '能把人和事都安排到位的统筹者',
  '想得远也做得实的架构者', '各方面都比较均衡的调和者',
  '敏感而富有创造力的创作者', '让一群人愿意待在一起的凝聚者',
  '理解力与共情力兼具的倾听者', '安静但思考很深的探索者',
  '沉静而扎实的笃行者', '客观冷静的分析者', '随机应变的行动派',
  '不受拘束的自由灵魂', '可托付的定盘者', '讲效率、重结果的执行者',
  '细致周全的守护者', '安静而可靠的陪伴者', '敏感深思的内省者'
];
// 金句文本覆盖两条路径：
//   1. 常规 oneLiner（较长，22-26 字）—— 最坏情况的溢出边界
//   2. 反差 contrastLine（较短，12-19 字）—— 本次新增的优先路径
// contrastLine 一律比 oneLiner 短，理论上更安全；列进来是为了显式验证
// 「share-card-v2.js 金句优先用 contrastLine」这条路径也不溢出。
const oneLiners = [
  // oneLiner 路径
  '你的五项特质都落在中间地带，是相当均衡的类型。',
  '外向活跃是你最鲜明的特点，其余特质都比较居中。',
  '自律有序、平稳抗压，是你身上最明显的两个特点。',
  '沉静内敛、求新好奇，是你身上最明显的两个特点。',
  '体贴共情、敏感起伏，是你身上最明显的两个特点。',
  '务实守成、直率论理，是你身上最明显的两个特点。',
  // contrastLine 路径（12 条反差原型金句）
  '我平时不出声，不代表我没有声音',
  '安静是我的默认状态，不是我的上限',
  '不是我双面，是我只把能量给值得的人',
  '我想出走，但我一定会先订好回程票',
  '我的想象力有刹车，但刹车不是一直踩着',
  '我愿意试，但得先看清出口在哪儿',
  '我平时可以很散，但紧要关头比谁都较真',
  '我的计划表永远留一格，专门给意外',
  '我很好说话，但我有不能让的地方',
  '我会看场合说话，但每句话都是真的',
  '我不是不难过，我只是不难过给别人看',
  '我会晃得很明显，可我从来没真正断过'
];

let worst = 0, worstD = '', n = 0;
titles.forEach(t => oneLiners.forEach(o => [0, 1, 2, 3].forEach(bc => {
  n++;
  const r = layout(t.length, o.length, bc);
  if (r.end > worst) {
    worst = r.end;
    worstD = `「${t}」(${r.tLines}行) + ${r.qLines}行金句 + ${bc}徽章`;
  }
})));

console.log(`穷举 ${n} 种组合`);
console.log(`内容区最大结束: ${worst}px`);
console.log(`品牌区安全上界: ${footTop}px`);
const margin = footTop - worst;
console.log(`安全余量:       ${margin}px`);
console.log(`最紧情况: ${worstD}`);
console.log('');

// ---------- 品牌区自身是否溢出画布下边界 ----------
// 教训：加回链胶囊时只看了「内容区 vs 品牌区」，
// 忘了品牌区自己也会超出画布底部，回链被裁掉。
const brandItems = [
  ['CTA 文字',   26,  0],
  ['字标胶囊',   58,  62],
  ['tagline',   142, 0],
  ['回链胶囊',   164, 50],
];
let brandBottom = 0;
const brandTop = H - footOff;   // 品牌区起点 = 画布高 - footY 偏移量
brandItems.forEach(([n, off, h]) => {
  const b = brandTop + off + h;
  if (b > brandBottom) brandBottom = b;
});
const brandMargin = H - brandBottom;
console.log('');
console.log('品牌区内容最低点: ' + brandBottom + 'px');
console.log('画布下边界:      ' + H + 'px');
console.log('品牌区余量:      ' + brandMargin + 'px');
if (brandMargin < 0) {
  console.log('❌ 品牌区溢出画布 ' + (-brandMargin) + 'px —— 回链/字标会被裁掉');
  process.exit(1);
}
if (brandMargin < 16) {
  console.log('⚠️  品牌区余量不足 16px');
  process.exit(1);
}
console.log('✅ 品牌区安全');
console.log('');

if (margin < 0) {
  console.log(`❌ 溢出 ${-margin}px —— 会与品牌区重叠`);
  process.exit(1);
} else if (margin < 40) {
  console.log('⚠️  余量不足 40px，有风险');
  process.exit(1);
} else {
  console.log('✅ 布局安全');
  process.exit(0);
}
