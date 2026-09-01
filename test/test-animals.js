const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const src = fs.readFileSync(B + 'assets/js/animals.js', 'utf8');
const api = new Function(src + `; return {animalAvatar, animalAvatar512, animalAvatar128,
  ANIMAL_SPEC, aniPattern, aniEars, aniEye, aniBrow, aniMouth, aniAcc};`)();

let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ✅ ' + m)) : (fail++, console.log('  ❌ ' + m)); };

const S = api.ANIMAL_SPEC;
const ALL = Object.keys(S);

console.log('\n========== 1. 覆盖完整性 ==========');
ok(ALL.length === 16, '16 型全覆盖，实得 ' + ALL.length);
// 校验 MBTI 代码合法
const valid = [];
'EI'.split('').forEach(a => 'SN'.split('').forEach(b =>
  'TF'.split('').forEach(c => 'JP'.split('').forEach(d => valid.push(a+b+c+d)))));
const missing = valid.filter(v => !S[v]);
ok(missing.length === 0, '无缺失型' + (missing.length ? ': '+missing.join(',') : ''));

// 群组各 4 型
const gc = {};
ALL.forEach(k => gc[S[k].group] = (gc[S[k].group]||0)+1);
ok(Object.keys(gc).length === 4 && Object.values(gc).every(v => v === 4),
   '四群组各 4 型: ' + JSON.stringify(gc));

console.log('\n========== 2. 设定表字段完整 ==========');
const need = ['animal','emoji','group','main','bg','body','shade','accent',
              'pattern','ears','eye','brow','mouth','acc','trait'];
let fieldBad = 0;
ALL.forEach(k => {
  need.forEach(f => {
    if (S[k][f] === undefined || S[k][f] === '') {
      console.log('    ✗ ' + k + ' 缺 ' + f); fieldBad++;
    }
  });
  // 颜色必须是合法 hex
  ['main','bg','body','shade','accent'].forEach(f => {
    if (!/^#[0-9A-Fa-f]{6}$/.test(S[k][f])) {
      console.log('    ✗ ' + k + '.' + f + ' 非法色值: ' + S[k][f]); fieldBad++;
    }
  });
  // 性格关联说明不能太短
  if (S[k].trait.length < 12) { console.log('    ✗ ' + k + ' trait 过短'); fieldBad++; }
});
ok(fieldBad === 0, '16 型 × 15 字段 + 色值格式全部合规');

console.log('\n========== 3. 动物形象唯一性 ==========');
const animals = ALL.map(k => S[k].animal);
ok(new Set(animals).size === 16, '16 个动物形象无重复，实得 ' + new Set(animals).size);
const mains = ALL.map(k => S[k].main);
ok(new Set(mains).size === 16, '16 个主色无重复，实得 ' + new Set(mains).size);
const patterns = ALL.map(k => S[k].pattern);
ok(new Set(patterns).size === 16, '16 种背景图案各不相同，实得 ' + new Set(patterns).size);

console.log('\n========== 4. 零件引用有效性（防止配置指向不存在的零件）==========');
let partBad = 0;
ALL.forEach(k => {
  const sp = S[k];
  if (sp.ears !== 'none' && !api.aniEars(sp.ears,'#000','#000','#000')) {
    console.log('    ✗ ' + k + ' ears="' + sp.ears + '" 未定义'); partBad++;
  }
  if (!api.aniEye(sp.eye)) { console.log('    ✗ ' + k + ' eye="' + sp.eye + '"'); partBad++; }
  if (!api.aniMouth(sp.mouth,'#000')) { console.log('    ✗ ' + k + ' mouth="' + sp.mouth + '"'); partBad++; }
  if (sp.brow !== 'none' && !api.aniBrow(sp.brow)) {
    console.log('    ✗ ' + k + ' brow="' + sp.brow + '" 未定义'); partBad++;
  }
  if (sp.acc !== 'none' && !api.aniAcc(sp.acc, sp)) {
    console.log('    ✗ ' + k + ' acc="' + sp.acc + '" 未定义'); partBad++;
  }
  if (!api.aniPattern(sp.pattern,'#000')) {
    console.log('    ✗ ' + k + ' pattern="' + sp.pattern + '" 未定义'); partBad++;
  }
});
ok(partBad === 0, '所有零件引用都能解析出实际图形');

console.log('\n========== 5. 四种输出规格 ==========');
const VARIANTS = [
  {size:512, shape:'circle'},   {size:512, shape:'squircle'},
  {size:128, shape:'circle'},   {size:128, shape:'squircle'}
];
let specBad = 0;
VARIANTS.forEach(v => {
  ALL.forEach(k => {
    const svg = api.animalAvatar(k, v);
    if (!svg.startsWith('<svg')) { specBad++; return; }
    if (!svg.includes('viewBox="0 0 512 512"')) { console.log('    ✗ '+k+' viewBox 错误'); specBad++; }
    if (!svg.includes(`width="${v.size}"`)) { console.log('    ✗ '+k+' 尺寸未生效'); specBad++; }
    if (svg.length < 1200) { console.log('    ✗ '+k+' 内容过短 '+svg.length); specBad++; }
  });
});
ok(specBad === 0, '16 型 × 4 规格 = 64 个实例全部合法');

// 裁切形状正确
const cir = api.animalAvatar('INFP', {size:512, shape:'circle'});
const sq  = api.animalAvatar('INFP', {size:512, shape:'squircle'});
ok(cir.includes('<circle cx="256" cy="256" r="256"/>'), '圆形裁切用 circle 路径');
ok(sq.includes('rx="112"'), '方形圆角裁切用 rx=112');
ok(cir.includes('stroke-width="16"') && sq.includes('stroke-width="16"'), '两种裁切都有外框描边');

// 128 关闭背景图案
// 注意：不能用 opacity=".26" 判断——面部浅色区也用了同一值。
// 改用背景图案的专属路径数据作为标记。
const s128 = api.animalAvatar128('INTJ','circle');
const s512 = api.animalAvatar512('INTJ','circle');
const STAR_MARK = 'M92 108';   // INTJ 星图图案的首条路径
ok(!s128.includes(STAR_MARK) && s512.includes(STAR_MARK),
   '128 小尺寸关闭背景图案（避免噪点），512 保留');
ok(s128.length < s512.length, '128 版本体积更小（' + s128.length + ' < ' + s512.length + '）');

// 逐型验证图案开关都生效
let patToggleBad = 0;
ALL.forEach(k => {
  const big = api.animalAvatar(k, {size:512, shape:'circle', pattern:true});
  const small = api.animalAvatar(k, {size:128, shape:'circle', pattern:false});
  if (small.length >= big.length) { console.log('    ✗ ' + k + ' 图案未关闭'); patToggleBad++; }
});
ok(patToggleBad === 0, '16 型的 pattern 开关全部生效');

console.log('\n========== 6. 视觉规范一致性 ==========');
let styleBad = 0;
ALL.forEach(k => {
  const svg = api.animalAvatar512(k, 'circle');
  // 统一描边色
  if (!svg.includes('#2B2233')) { console.log('    ✗ '+k+' 缺统一描边色'); styleBad++; }
  // 圆角处理
  if (!svg.includes('stroke-linejoin="round"')) { console.log('    ✗ '+k+' 缺圆角 linejoin'); styleBad++; }
  // 头部中心位置一致
  if (!svg.includes('cx="256" cy="236"')) { console.log('    ✗ '+k+' 头部位置不一致'); styleBad++; }
  // 不允许出现纯黑（生硬）
  if (/#000000|"black"/.test(svg)) { console.log('    ✗ '+k+' 出现纯黑'); styleBad++; }
});
ok(styleBad === 0, '16 型描边色/圆角/头部位置完全统一，且无纯黑');

console.log('\n========== 7. 设计规则校验 ==========');
// 眉毛仅 T 型使用
const withBrow = ALL.filter(k => S[k].brow !== 'none');
const browAllT = withBrow.every(k => k[2] === 'T');
ok(browAllT, '眉毛仅用于 T 型（' + withBrow.join(',') + '）');

// 腮红仅 F 型使用
const withBlush = ALL.filter(k => S[k].blush);
const blushAllF = withBlush.every(k => k[2] === 'F');
ok(blushAllF, '腮红仅用于 F 型（' + withBlush.join(',') + '）');
ok(withBlush.length >= 6, 'F 型多数有腮红，实得 ' + withBlush.length + ' 个');

console.log('\n========== 8. 群组配色区分度 ==========');
// 同群组主色应相近（色相接近），跨群组应拉开
function hue(hex) {
  const r = parseInt(hex.slice(1,3),16)/255, g = parseInt(hex.slice(3,5),16)/255, b = parseInt(hex.slice(5,7),16)/255;
  const mx = Math.max(r,g,b), mn = Math.min(r,g,b), d = mx-mn;
  if (d === 0) return 0;
  let h;
  if (mx === r) h = ((g-b)/d) % 6;
  else if (mx === g) h = (b-r)/d + 2;
  else h = (r-g)/d + 4;
  return Math.round(h * 60 + 360) % 360;
}
const groupHues = {};
ALL.forEach(k => {
  const g = S[k].group;
  (groupHues[g] = groupHues[g] || []).push(hue(S[k].main));
});
console.log('  各群组主色色相范围:');
let hueOk = true;
Object.entries(groupHues).forEach(([g, hs]) => {
  const min = Math.min(...hs), max = Math.max(...hs);
  const span = max - min;
  console.log('    ' + g.padEnd(9) + ' ' + min + '° - ' + max + '°  跨度 ' + span + '°');
  if (span > 60) hueOk = false;  // 同组色相跨度不应过大
});
ok(hueOk, '同群组内主色色相跨度均 ≤60°（视觉归属清晰）');

// 跨群组中心色相要拉开
const centers = Object.entries(groupHues).map(([g,hs]) => ({
  g, c: Math.round(hs.reduce((a,b)=>a+b,0)/hs.length)
})).sort((a,b)=>a.c-b.c);
console.log('  群组中心色相: ' + centers.map(x=>x.g+' '+x.c+'°').join(' | '));
let minGap = 360;
for (let i=1;i<centers.length;i++) minGap = Math.min(minGap, centers[i].c - centers[i-1].c);
ok(minGap >= 30, '相邻群组色相间距 ≥30°，实得最小 ' + minGap + '°');

console.log('\n========== 9. 导出产物 ==========');
const distDir = B + 'dist/avatars';
if (fs.existsSync(distDir)) {
  let fileCount = 0;
  VARIANTS.forEach(v => {
    const d = path.join(distDir, `${v.size}-${v.shape}`);
    if (fs.existsSync(d)) fileCount += fs.readdirSync(d).filter(f=>f.endsWith('.svg')).length;
  });
  ok(fileCount === 64, '已导出 64 个 SVG 文件，实得 ' + fileCount);
  ok(fs.existsSync(path.join(distDir,'spec.json')), 'spec.json 设定表已生成');
  // 抽查文件内容
  const sample = fs.readFileSync(path.join(distDir,'512-circle','INFP.svg'),'utf8');
  ok(sample.startsWith('<svg') && sample.includes('data-type="INFP"'), '导出文件内容正确');
  const sz = fs.statSync(path.join(distDir,'512-circle','INFP.svg')).size;
  ok(sz < 8000, '单文件体积 ' + sz + ' bytes（<8KB，适合网页使用）');
} else {
  ok(false, 'dist/avatars 不存在，请先运行 node export-avatars.js');
}

console.log('\n========== 10. 形象设定一览 ==========');
const G = {analyst:'分析家',diplomat:'外交家',sentinel:'守护者',explorer:'探险家'};
['analyst','diplomat','sentinel','explorer'].forEach(g => {
  console.log('\n  【' + G[g] + '】');
  ALL.filter(k => S[k].group===g).forEach(k => {
    console.log('    ' + k + '  ' + S[k].emoji + ' ' + S[k].animal.padEnd(7) + '  ' + S[k].main);
  });
});

console.log('\n' + '='.repeat(50));
console.log('  通过 ' + pass + ' 项，失败 ' + fail + ' 项');
console.log('='.repeat(50));
process.exit(fail ? 1 : 0);
