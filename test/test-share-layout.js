/* 分享图布局核算：从真实代码提取参数，确保不溢出 */
const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const code = fs.readFileSync(B + 'assets/js/share-summary.js', 'utf8');

// 从代码中抽取关键常量，避免测试与实现脱节
function pick(re, label) {
  const m = code.match(re);
  if (!m) { console.log('⚠️  未能从代码提取: ' + label); return null; }
  return Number(m[1]);
}

const PS_H = pick(/PS_W = 1080, PS_H = (\d+)/, 'PS_H');
const titleY = pick(/wrap\(c, arc\.title, PS_W \/ 2, (\d+)/, '副标题Y');
const titleLH = pick(/wrap\(c, arc\.title, PS_W \/ 2, \d+, \d+, (\d+)\)/, '副标题行高');
const titleMaxW = pick(/wrap\(c, arc\.title, PS_W \/ 2, \d+, (\d+)/, '副标题宽');
const oneGap = pick(/let cy = y \+ (\d+);/, '金句上间距');
const oneBase = pick(/const oneH = (\d+) \+ oneLines/, '金句基高');
const oneLH = pick(/const oneH = \d+ \+ oneLines \* (\d+)/, '金句行高');
const oneAfter = pick(/cy \+= oneH \+ (\d+);/, '金句下间距');
const scoreH = pick(/hasScore \? (\d+) :/, '含分卡高');
const noScoreH = pick(/hasScore \? \d+ : (\d+)/, '无分卡高');
const cardAfter = pick(/cy \+= 232 \+ (\d+);/, '三维卡下间距');
const barBase = pick(/const barCardH = (\d+) \+ axes\.length/, '五维卡基高');
const barRow = pick(/const barCardH = \d+ \+ axes\.length \* (\d+)/, '五维行高');
const barAfter = pick(/cy \+= barCardH \+ (\d+);/, '五维卡下间距');
const tagH = pick(/const tagH = (\d+);/, '标签高');
const tagAfter = pick(/cy \+= tagH \+ (\d+);/, '标签下间距');
const ctaOff = pick(/const ctaY = PS_H - (\d+);/, 'CTA偏移');

console.log('从代码提取的布局参数:');
console.log('  画布高 ' + PS_H + ' | 副标题 Y' + titleY + ' 行高' + titleLH);
console.log('  金句 基高' + oneBase + ' 行高' + oneLH + ' | 三维卡 ' + scoreH + '/' + noScoreH);
console.log('  五维卡 基高' + barBase + ' 行高' + barRow + ' | CTA 起点 ' + (PS_H - ctaOff));
console.log('');

function layout(oneLen, titleLen, hasScore, hasTags) {
  // 33px 字号估宽（含中文全宽）
  const titleLines = Math.max(1, Math.ceil(titleLen * 33 / titleMaxW));
  let y = titleY + titleLines * titleLH;
  // 35px 字号
  const oneLines = Math.max(1, Math.ceil(oneLen * 35 / 860));
  const oneH = oneBase + oneLines * oneLH;
  let cy = y + oneGap + oneH + oneAfter;
  cy += (hasScore ? scoreH : noScoreH) + cardAfter;
  cy += (barBase + 5 * barRow) + barAfter;
  if (hasTags) cy += tagH + tagAfter;
  return { end: cy, titleLines, oneLines };
}

const oneLiners = [
  '你的五项特质都落在中间地带，是相当均衡的类型。',
  '外向活跃是你最鲜明的特点，其余特质都比较居中。',
  '自律有序、平稳抗压，是你身上最明显的两个特点。',
  '沉静内敛、求新好奇，是你身上最明显的两个特点。',
  '体贴共情、敏感起伏，是你身上最明显的两个特点。'
];
const titles = [
  '点子多、推得动的开拓者', '能把人和事都安排到位的统筹者',
  '想得远也做得实的架构者', '各方面都比较均衡的调和者',
  '敏感而富有创造力的创作者', '让一群人愿意待在一起的凝聚者',
  '理解力与共情力兼具的倾听者', '安静但思考很深的探索者'
];

const ctaStart = PS_H - ctaOff;
let worst = 0, worstD = '', n = 0;
oneLiners.forEach(ol => titles.forEach(t => [true, false].forEach(hs => [true, false].forEach(tg => {
  n++;
  const r = layout(ol.length, t.length, hs, tg);
  if (r.end > worst) { worst = r.end; worstD = `「${t}」${hs?'有':'无'}一致性 ${r.titleLines}行标题 ${r.oneLines}行金句`; }
}))));

console.log('穷举 ' + n + ' 种组合');
console.log('内容区最大结束: ' + worst + 'px');
console.log('CTA 区起点:     ' + ctaStart + 'px');
const margin = ctaStart - worst;
console.log('安全余量:       ' + margin + 'px');
console.log('最紧情况: ' + worstD);
console.log('');

if (margin < 0) {
  console.log('❌ 溢出 ' + (-margin) + 'px');
  process.exit(1);
} else if (margin < 30) {
  console.log('⚠️  余量不足 30px，有风险');
  process.exit(1);
} else {
  console.log('✅ 布局安全');
  process.exit(0);
}
