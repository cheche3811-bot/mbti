#!/usr/bin/env node
/* ============================================================
 *  头像导出工具
 *
 *  把 16 型动物头像导出为独立 SVG 文件，
 *  按「尺寸 / 裁切形状」分目录，便于直接取用或转 PNG。
 *
 *  用法：
 *    node export-avatars.js              # 导出全部
 *    node export-avatars.js INFP         # 只导出指定类型
 *
 *  输出结构：
 *    dist/avatars/512-circle/INFP.svg
 *    dist/avatars/512-squircle/INFP.svg
 *    dist/avatars/128-circle/INFP.svg
 *    dist/avatars/128-squircle/INFP.svg
 *
 *  转 PNG（需系统装有 rsvg-convert 或 Inkscape）：
 *    rsvg-convert -w 512 -h 512 INFP.svg -o INFP.png
 *    或用浏览器打开 animal-preview.html 右键另存
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const src = fs.readFileSync(path.join(ROOT, 'assets/js/animals.js'), 'utf8');
const api = new Function(src + '; return {animalAvatar, ANIMAL_SPEC};')();

const only = process.argv[2] ? process.argv[2].toUpperCase() : null;
const types = Object.keys(api.ANIMAL_SPEC).filter(t => !only || t === only);

if (!types.length) {
  console.error('❌ 未找到类型: ' + only);
  console.error('   可用: ' + Object.keys(api.ANIMAL_SPEC).join(' '));
  process.exit(1);
}

const VARIANTS = [
  { size: 512, shape: 'circle',   pattern: true  },
  { size: 512, shape: 'squircle', pattern: true  },
  { size: 128, shape: 'circle',   pattern: false },
  { size: 128, shape: 'squircle', pattern: false }
];

let count = 0;
VARIANTS.forEach(v => {
  const dir = path.join(ROOT, 'dist', 'avatars', `${v.size}-${v.shape}`);
  fs.mkdirSync(dir, { recursive: true });

  types.forEach(t => {
    const svg = api.animalAvatar(t, v);
    fs.writeFileSync(path.join(dir, t + '.svg'), svg, 'utf8');
    count++;
  });
  console.log(`✓ ${v.size}×${v.size} ${v.shape.padEnd(9)} → ${types.length} 个文件`);
});

/* 附带一份设定表 JSON，便于程序化取用 */
const specOut = {};
types.forEach(t => {
  const s = api.ANIMAL_SPEC[t];
  specOut[t] = {
    animal: s.animal, emoji: s.emoji, group: s.group,
    colors: { main: s.main, bg: s.bg, body: s.body, shade: s.shade, accent: s.accent },
    elements: { ears: s.ears, eye: s.eye, brow: s.brow, mouth: s.mouth, acc: s.acc, pattern: s.pattern, blush: !!s.blush },
    trait: s.trait
  };
});
const jsonPath = path.join(ROOT, 'dist', 'avatars', 'spec.json');
fs.writeFileSync(jsonPath, JSON.stringify(specOut, null, 2), 'utf8');

console.log('');
console.log(`✅ 共导出 ${count} 个 SVG 文件 + spec.json`);
console.log(`   位置: dist/avatars/`);
console.log('');
console.log('转 PNG 提示：');
console.log('  brew install librsvg  然后');
console.log('  for f in dist/avatars/512-circle/*.svg; do rsvg-convert -w 512 -h 512 "$f" -o "${f%.svg}.png"; done');
