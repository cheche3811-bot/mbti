#!/usr/bin/env node
/* ============================================================
 *  生成 OG 分享封面图（1200×630）
 *
 *  用途：微信/QQ/微博/Twitter 分享链接时显示的缩略图。
 *  没有它，链接发到微信只有一行标题文字，没有视觉吸引力。
 *
 *  输出：assets/og-cover.svg + 转换说明
 *  用法：node build-og-cover.js
 *
 *  注：SVG 可被大部分平台识别，但微信对 og:image 偏好 PNG/JPG。
 *  已同时输出 PNG 转换命令，装了 librsvg 可一键转。
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const W = 1200, H = 630;
const INK = '#2B2233';
const ROOT = __dirname;

// 复用项目的动物头像系统，保持品牌一致
const animalsSrc = fs.readFileSync(path.join(ROOT, 'assets/js/animals.js'), 'utf8');
const api = new Function(animalsSrc + '; return { animalAvatar, ANIMAL_SPEC };')();

/* 挑 4 个视觉差异大、辨识度高的形象做封面阵列 */
const FEATURED = ['INFP', 'ENFP', 'INTJ', 'ESFP'];

/* 取头像内部图形（去掉外层 svg 壳），便于嵌入并定位 */
function inlineAvatar(type, cx, cy, size, rotate) {
  const full = api.animalAvatar(type, { size: 512, shape: 'circle', pattern: true });
  const inner = full.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  const s = size / 512;
  return `<g transform="translate(${cx - size / 2},${cy - size / 2}) scale(${s}) rotate(${rotate},256,256)">${inner}</g>`;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="#FFF3D6"/>
    <stop offset="50%" stop-color="#FFFBF4"/>
    <stop offset="100%" stop-color="#EFE6FF"/>
  </linearGradient>
  <pattern id="dots" width="34" height="34" patternUnits="userSpaceOnUse">
    <circle cx="17" cy="17" r="2.6" fill="${INK}" opacity="0.055"/>
  </pattern>
</defs>

<rect width="${W}" height="${H}" fill="url(#bg)"/>
<rect width="${W}" height="${H}" fill="url(#dots)"/>

<!-- 顶部品牌色条 -->
<g>
  <rect x="0" y="0" width="240" height="12" fill="#FF8A6B"/>
  <rect x="240" y="0" width="240" height="12" fill="#FFD84D"/>
  <rect x="480" y="0" width="240" height="12" fill="#7DDCC0"/>
  <rect x="720" y="0" width="240" height="12" fill="#8FC9F5"/>
  <rect x="960" y="0" width="240" height="12" fill="#C4A9F5"/>
</g>

<!-- 四角装饰线 -->
<g stroke="#FF8A6B" stroke-width="7" stroke-linecap="round" fill="none">
  <path d="M44 92 L44 44 L92 44"/>
  <path d="M1156 92 L1156 44 L1108 44"/>
  <path d="M44 538 L44 586 L92 586"/>
  <path d="M1156 538 L1156 586 L1108 586"/>
</g>

<!-- 左侧文字区 -->
<g font-family="PingFang SC, Hiragino Sans GB, Microsoft YaHei, sans-serif">
  <!-- 品牌小标 -->
  <g transform="translate(80,120)">
    <rect x="0" y="0" width="268" height="46" rx="23" fill="${INK}"/>
    <text x="134" y="30" font-size="21" font-weight="800" fill="#FFD84D" text-anchor="middle">◈ TRI·PERSONA ◈</text>
  </g>

  <!-- 主标题 -->
  <text x="80" y="238" font-size="70" font-weight="900" fill="${INK}" letter-spacing="-2">三维性格分析</text>

  <!-- 副标题 -->
  <text x="80" y="300" font-size="30" font-weight="700" fill="#5A4E63">MBTI 人格 · 太阳星座 · 生辰八字</text>

  <!-- 卖点胶囊 -->
  <g transform="translate(80,340)">
    <rect x="0" y="0" width="176" height="52" rx="26" fill="#FFD84D" stroke="${INK}" stroke-width="4"/>
    <text x="88" y="34" font-size="22" font-weight="800" fill="${INK}" text-anchor="middle">48 题量表</text>

    <rect x="192" y="0" width="200" height="52" rx="26" fill="#7DDCC0" stroke="${INK}" stroke-width="4"/>
    <text x="292" y="34" font-size="22" font-weight="800" fill="${INK}" text-anchor="middle">三维交叉验证</text>

    <rect x="408" y="0" width="176" height="52" rx="26" fill="#C4A9F5" stroke="${INK}" stroke-width="4"/>
    <text x="496" y="34" font-size="22" font-weight="800" fill="${INK}" text-anchor="middle">来源可溯</text>
  </g>

  <!-- 底部 CTA -->
  <text x="80" y="486" font-size="38" font-weight="900" fill="${INK}">你是 16 型里的哪一型？</text>
  <text x="80" y="534" font-size="23" font-weight="600" fill="#8A8095">扫码或点击链接 · 约 6 分钟 · 免费</text>
</g>

<!-- 右侧头像阵列（2×2 错落排布） -->
${inlineAvatar(FEATURED[0], 880, 210, 210, -8)}
${inlineAvatar(FEATURED[1], 1070, 320, 190, 7)}
${inlineAvatar(FEATURED[2], 850, 430, 190, 5)}
${inlineAvatar(FEATURED[3], 1046, 520, 165, -6)}
</svg>`;

const outSvg = path.join(ROOT, 'assets/og-cover.svg');
fs.writeFileSync(outSvg, svg, 'utf8');

console.log('✅ 已生成 assets/og-cover.svg  (' + (svg.length / 1024).toFixed(1) + ' KB)');
console.log('   尺寸 ' + W + '×' + H + '（社交平台标准 1.91:1）');
console.log('   featured: ' + FEATURED.map(t => api.ANIMAL_SPEC[t].animal).join(' / '));
console.log('');
console.log('转 PNG（og:image 建议用 PNG，微信兼容性更好）：');
console.log('  brew install librsvg');
console.log('  rsvg-convert -w 1200 -h 630 assets/og-cover.svg -o assets/og-cover.png');
console.log('');
console.log('无 librsvg 时的替代方案：');
console.log('  浏览器打开 assets/og-cover.svg → 截图另存为 assets/og-cover.png');
