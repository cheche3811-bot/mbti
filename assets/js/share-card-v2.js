/* ============================================================
 *  分享图 V2 · 视觉重构
 *
 *  1080 × 1920（9:16，朋友圈单图不裁切）
 *
 *  ── 版式：三段式黄金分割 ──
 *  上段 0–46%   视觉焦点区：动物头像 + 原型名（截图只截上半也成立）
 *  中段 46–80%  数据亮点区：成就徽章带 + 五维条
 *  下段 80–100% 品牌区：字标 + 装饰 + CTA
 *
 *  ── 字体层级（严格四级）──
 *  L1 原型名     112px / 900  — 唯一主角
 *  L2 金句       40px  / 800  — 反白黑卡
 *  L3 徽章/数据  30px  / 800
 *  L4 说明/品牌  24px  / 600
 *
 *  ── 留白规则 ──
 *  左右安全边距 84px，段间距 ≥56px，卡内 padding ≥40px
 *  焦点区上下留白刻意放大，制造呼吸感
 *
 *  ── 品牌识别 ──
 *  ◈ 菱形 mark + TRI·PERSONA 字标 + 四角装饰线
 * ============================================================ */

const V2_W = 1080, V2_H = 2020;
const V2_PAD = 84;              // 左右安全边距
const V2_INNER = V2_W - V2_PAD * 2;

/* ---------- 基础绘图 ---------- */

function v2RR(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* 贴纸块 */
function v2Card(c, x, y, w, h, r, fill, ink, lw = 6, off = 10) {
  c.fillStyle = ink;
  v2RR(c, x + off, y + off, w, h, r); c.fill();
  c.fillStyle = fill;
  v2RR(c, x, y, w, h, r); c.fill();
  c.lineWidth = lw; c.strokeStyle = ink;
  v2RR(c, x, y, w, h, r); c.stroke();
}

/* 胶囊 */
function v2Pill(c, x, y, w, h, fill, ink, lw = 5, off = 7) {
  v2Card(c, x, y, w, h, h / 2, fill, ink, lw, off);
}

const V2F = (size, weight = 900) =>
  `${weight} ${size}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;

/* 测量换行行数 */
function v2Lines(c, text, maxW) {
  const chars = [...text];
  let line = '', n = 1;
  for (const ch of chars) {
    if (ch === '\n') { n++; line = ''; continue; }
    const t = line + ch;
    if (c.measureText(t).width > maxW && line) { n++; line = ch; }
    else line = t;
  }
  return n;
}

/* 绘制换行文本，返回结束 y */
function v2Wrap(c, text, cx, y, maxW, lh) {
  const chars = [...text];
  let line = '', cy = y;
  c.textAlign = 'center';
  for (const ch of chars) {
    if (ch === '\n') { c.fillText(line, cx, cy); line = ''; cy += lh; continue; }
    const t = line + ch;
    if (c.measureText(t).width > maxW && line) {
      c.fillText(line, cx, cy); line = ch; cy += lh;
    } else line = t;
  }
  if (line) { c.fillText(line, cx, cy); cy += lh; }
  return cy;
}


/* ============================================================
 *  装饰元素（品牌识别）
 * ============================================================ */

/* 四角装饰线 —— 强化"卡片"感与品牌统一性 */
function v2Corners(c, color) {
  const L = 62, T = 8, m = 46;
  c.strokeStyle = color; c.lineWidth = T; c.lineCap = 'round';
  const corners = [
    [m, m, 1, 1], [V2_W - m, m, -1, 1],
    [m, V2_H - m, 1, -1], [V2_W - m, V2_H - m, -1, -1]
  ];
  corners.forEach(([x, y, dx, dy]) => {
    c.beginPath();
    c.moveTo(x + dx * L, y); c.lineTo(x, y); c.lineTo(x, y + dy * L);
    c.stroke();
  });
}

/* 菱形 mark */
function v2Diamond(c, cx, cy, r, fill, ink) {
  c.beginPath();
  c.moveTo(cx, cy - r); c.lineTo(cx + r, cy);
  c.lineTo(cx, cy + r); c.lineTo(cx - r, cy);
  c.closePath();
  c.fillStyle = fill; c.fill();
  if (ink) { c.lineWidth = 4; c.strokeStyle = ink; c.stroke(); }
}

/* 顶部装饰条纹（品牌视觉锚点） */
function v2TopBar(c, theme) {
  const colors = [theme.accent, theme.deco, '#7DDCC0', '#8FC9F5', '#C4A9F5'];
  const barH = 14;
  const seg = V2_W / colors.length;
  colors.forEach((col, i) => {
    c.fillStyle = col;
    c.fillRect(i * seg, 0, seg + 1, barH);
  });
}

/* 网点纹理 */
function v2Dots(c, ink, alpha) {
  c.fillStyle = ink;
  c.globalAlpha = alpha;
  for (let y = 30; y < V2_H; y += 42) {
    for (let x = 30; x < V2_W; x += 42) {
      c.beginPath(); c.arc(x, y, 2.8, 0, 7); c.fill();
    }
  }
  c.globalAlpha = 1;
}


/* ============================================================
 *  主函数
 * ============================================================ */

/**
 * 生成分享图 V2
 * @param {Object} syn  synthesize() 结果
 * @param {Object} prof buildProfile() 结果
 * @param {Object} input 原始输入
 * @param {Object} opt { theme: themeObj|null }
 */
async function buildShareCardV2(syn, prof, input, opt = {}) {
  const cv = document.createElement('canvas');
  cv.width = V2_W; cv.height = V2_H;
  const c = cv.getContext('2d');

  const arc = prof.archetype;
  const theme = opt.theme || pickTheme();
  const ink = theme.ink;
  const isDark = theme.id === 'night';
  const BRAND = SHARE_COPY_DATA.brand;

  // 徽章
  const vars = buildVars(syn, prof, input);
  const badges = calcBadges(vars).slice(0, 3);

  /* ================= 背景 ================= */
  c.fillStyle = theme.bg;
  c.fillRect(0, 0, V2_W, V2_H);

  // 上段色带（视觉焦点区背景）
  const FOCUS_H = Math.round(V2_H * 0.46);
  const g = c.createLinearGradient(0, 0, 0, FOCUS_H);
  g.addColorStop(0, theme.band);
  g.addColorStop(1, theme.bg);
  c.fillStyle = g;
  c.fillRect(0, 0, V2_W, FOCUS_H);

  v2Dots(c, isDark ? '#FFFFFF' : ink, isDark ? 0.045 : 0.05);
  v2TopBar(c, theme);
  v2Corners(c, theme.accent);

  /* ================= 上段：视觉焦点 ================= */

  // 品牌小标（顶部）
  c.font = V2F(26, 800);
  c.fillStyle = theme.sub;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  const brandTop = BRAND.mark + '  ' + BRAND.en + '  ' + BRAND.mark;
  c.fillText(brandTop, V2_W / 2, 78);

  // 动物头像 —— 单一视觉焦点
  const AV_CY = 320, AV_R = 156;
  c.fillStyle = ink;
  c.beginPath(); c.arc(V2_W / 2 + 12, AV_CY + 12, AV_R, 0, 7); c.fill();

  let drawn = false;
  const mbtiType = input.mbti ? input.mbti.type : null;
  if (mbtiType && typeof animalAvatar === 'function' && typeof svgToImage === 'function') {
    try {
      const svg = animalAvatar(mbtiType, { size: 512, shape: 'none', pattern: true });
      const img = await svgToImage(svg, AV_R * 2);
      c.save();
      c.beginPath(); c.arc(V2_W / 2, AV_CY, AV_R, 0, 7); c.clip();
      c.drawImage(img, V2_W / 2 - AV_R, AV_CY - AV_R, AV_R * 2, AV_R * 2);
      c.restore();
      drawn = true;
    } catch (e) { /* 降级 */ }
  }
  if (!drawn && typeof archetypeAvatar === 'function' && typeof svgToImage === 'function') {
    try {
      const svg = archetypeAvatar(arc.name, 100, false);
      const img = await svgToImage(svg, AV_R * 2);
      c.save();
      c.beginPath(); c.arc(V2_W / 2, AV_CY, AV_R, 0, 7); c.clip();
      c.drawImage(img, V2_W / 2 - AV_R, AV_CY - AV_R, AV_R * 2, AV_R * 2);
      c.restore();
      drawn = true;
    } catch (e) { /* 降级 */ }
  }
  if (!drawn) {
    c.fillStyle = theme.band;
    c.beginPath(); c.arc(V2_W / 2, AV_CY, AV_R, 0, 7); c.fill();
    c.font = '160px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(arc.face, V2_W / 2, AV_CY + 10);
  }
  c.lineWidth = 8; c.strokeStyle = ink;
  c.beginPath(); c.arc(V2_W / 2, AV_CY, AV_R, 0, 7); c.stroke();

  // 动物形象名（小标签，挂在头像下缘）
  if (mbtiType && typeof ANIMAL_SPEC !== 'undefined' && ANIMAL_SPEC[mbtiType]) {
    const an = ANIMAL_SPEC[mbtiType].animal;
    c.font = V2F(26, 800);
    const aw = c.measureText(an).width + 56;
    v2Pill(c, (V2_W - aw) / 2, AV_CY + AV_R - 26, aw, 56, theme.deco, ink, 4, 6);
    c.fillStyle = '#2B2233';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(an, V2_W / 2, AV_CY + AV_R + 2);
  }

  // L1 原型名 —— 全图唯一 112px
  c.font = V2F(112, 900);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.lineWidth = 14; c.strokeStyle = ink;
  c.strokeText(arc.name, V2_W / 2, 636);
  c.fillStyle = isDark ? theme.accent : '#FFFFFF';
  c.fillText(arc.name, V2_W / 2, 636);

  // L4 原型副标题
  c.font = V2F(30, 700);
  c.fillStyle = theme.sub;
  let y = v2Wrap(c, arc.title, V2_W / 2, 690, V2_INNER - 40, 44);

  /* ================= 中段：数据亮点 ================= */
  let cy = y + 34;

  // L2 金句黑卡
  c.font = V2F(40, 800);
  const qL = v2Lines(c, prof.oneLiner, V2_INNER - 96);
  const qH = 68 + qL * 58;
  v2Card(c, V2_PAD, cy, V2_INNER, qH, 36, ink, ink, 6, 11);
  c.fillStyle = isDark ? '#2B2233' : '#FFF6E5';
  if (isDark) { c.fillStyle = theme.bg === '#2B2233' ? '#FFF6E5' : '#2B2233'; }
  c.fillStyle = '#FFF6E5';
  c.font = V2F(40, 800);
  v2Wrap(c, prof.oneLiner, V2_W / 2, cy + 60, V2_INNER - 96, 58);
  cy += qH + 40;

  // 成就徽章带 —— 核心传播资产
  if (badges.length) {
    const bH = 132;
    const gap = 16;
    const bW = (V2_INNER - gap * (badges.length - 1)) / badges.length;
    badges.forEach((b, i) => {
      const bx = V2_PAD + i * (bW + gap);
      v2Card(c, bx, cy, bW, bH, 26, isDark ? theme.band : '#FFFFFF', ink, 5, 8);

      // 徽章色点
      v2Diamond(c, bx + bW / 2, cy + 34, 15, b.color, ink);

      c.textAlign = 'center'; c.textBaseline = 'middle';
      // L3 徽章名
      c.font = V2F(26, 900);
      c.fillStyle = ink;
      // 长文本自动缩字号
      let fs = 26;
      while (c.measureText(b.label).width > bW - 24 && fs > 18) {
        fs -= 1; c.font = V2F(fs, 900);
      }
      c.fillText(b.label, bx + bW / 2, cy + 76);
      // L4 副文案
      c.font = V2F(20, 600);
      c.fillStyle = theme.sub;
      let fs2 = 20;
      while (c.measureText(b.sub).width > bW - 20 && fs2 > 14) {
        fs2 -= 1; c.font = V2F(fs2, 600);
      }
      c.fillText(b.sub, bx + bW / 2, cy + 106);
    });
    cy += bH + 40;
  }

  // 五维特质条
  const axes = prof.axisDetails;
  const rowH = 74;
  const barCardH = 84 + axes.length * rowH;
  v2Card(c, V2_PAD, cy, V2_INNER, barCardH, 32, isDark ? theme.band : '#FFFFFF', ink, 6, 10);

  c.font = V2F(30, 900);
  c.fillStyle = ink;
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('五维性格特质', V2_PAD + 40, cy + 48);

  // 一致性数字挂在标题右侧（数据亮点）
  if (syn.overall !== null) {
    c.textAlign = 'right';
    c.font = V2F(24, 700);
    c.fillStyle = theme.sub;
    c.fillText('三维吻合', V2_PAD + V2_INNER - 118, cy + 48);
    c.font = V2F(38, 900);
    c.fillStyle = syn.level.color;
    c.fillText(syn.overall + '%', V2_PAD + V2_INNER - 40, cy + 48);
  }

  let by = cy + 108;
  const bx0 = V2_PAD + 40, bw0 = V2_INNER - 80;
  axes.forEach(d => {
    c.font = V2F(24, 800);
    c.fillStyle = ink;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(d.axis.cn, bx0, by);

    c.textAlign = 'right';
    c.font = V2F(24, 900);
    c.fillStyle = d.band === 'mid' ? theme.sub : d.axis.color;
    c.fillText(d.pole + ' ' + d.val, bx0 + bw0, by);

    const ty = by + 20, th = 22;
    c.fillStyle = isDark ? '#4A4155' : '#F1EDF5';
    v2RR(c, bx0, ty, bw0, th, 11); c.fill();
    c.fillStyle = d.axis.color;
    v2RR(c, bx0, ty, Math.max(bw0 * d.val / 100, 22), th, 11); c.fill();
    c.lineWidth = 4; c.strokeStyle = ink;
    v2RR(c, bx0, ty, bw0, th, 11); c.stroke();
    // 中线标记
    c.lineWidth = 2.5; c.strokeStyle = isDark ? 'rgba(255,255,255,.3)' : 'rgba(43,34,51,.26)';
    c.beginPath(); c.moveTo(bx0 + bw0 / 2, ty); c.lineTo(bx0 + bw0 / 2, ty + th); c.stroke();

    by += rowH;
  });
  cy += barCardH + 40;

  // 维度来源标签
  const dims = syn.dims.map(d => d.label);
  c.font = V2F(24, 800);
  const dw = dims.map(n => c.measureText(n).width + 52);
  const dTotal = dw.reduce((a, b) => a + b, 0) + 14 * (dims.length - 1);
  let dx = (V2_W - dTotal) / 2;
  const dColors = { 'MBTI': theme.deco, '星座': '#7DDCC0', '八字': '#C4A9F5' };
  dims.forEach((n, i) => {
    v2Pill(c, dx, cy, dw[i], 52, dColors[n] || theme.deco, ink, 4, 6);
    c.fillStyle = '#2B2233';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = V2F(24, 800);
    c.fillText(n, dx + dw[i] / 2, cy + 26);
    dx += dw[i] + 14;
  });

  /* ================= 下段：品牌区 ================= */
  const footY = V2_H - 210;

  // 分隔装饰
  c.strokeStyle = theme.accent; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath();
  c.moveTo(V2_W / 2 - 130, footY - 26); c.lineTo(V2_W / 2 - 34, footY - 26);
  c.moveTo(V2_W / 2 + 34, footY - 26); c.lineTo(V2_W / 2 + 130, footY - 26);
  c.stroke();
  v2Diamond(c, V2_W / 2, footY - 26, 13, theme.accent, null);

  // CTA
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = V2F(40, 900);
  c.fillStyle = ink;
  c.fillText('你又是哪一种人？', V2_W / 2, footY + 30);

  // 品牌字标
  c.font = V2F(30, 900);
  const bt = BRAND.mark + ' ' + BRAND.name;
  const btw = c.measureText(bt).width + 62;
  v2Pill(c, (V2_W - btw) / 2, footY + 66, btw, 66, theme.accent, ink, 5, 7);
  c.fillStyle = '#FFFFFF';
  c.font = V2F(30, 900);
  c.fillText(bt, V2_W / 2, footY + 99);

  // tagline
  c.font = V2F(22, 600);
  c.fillStyle = theme.sub;
  c.fillText(BRAND.tagline, V2_W / 2, footY + 158);

  return { dataUrl: cv.toDataURL('image/png'), theme, badges };
}
