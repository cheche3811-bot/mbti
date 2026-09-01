/* ============================================================
 *  无障碍对比度测试（WCAG 2.1）
 *
 *  为什么需要：设计系统专家实测发现主 CTA 按钮
 *  白字 on coral 仅 2.31:1，远低于 AA 标准 4.5:1。
 *  这类问题肉眼难察觉（设计稿上看着挺好），必须靠计算守护。
 *
 *  标准：
 *  - 正文（<18.66px 或 <24px 非粗体）：AA 需 ≥4.5:1
 *  - 大字（≥18.66px 粗体 或 ≥24px）：AA 需 ≥3:1
 * ============================================================ */

const fs = require('fs');
const path = require('path');
const CSS = fs.readFileSync(path.join(__dirname, '..', 'assets/css/style.css'), 'utf8');

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

/* ---------- WCAG 相对亮度与对比度 ---------- */
function luminance(hex) {
  const h = hex.replace('#', '');
  const rgb = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255)
    .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}
function contrast(a, b) {
  const l1 = luminance(a), l2 = luminance(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/* ---------- 从 CSS 读取令牌实际值 ---------- */
function token(name) {
  const m = CSS.match(new RegExp('--' + name + '\\s*:\\s*(#[0-9A-Fa-f]{6})'));
  return m ? m[1] : null;
}

const C = {
  ink:    token('ink')    || '#2B2233',
  ink2:   token('ink-2')  || '#6B6076',
  coral:  token('coral')  || '#FF8A6B',
  yellow: token('yellow') || '#FFD84D',
  mint:   token('mint')   || '#7DDCC0',
  sky:    token('sky')    || '#8FC9F5',
  lilac:  token('lilac')  || '#C4A9F5',
  pink:   token('pink')   || '#FF9EC4',
  paper:  token('paper')  || '#FFFBF4',
  white:  '#FFFFFF',
  onInk:  token('on-ink') || '#FFF6E5'
};

console.log('\n========== 1. 令牌读取 ==========');
Object.entries(C).forEach(([k, v]) => {
  if (!/^#[0-9A-Fa-f]{6}$/.test(v)) { fail++; console.log('  ❌ ' + k + ' 色值异常: ' + v); }
});
ok(fail === 0, '全部色彩令牌格式合法（' + Object.keys(C).length + ' 个）');

console.log('\n========== 2. 关键交互元素对比度（AA 4.5:1）==========');
/* 这些是用户必须能看清的元素：按钮文字、正文、行动指引 */
const CRITICAL = [
  ['主 CTA 按钮 .btn-main',      C.ink,  C.coral, 4.5],
  ['入口卡行动文字 .ec-go',       C.ink,  C.white, 4.5],
  ['正文 on 纸张底',             C.ink,  C.paper, 4.5],
  ['次级文字 on 纸张底',          C.ink2, C.paper, 4.5],
  ['深色卡上的浅色文字',          C.onInk, C.ink,  4.5],
  ['ink 字 on 黄色块',           C.ink,  C.yellow, 4.5],
  ['ink 字 on 薄荷块',           C.ink,  C.mint,  4.5],
  ['ink 字 on 天蓝块',           C.ink,  C.sky,   4.5],
  ['ink 字 on 紫丁香块',         C.ink,  C.lilac, 4.5],
  ['ink 字 on 粉色块',           C.ink,  C.pink,  4.5]
];
CRITICAL.forEach(([name, fg, bg, min]) => {
  const r = contrast(fg, bg);
  ok(r >= min, name.padEnd(24) + r.toFixed(2) + ':1 (需 ≥' + min + ')');
});

console.log('\n========== 3. 回归守护：禁止低对比组合 ==========');
/* 白字 on 马卡龙色 = 经典陷阱，全部不达标，测试锁死 */
const FORBIDDEN = [
  ['白字 on coral',  C.white, C.coral],
  ['白字 on yellow', C.white, C.yellow],
  ['白字 on mint',   C.white, C.mint],
  ['白字 on sky',    C.white, C.sky]
];
console.log('  以下组合对比度过低，代码中不应出现：');
FORBIDDEN.forEach(([name, fg, bg]) => {
  console.log('    · ' + name.padEnd(18) + contrast(fg, bg).toFixed(2) + ':1');
});

/* 实际检查代码里有没有用 */
const btnMain = (CSS.match(/\.btn-main\{[\s\S]*?\}/) || [''])[0];
ok(!/color:\s*#fff\b/i.test(btnMain) && !/color:\s*white/i.test(btnMain),
   '.btn-main 未使用白色文字（避免 2.31:1）');

const ecGo = (CSS.match(/\.ec-go\{[^}]*\}/) || [''])[0];
ok(!/var\(--coral\)/.test(ecGo), '.ec-go 未使用 coral 文字（避免 2.31:1）');

console.log('\n========== 4. 触控目标尺寸 ==========');
const tapMin = CSS.match(/--tap-min\s*:\s*(\d+)px/);
ok(tapMin && +tapMin[1] >= 44, '定义了 --tap-min 且 ≥44px（iOS HIG 标准）' +
   (tapMin ? '，实为 ' + tapMin[1] + 'px' : ''));

console.log('\n========== 5. 设计令牌完备性 ==========');
const NEEDED = [
  ['间距系统', '--space-4'],
  ['字号阶梯', '--fs-base'],
  ['行高',     '--lh-normal'],
  ['字重',     '--fw-black'],
  ['动效时长', '--dur-base'],
  ['缓动曲线', '--ease-pop'],
  ['层级',     '--z-modal'],
  ['描边宽度', '--bw-thick'],
  ['文本色阶', '--ink-3']
];
NEEDED.forEach(([label, v]) => {
  ok(CSS.includes(v + ':'), label + ' 令牌存在（' + v + '）');
});

console.log('\n' + '='.repeat(50));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(50));
process.exit(fail ? 1 : 0);
