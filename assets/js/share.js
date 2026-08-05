/* ============================================================
 *  朋友圈分享长图生成器（纯 Canvas，无依赖）
 *  输出 1080 × 1560 PNG
 * ============================================================ */

const SW = 1080, SH = 1720;
const INK = '#2B2233';

/* 圆角矩形路径 */
function rr(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* 贴纸块：硬阴影 + 厚描边 */
function sticker(c, x, y, w, h, r, fill, lw = 6, off = 10) {
  c.fillStyle = INK;
  rr(c, x + off, y + off, w, h, r); c.fill();
  c.fillStyle = fill;
  rr(c, x, y, w, h, r); c.fill();
  c.lineWidth = lw; c.strokeStyle = INK;
  rr(c, x, y, w, h, r); c.stroke();
}

/* 贴纸圆 */
function stickerCircle(c, cx, cy, rad, fill, lw = 6, off = 10) {
  c.fillStyle = INK;
  c.beginPath(); c.arc(cx + off, cy + off, rad, 0, 7); c.fill();
  c.fillStyle = fill;
  c.beginPath(); c.arc(cx, cy, rad, 0, 7); c.fill();
  c.lineWidth = lw; c.strokeStyle = INK;
  c.beginPath(); c.arc(cx, cy, rad, 0, 7); c.stroke();
}

/* 文本换行绘制，返回结束 y */
function wrap(c, text, x, y, maxW, lh, align = 'center') {
  c.textAlign = align;
  const chars = [...text];
  let line = '', cy = y;
  for (const ch of chars) {
    if (ch === '\n') { c.fillText(line, x, cy); line = ''; cy += lh; continue; }
    const test = line + ch;
    if (c.measureText(test).width > maxW && line) {
   c.fillText(line, x, cy);
      line = ch; cy += lh;
    } else line = test;
  }
if (line) { c.fillText(line, x, cy); cy += lh; }
  return cy;
}

/* 真实测量换行行数（不绘制） */
function measureLines(c, text, maxW) {
  const chars = [...text];
  let line = '', n = 1;
  for (const ch of chars) {
    if (ch === '\n') { n++; line = ''; continue; }
    const test = line + ch;
    if (c.measureText(test).width > maxW && line) { n++; line = ch; }
    else line = test;
  }
  return n;
}

const F = (size, weight = 900) =>
  `${weight} ${size}px "PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif`;

/**
 * 生成分享图
 * @returns {Promise<string>} dataURL
 */
async function buildShareImage(result, T, G, ID) {
  const cv = document.createElement('canvas');
  cv.width = SW; cv.height = SH;
  const c = cv.getContext('2d');

  /* ---------- 背景 ---------- */
  c.fillStyle = '#FFFBF4';
  c.fillRect(0, 0, SW, SH);

  // 顶部大色块
  const grad = c.createLinearGradient(0, 0, SW, 620);
  grad.addColorStop(0, G.light);
  grad.addColorStop(1, '#FFFBF4');
  c.fillStyle = grad;
  c.fillRect(0, 0, SW, 620);

  // 波点纹理
  c.fillStyle = 'rgba(43,34,51,.055)';
  for (let y = 20; y < SH; y += 34) {
    for (let x = 20; x < SW; x += 34) {
      c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill();
    }
  }

  // 装饰小圆
  const deco = [
    [90, 200, 26, '#FFD84D'], [995, 150, 20, '#FF9EC4'],
    [130, 470, 16, '#7DDCC0'], [960, 430, 24, '#C4A9F5'],
    [70, 900, 18, '#8FC9F5'], [1010, 980, 22, '#FFD84D'],
    [90, 1330, 20, '#FF9EC4'], [990, 1400, 16, '#7DDCC0']
  ];
  deco.forEach(([x, y, r, f]) => stickerCircle(c, x, y, r, f, 4, 5));

  /* ---------- 顶部小标签 ---------- */
  c.font = F(28, 800);
  const topTxt = '16 型人格测试 · 我的结果';
  const tw = c.measureText(topTxt).width + 64;
  sticker(c, (SW - tw) / 2, 62, tw, 66, 33, '#FFD84D', 5, 7);
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(topTxt, SW / 2, 96);

  /* ---------- 卡通头像 ---------- */
  stickerCircle(c, SW / 2, 300, 108, '#FFFFFF', 7, 11);
  c.font = '110px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(T.face, SW / 2, 308);

  /* ---------- 类型代码 ---------- */
  c.font = F(126, 900);
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  // 描边效果
  c.lineWidth = 12; c.strokeStyle = INK;
  c.strokeText(result.full, SW / 2, 500);
  c.fillStyle = G.color;
  c.fillText(result.full, SW / 2, 500);

  /* ---------- 中文名徽章 ---------- */
  c.font = F(44, 900);
  const cnW = c.measureText(T.cn).width + 80;
  sticker(c, (SW - cnW) / 2, 540, cnW, 84, 42, '#FFFFFF', 6, 9);
  c.fillStyle = INK; c.textBaseline = 'middle';
  c.fillText(T.cn, SW / 2, 583);

  /* ---------- 一句话标题（动态行高） ---------- */
  c.font = F(30, 700);
  c.fillStyle = '#5A4E63';
  c.textBaseline = 'alphabetic';
  const titleLH = 46;
  const titleY = 686;
  const titleLines = measureLines(c, T.title, 860);
  wrap(c, T.title, SW / 2, titleY, 860, titleLH);
  const titleEnd = titleY + titleLines * titleLH;

  /* ---------- 金句黑卡（真实测量行数） ---------- */
  const qy = titleEnd + 18;
  c.font = F(34, 800);
  const qLines = measureLines(c, T.slogan, 800);
  const qLH = 52;
  const qh = 76 + qLines * qLH;
  sticker(c, 70, qy, SW - 140, qh, 32, INK, 6, 10);
  c.fillStyle = '#FFF6E5';
  c.font = F(34, 800);
  wrap(c, T.slogan, SW / 2, qy + 62, 800, qLH);
  // 引号
  c.font = F(80, 900); c.fillStyle = '#FFD84D';
  c.textAlign = 'left';
  c.fillText('“', 96, qy + 70);

  /* ---------- 四维度条 ---------- */
  const DIM_CARD_H = 386;
  let by = qy + qh + 50;
  const dims = ['EI', 'SN', 'TF', 'JP'];
  const dColor = { EI: '#FFD84D', SN: '#7DDCC0', TF: '#8FC9F5', JP: '#C4A9F5' };
  const barX = 90, barW = SW - 180;

  sticker(c, 70, by, SW - 140, DIM_CARD_H, 32, '#FFFFFF', 6, 10);
  c.font = F(32, 900); c.fillStyle = INK;
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('我的四维倾向', barX + 24, by + 48);

  let ly = by + 100;
  dims.forEach(d => {
    const p = result.percent[d];
    const L = DIM_LABEL[d];
    const isF = p.firstPct >= 50;
    const pct = isF ? p.firstPct : p.secondPct;
    const nm = (isF ? L.first : L.second) + '（' + (isF ? p.first : p.second) + '）';

    c.font = F(26, 800); c.fillStyle = INK;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(nm, barX + 24, ly);
    c.textAlign = 'right';
    c.fillText(pct + '%', barX + barW - 24, ly);

    // 轨道
    const tx = barX + 24, tw2 = barW - 48, ty = ly + 22, th = 26;
    c.fillStyle = '#F1EDF5';
    rr(c, tx, ty, tw2, th, 13); c.fill();
    c.fillStyle = dColor[d];
    rr(c, tx, ty, Math.max(tw2 * pct / 100, 26), th, 13); c.fill();
    c.lineWidth = 5; c.strokeStyle = INK;
    rr(c, tx, ty, tw2, th, 13); c.stroke();

    ly += 84;
  });

  /* ---------- 底部信息条 ---------- */
  const fy = by + DIM_CARD_H + 44;
  // 占比
  c.font = F(28, 800);
  const pctTxt = `${G.emoji} ${G.name} · 全球仅 ${T.pct}`;
  const pw = c.measureText(pctTxt).width + 70;
  sticker(c, (SW - pw) / 2, fy, pw, 74, 37, '#FFD84D', 5, 8);
  c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(pctTxt, SW / 2, fy + 38);

  /* ---------- CTA ---------- */
  c.font = F(34, 900);
  c.fillStyle = INK;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('👉 你是哪一型？也来测测看', SW / 2, fy + 148);

  c.font = F(24, 600);
  c.fillStyle = '#8A8095';
  c.fillText('48 题 · 七级量表 · 约 6 分钟', SW / 2, fy + 196);

  return cv.toDataURL('image/png');
}
