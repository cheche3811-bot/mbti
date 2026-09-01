#!/usr/bin/env node
/* ============================================================
 *  数据打包脚本
 *  把 assets/data/*.json 打包成 assets/js/data-bundle.js
 *
 *  为什么需要这一步：
 *  JSON 是唯一数据源（便于校验与扩展），但浏览器在 file:// 协议下
 *  fetch() 本地 JSON 会被 CORS 策略拦截，导致双击 index.html 无法运行。
 *  打包成 JS 全局变量后，双击即可用，同时 GitHub Pages 上也正常。
 *
 *  修改 JSON 后执行：node build-data.js
 * ============================================================ */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'assets', 'data');
const OUT_FILE = path.join(__dirname, 'assets', 'js', 'data-bundle.js');

const FILES = [
  { file: 'traits.json',  varName: 'TRAITS_DATA' },
  { file: 'zodiac.json',  varName: 'ZODIAC_DATA' },
  { file: 'bazi.json',    varName: 'BAZI_DATA' },
  { file: 'profile.json', varName: 'PROFILE_DATA' },
  { file: 'share-copy.json', varName: 'SHARE_COPY_DATA' },
  { file: 'sources.json', varName: 'SOURCES_DATA' }
];

let out = `/* ============================================================
 * 自动生成文件 —— 请勿直接编辑
 * 数据源：assets/data/*.json
 * 重新生成：node build-data.js
 * 生成时间：${new Date().toISOString()}
 * ============================================================ */

`;

let totalBytes = 0;

FILES.forEach(({ file, varName }) => {
  const full = path.join(DATA_DIR, file);
  const raw = fs.readFileSync(full, 'utf8');

  // 校验 JSON 合法性
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    console.error(`❌ ${file} JSON 解析失败: ${e.message}`);
    process.exit(1);
  }

  totalBytes += raw.length;
  out += `/* ---------- ${file} ---------- */\n`;
  out += `const ${varName} = ${JSON.stringify(parsed)};\n\n`;
  console.log(`✓ ${file.padEnd(16)} → ${varName.padEnd(14)} (${(raw.length / 1024).toFixed(1)} KB)`);
});

fs.writeFileSync(OUT_FILE, out, 'utf8');

console.log('');
console.log(`✅ 已生成 assets/js/data-bundle.js`);
console.log(`   源数据 ${(totalBytes / 1024).toFixed(1)} KB → 打包后 ${(out.length / 1024).toFixed(1)} KB`);
