/* ============================================================
 *  SVG 卡通头像系统
 *
 *  为什么不用 emoji：
 *  emoji 在 iOS / Android / Windows 上字形完全不同，无法保证视觉一致，
 *  且在 Canvas 分享图里渲染质量不可控。改为程序化 SVG 后：
 *  - 全平台完全一致
 *  - 任意尺寸无损缩放
 *  - 可参与 Canvas 绘制（转 Path 或 drawImage）
 *
 *  设计语言：厚描边（stroke-width 相对固定）+ 扁平色块 + 圆润造型
 *  参数化组合：底色 / 脸型 / 发型 / 眼睛 / 嘴 / 配饰
 *  所有头像统一 viewBox="0 0 100 100"，脸中心 (50,52)
 * ============================================================ */

/* ---------- 调色板 ---------- */
const AV_C = {
  line:  '#2B2233',
  skin:  '#FFE0C4',
  skin2: '#F7CDA8',
  white: '#FFFFFF',
  // 主题色
  purple:'#B99CF0', mint:'#7DDCC0', sky:'#8FC9F5', gold:'#FFD84D',
  coral: '#FF8A6B', pink:'#FF9EC4', green:'#6FCF97', brown:'#C89B72',
  gray:  '#C9C4D2', teal:'#5FC9C0', olive:'#A8C256', navy:'#7B96D4',
  cream: '#FFF3D6', rose:'#F2A0B5', sand:'#E8C79A', slate:'#9AA5B8'
};

/* ============================================================
 *  零件库：每个函数返回 SVG 片段字符串
 * ============================================================ */

/* ---------- 头发 ---------- */
const AV_HAIR = {
  // 光头/极短
  none: () => '',
  // 短平头
  short: c => `<path d="M26 44c0-15 11-24 24-24s24 9 24 24c0-6-8-9-24-9s-24 3-24 9z" fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round"/>`,
  // 蓬松卷发
  curly: c => `<g fill="${c}" stroke="${AV_C.line}" stroke-width="3">
    <circle cx="32" cy="34" r="10"/><circle cx="50" cy="28" r="11"/><circle cx="68" cy="34" r="10"/>
    <circle cx="26" cy="46" r="8"/><circle cx="74" cy="46" r="8"/></g>`,
  // 长直发
  long: c => `<path d="M24 46c0-16 12-26 26-26s26 10 26 26v26c0 3-3 5-6 4-2-1-3-3-3-6V44c0-4-7-7-17-7s-17 3-17 7v26c0 3-1 5-3 6-3 1-6-1-6-4z" fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round"/>`,
  // 波波头
  bob: c => `<path d="M24 48c0-17 12-28 26-28s26 11 26 28v14c0 3-2 5-5 5s-4-2-4-5V46c0-4-7-8-17-8s-17 4-17 8v16c0 3-1 5-4 5s-5-2-5-5z" fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round"/>`,
  // 侧分
  side: c => `<path d="M25 45c0-15 11-25 25-25 14 0 25 8 25 22 0-4-14-10-30-6-9 2-14 6-20 9z" fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round"/>`,
  // 冲天辫/呆毛
  spike: c => `<g fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round">
    <path d="M26 44c0-15 11-24 24-24s24 9 24 24c0-6-8-9-24-9s-24 3-24 9z"/>
    <path d="M50 21c-2-8 3-13 6-15-1 5 2 8 4 11z"/></g>`,
  // 丸子头
  bun: c => `<g fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round">
    <circle cx="50" cy="16" r="9"/>
    <path d="M26 45c0-15 11-25 24-25s24 10 24 25c0-6-8-10-24-10s-24 4-24 10z"/></g>`,
  // 长胡子老者（INFP 绿老头那种）
  sage: c => `<g fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round">
    <path d="M24 44c0-16 12-26 26-26s26 10 26 26c0-7-9-11-26-11s-26 4-26 11z"/>
  </g>`,
  // 双马尾
  twin: c => `<g fill="${c}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round">
    <circle cx="21" cy="52" r="9"/><circle cx="79" cy="52" r="9"/>
    <path d="M26 45c0-15 11-25 24-25s24 10 24 25c0-6-8-10-24-10s-24 4-24 10z"/></g>`
};

/* ---------- 眼睛 ---------- */
const AV_EYE = {
  // 圆点眼
  dot: () => `<circle cx="41" cy="54" r="3.4" fill="${AV_C.line}"/><circle cx="59" cy="54" r="3.4" fill="${AV_C.line}"/>`,
  // 带高光的大眼
  bright: () => `<g><circle cx="41" cy="54" r="4.4" fill="${AV_C.line}"/><circle cx="59" cy="54" r="4.4" fill="${AV_C.line}"/>
    <circle cx="42.6" cy="52.4" r="1.5" fill="#fff"/><circle cx="60.6" cy="52.4" r="1.5" fill="#fff"/></g>`,
  // 微笑眯眼（弯弧）
  happy: () => `<g stroke="${AV_C.line}" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M37 55c2-3 6-3 8 0"/><path d="M55 55c2-3 6-3 8 0"/></g>`,
  // 沉静半闭眼
  calm: () => `<g stroke="${AV_C.line}" stroke-width="3" stroke-linecap="round" fill="none">
    <path d="M36 54h9"/><path d="M55 54h9"/></g>`,
  // 锐利眼（斜上）
  sharp: () => `<g><path d="M36 51l9 3-9 2z" fill="${AV_C.line}"/><path d="M64 51l-9 3 9 2z" fill="${AV_C.line}"/></g>`,
  // 戴眼镜
  glasses: () => `<g><circle cx="41" cy="54" r="3.2" fill="${AV_C.line}"/><circle cx="59" cy="54" r="3.2" fill="${AV_C.line}"/>
    <g fill="none" stroke="${AV_C.line}" stroke-width="2.6"><circle cx="41" cy="54" r="8"/><circle cx="59" cy="54" r="8"/><path d="M49 54h2"/></g></g>`,
  // 星星眼
  star: () => `<g fill="${AV_C.line}"><path d="M41 49l1.4 3.4 3.6.3-2.7 2.4.8 3.5-3.1-1.9-3.1 1.9.8-3.5-2.7-2.4 3.6-.3z"/>
    <path d="M59 49l1.4 3.4 3.6.3-2.7 2.4.8 3.5-3.1-1.9-3.1 1.9.8-3.5-2.7-2.4 3.6-.3z"/></g>`,
  // 温和垂眼
  gentle: () => `<g><ellipse cx="41" cy="55" rx="3.4" ry="3.8" fill="${AV_C.line}"/><ellipse cx="59" cy="55" rx="3.4" ry="3.8" fill="${AV_C.line}"/>
    <g stroke="${AV_C.line}" stroke-width="2.4" stroke-linecap="round"><path d="M36 48c2-1.5 5-2 7-1"/><path d="M64 48c-2-1.5-5-2-7-1"/></g></g>`
};

/* ---------- 嘴 ---------- */
const AV_MOUTH = {
  smile: () => `<path d="M44 64c2 3 10 3 12 0" stroke="${AV_C.line}" stroke-width="3" stroke-linecap="round" fill="none"/>`,
  grin:  () => `<path d="M42 62c3 6 13 6 16 0z" fill="${AV_C.line}"/>`,
  small: () => `<path d="M47 64h6" stroke="${AV_C.line}" stroke-width="3" stroke-linecap="round"/>`,
  calm:  () => `<path d="M46 64c2 1.6 6 1.6 8 0" stroke="${AV_C.line}" stroke-width="2.8" stroke-linecap="round" fill="none"/>`,
  open:  () => `<ellipse cx="50" cy="64" rx="4.6" ry="4" fill="${AV_C.line}"/>`,
  flat:  () => `<path d="M45 64h10" stroke="${AV_C.line}" stroke-width="2.8" stroke-linecap="round"/>`,
  // 被胡子遮住时用的微小嘴
  hidden: () => ''
};

/* ---------- 配饰 ---------- */
const AV_ACC = {
  none: () => '',
  // 长白胡子（老者感，INFP 绿老头风格）
  beard: c => `<g fill="${c || '#F0EDE8'}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round">
    <path d="M35 62c0 14 7 24 15 24s15-10 15-24c0 6-7 9-15 9s-15-3-15-9z"/></g>`,
  // 腮红
  blush: () => `<g fill="#FF9EC4" opacity=".65"><ellipse cx="32" cy="61" rx="5" ry="3.4"/><ellipse cx="68" cy="61" rx="5" ry="3.4"/></g>`,
  // 皇冠
  crown: () => `<path d="M36 26l4 7 5-9 5 9 5-9 5 9 4-7v8H36z" fill="${AV_C.gold}" stroke="${AV_C.line}" stroke-width="2.8" stroke-linejoin="round"/>`,
  // 头顶小叶子
  leaf: () => `<g stroke="${AV_C.line}" stroke-width="2.6" stroke-linejoin="round"><path d="M50 20c0-6 4-10 9-11-1 7-4 10-9 11z" fill="${AV_C.green}"/></g>`,
  // 耳机
  headset: () => `<g fill="none" stroke="${AV_C.line}" stroke-width="3"><path d="M27 52a23 23 0 0146 0"/>
    <rect x="21" y="50" width="9" height="14" rx="4" fill="${AV_C.slate}"/><rect x="70" y="50" width="9" height="14" rx="4" fill="${AV_C.slate}"/></g>`,
  // 围巾
  scarf: c => `<path d="M32 78c5 4 11 6 18 6s13-2 18-6v6c-5 4-11 6-18 6s-13-2-18-6z" fill="${c || AV_C.coral}" stroke="${AV_C.line}" stroke-width="3" stroke-linejoin="round"/>`,
  // 单片眼镜（monocle）
  monocle: () => `<g fill="none" stroke="${AV_C.line}" stroke-width="2.6"><circle cx="59" cy="54" r="9"/><path d="M59 63v8"/></g>`,
  // 小花
  flower: c => `<g stroke="${AV_C.line}" stroke-width="2.4"><g fill="${c || AV_C.pink}">
    <circle cx="70" cy="30" r="3.4"/><circle cx="76" cy="30" r="3.4"/><circle cx="73" cy="25" r="3.4"/><circle cx="73" cy="35" r="3.4"/></g>
    <circle cx="73" cy="30" r="2.2" fill="${AV_C.gold}"/></g>`
};

/* ============================================================
 *  头像装配
 * ============================================================ */

/**
 * 生成 SVG 头像
 * @param {Object} cfg { bg, hair:[type,color], eye, mouth, acc:[type,color], skin }
 * @param {number} size 像素尺寸
 * @param {boolean} withRing 是否带厚描边圆框（列表场景用）
 */
function avatarSVG(cfg, size = 100, withRing = true) {
  const skin = cfg.skin || AV_C.skin;
  const [hairType, hairColor] = cfg.hair || ['short', '#3E3546'];
  const [accType, accColor] = cfg.acc || ['none', null];

  const ring = withRing
    ? `<circle cx="50" cy="50" r="47" fill="${cfg.bg}" stroke="${AV_C.line}" stroke-width="3.5"/>`
    : `<circle cx="50" cy="50" r="48.5" fill="${cfg.bg}"/>`;

  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="av">
  ${ring}
  <!-- 耳朵 -->
  <circle cx="27" cy="55" r="5" fill="${skin}" stroke="${AV_C.line}" stroke-width="2.6"/>
  <circle cx="73" cy="55" r="5" fill="${skin}" stroke="${AV_C.line}" stroke-width="2.6"/>
  <!-- 脸 -->
  <path d="M30 50c0-12 9-20 20-20s20 8 20 20v9c0 12-9 20-20 20s-20-8-20-20z"
        fill="${skin}" stroke="${AV_C.line}" stroke-width="3.2" stroke-linejoin="round"/>
  ${accType === 'beard' ? AV_ACC.beard(accColor) : ''}
  ${AV_HAIR[hairType] ? AV_HAIR[hairType](hairColor) : ''}
  ${cfg.blush ? AV_ACC.blush() : ''}
  ${AV_EYE[cfg.eye] ? AV_EYE[cfg.eye]() : AV_EYE.dot()}
  ${AV_MOUTH[cfg.mouth] ? AV_MOUTH[cfg.mouth]() : AV_MOUTH.smile()}
  ${accType !== 'none' && accType !== 'beard' && AV_ACC[accType] ? AV_ACC[accType](accColor) : ''}
</svg>`;
}


/* ============================================================
 *  16 型人格头像配置
 *  形象设定思路：气质对应外观，让人一眼觉得「这就是我」
 * ============================================================ */
const AVATAR_MBTI = {
  // 分析家 NT —— 紫色系，理性冷静
  INTJ: { bg:'#D8C9F5', hair:['short','#2F2A3D'], eye:'sharp',   mouth:'flat',  acc:['none'] },
  INTP: { bg:'#E2D6FA', hair:['spike','#4A4159'], eye:'glasses', mouth:'small', acc:['none'] },
  ENTJ: { bg:'#C9B3F0', hair:['side','#2B2536'],  eye:'sharp',   mouth:'grin',  acc:['none'] },
  ENTP: { bg:'#DCCBF7', hair:['spike','#5A4A3A'], eye:'bright',  mouth:'grin',  acc:['none'] },

  // 外交家 NF —— 绿色系，温暖理想（INFP 就是这里的「绿老头」）
  INFJ: { bg:'#C4E8DA', hair:['long','#33304A'],  eye:'calm',    mouth:'calm',  acc:['none'] },
  INFP: { bg:'#B8E6CE', hair:['sage','#EDF2EA'],  eye:'gentle',  mouth:'hidden', acc:['beard','#F2F6F0'], skin:'#FFE4CC' },
  ENFJ: { bg:'#A8E0C4', hair:['bob','#4A3B2E'],   eye:'happy',   mouth:'smile', acc:['flower','#FF9EC4'], blush:true },
  ENFP: { bg:'#CFF0DE', hair:['curly','#C4713D'], eye:'star',    mouth:'grin',  acc:['none'], blush:true },

  // 守护者 SJ —— 蓝色系，稳重可靠
  ISTJ: { bg:'#C5DFF5', hair:['short','#3A3A44'], eye:'calm',    mouth:'flat',  acc:['none'] },
  ISFJ: { bg:'#D4E9FA', hair:['bob','#5C4436'],   eye:'gentle',  mouth:'calm',  acc:['none'], blush:true },
  ESTJ: { bg:'#AFD3F2', hair:['side','#33333D'],  eye:'sharp',   mouth:'flat',  acc:['none'] },
  ESFJ: { bg:'#DCEEFB', hair:['bun','#6B4A32'],   eye:'happy',   mouth:'grin',  acc:['none'], blush:true },

  // 探险家 SP —— 橙黄系，灵活行动
  ISTP: { bg:'#FBDFB0', hair:['short','#2F2B33'], eye:'calm',    mouth:'small', acc:['none'] },
  ISFP: { bg:'#FDE9C7', hair:['long','#7A5C3E'],  eye:'gentle',  mouth:'calm',  acc:['flower','#F2A0B5'] },
  ESTP: { bg:'#FFD59B', hair:['spike','#2B2733'], eye:'bright',  mouth:'grin',  acc:['none'] },
  ESFP: { bg:'#FFE7BC', hair:['twin','#5A3E2B'],  eye:'star',    mouth:'open',  acc:['none'], blush:true }
};

/* ---------- 12 星座头像 ---------- */
const AVATAR_ZODIAC = {
  aries:      { bg:'#FFD0C4', hair:['spike','#C4482B'], eye:'sharp',  mouth:'grin',  acc:['none'] },
  taurus:     { bg:'#E8DCC0', hair:['short','#6B5335'], eye:'calm',   mouth:'flat',  acc:['none'] },
  gemini:     { bg:'#D6ECFA', hair:['twin','#8A6B45'],  eye:'bright', mouth:'grin',  acc:['none'] },
  cancer:     { bg:'#CFEDE4', hair:['bob','#4A4034'],   eye:'gentle', mouth:'calm',  acc:['none'], blush:true },
  leo:        { bg:'#FFDE9E', hair:['curly','#D89B3C'], eye:'bright', mouth:'grin',  acc:['crown'] },
  virgo:      { bg:'#DDEAD0', hair:['long','#5A4A38'],  eye:'glasses',mouth:'small', acc:['none'] },
  libra:      { bg:'#F2E0F0', hair:['bob','#7A5A44'],   eye:'happy',  mouth:'smile', acc:['none'] },
  scorpio:    { bg:'#D5CBE8', hair:['side','#2B2536'],  eye:'sharp',  mouth:'flat',  acc:['none'] },
  sagittarius:{ bg:'#FFE0B8', hair:['spike','#A0642F'], eye:'star',   mouth:'grin',  acc:['none'] },
  capricorn:  { bg:'#D8D8E4', hair:['short','#42404C'], eye:'calm',   mouth:'flat',  acc:['none'] },
  aquarius:   { bg:'#CFE8F5', hair:['curly','#5A7A9A'], eye:'glasses',mouth:'small', acc:['none'] },
  pisces:     { bg:'#DAE8F7', hair:['long','#6B7FA8'],  eye:'gentle', mouth:'calm',  acc:['none'], blush:true }
};

/* ---------- 10 天干头像 ---------- */
const AVATAR_STEM = {
  '甲': { bg:'#C8E6C0', hair:['short','#3D5A32'], eye:'sharp',  mouth:'flat',  acc:['leaf'] },
  '乙': { bg:'#DCEFD4', hair:['long','#5A7A48'],  eye:'gentle', mouth:'calm',  acc:['leaf'] },
  '丙': { bg:'#FFD4B8', hair:['spike','#C4522B'], eye:'bright', mouth:'grin',  acc:['none'] },
  '丁': { bg:'#FFE4CC', hair:['bob','#8A5033'],   eye:'happy',  mouth:'smile', acc:['none'], blush:true },
  '戊': { bg:'#E4D5BC', hair:['short','#6B5533'], eye:'calm',   mouth:'flat',  acc:['none'] },
  '己': { bg:'#EFE2CA', hair:['bun','#7A6042'],   eye:'gentle', mouth:'calm',  acc:['none'], blush:true },
  '庚': { bg:'#D8DCE4', hair:['side','#3A3E48'],  eye:'sharp',  mouth:'flat',  acc:['none'] },
  '辛': { bg:'#E8EAF0', hair:['bob','#5A5E6B'],   eye:'glasses',mouth:'small', acc:['monocle'] },
  '壬': { bg:'#C4DEF2', hair:['curly','#3E5A7A'], eye:'bright', mouth:'grin',  acc:['none'] },
  '癸': { bg:'#D8E8F5', hair:['long','#4A6280'],  eye:'calm',   mouth:'calm',  acc:['none'] }
};

/* ---------- 16 人格原型头像 ---------- */
const AVATAR_ARCHETYPE = {
  '开拓型': { bg:'#FFD9A8', hair:['spike','#C4602B'], eye:'star',   mouth:'grin',  acc:['none'] },
  '统筹型': { bg:'#C4D9F2', hair:['side','#33384A'],  eye:'sharp',  mouth:'flat',  acc:['none'] },
  '凝聚型': { bg:'#FFD4DE', hair:['curly','#8A5540'], eye:'happy',  mouth:'grin',  acc:['none'], blush:true },
  '架构型': { bg:'#D0C8F0', hair:['short','#3A3450'], eye:'glasses',mouth:'small', acc:['none'] },
  '创作型': { bg:'#F5D4E8', hair:['long','#7A4A6B'],  eye:'gentle', mouth:'calm',  acc:['flower','#C4A9F5'] },
  '共情型': { bg:'#C8E8D8', hair:['bob','#4A5A42'],   eye:'gentle', mouth:'smile', acc:['leaf'], blush:true },
  '定盘型': { bg:'#C8D8E8', hair:['short','#3A4450'], eye:'calm',   mouth:'flat',  acc:['none'] },
  '执行型': { bg:'#D8DCE0', hair:['short','#2F333A'], eye:'sharp',  mouth:'flat',  acc:['none'] },
  '守护型': { bg:'#D4E4F5', hair:['bun','#5A4636'],   eye:'gentle', mouth:'calm',  acc:['none'], blush:true },
  '思辨型': { bg:'#D4C8EE', hair:['spike','#463C58'], eye:'glasses',mouth:'small', acc:['none'] },
  '笃行型': { bg:'#CDE4CC', hair:['short','#42543A'], eye:'calm',   mouth:'calm',  acc:['none'] },
  '陪伴型': { bg:'#D8ECD8', hair:['bob','#5A4A3A'],   eye:'happy',  mouth:'smile', acc:['none'], blush:true },
  '内省型': { bg:'#CCC8E4', hair:['long','#3E3A52'],  eye:'calm',   mouth:'small', acc:['none'] },
  '冷静型': { bg:'#D0DCE8', hair:['side','#39414D'],  eye:'sharp',  mouth:'flat',  acc:['monocle'] },
  '灵活型': { bg:'#FFE0B0', hair:['spike','#B0722F'], eye:'bright', mouth:'grin',  acc:['none'] },
  '自由型': { bg:'#D8E8F0', hair:['curly','#6B7A5A'], eye:'star',   mouth:'grin',  acc:['none'] },
  '均衡型': { bg:'#E4E0EC', hair:['short','#4A4658'], eye:'calm',   mouth:'calm',  acc:['none'] }
};

/* ============================================================
 *  对外接口
 * ============================================================ */

function mbtiAvatar(type, size = 100, ring = true) {
  const cfg = AVATAR_MBTI[type];
  return cfg ? avatarSVG(cfg, size, ring) : '';
}
function zodiacAvatar(key, size = 100, ring = true) {
  const cfg = AVATAR_ZODIAC[key];
  return cfg ? avatarSVG(cfg, size, ring) : '';
}
function stemAvatar(cn, size = 100, ring = true) {
  const cfg = AVATAR_STEM[cn];
  return cfg ? avatarSVG(cfg, size, ring) : '';
}
function archetypeAvatar(name, size = 100, ring = true) {
  const cfg = AVATAR_ARCHETYPE[name] || AVATAR_ARCHETYPE['均衡型'];
  return avatarSVG(cfg, size, ring);
}

/**
 * SVG 转 Image 对象（供 Canvas 分享图使用）
 * @returns {Promise<HTMLImageElement>}
 */
function svgToImage(svgStr, px = 300) {
  return new Promise((resolve, reject) => {
    // 放大到目标像素以保证 Canvas 内清晰
    const sized = svgStr.replace(/width="\d+" height="\d+"/, `width="${px}" height="${px}"`);
    const blob = new Blob([sized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = e => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}
