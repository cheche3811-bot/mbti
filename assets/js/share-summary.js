/* ============================================================
 *  三维综合总结 · 朋友圈分享长图
 *
 *  尺寸 1080 × 1920（9:16，朋友圈单图最佳比例，微信不裁切）
 *
 *  设计目标：让人愿意发出去。三个关键点：
 *  1. 身份标签要大 —— 原型名称是「我是什么人」的宣告，占据视觉中心
 *  2. 有可炫耀的数字 —— 一致性百分比、稀有度，这些是社交货币
 *  3. 留出让朋友想测的钩子 —— 底部 CTA + 三维标签
 *
 *  头像用 avatars.js 的 SVG 转 Image 绘制，全平台一致。
 * ============================================================ */

const PS_W = 1080, PS_H = 2000;

/* ---------- 绘图工具 ---------- */

function psRR(c, x, y, w, h, r) {
  c.beginPath();
  c.moveTo(x + r, y);
  c.arcTo(x + w, y, x + w, y + h, r);
  c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r);
  c.arcTo(x, y, x + w, y, r);
  c.closePath();
}

/* 贴纸块：硬阴影 + 厚描边 */
function psSticker(c, x, y, w, h, r, fill, lw = 6, off = 11) {
  c.fillStyle = INK;
  psRR(c, x + off, y + off, w, h, r); c.fill();
  c.fillStyle = fill;
  psRR(c, x, y, w, h, r); c.fill();
  c.lineWidth = lw; c.strokeStyle = INK;
  psRR(c, x, y, w, h, r); c.stroke();
}

/* 胶囊标签，返回宽度 */
function psChip(c, text, cx, y, h, fill, fontSize, textColor = INK) {
  c.font = F(fontSize, 800);
  const w = c.measureText(text).width + h * 1.15;
  psSticker(c, cx - w / 2, y, w, h, h / 2, fill, 5, 7);
  c.fillStyle = textColor;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText(text, cx, y + h / 2);
  return w;
}

/* 波点背景 */
function psDots(c, w, h, alpha = 0.05) {
  c.fillStyle = `rgba(43,34,51,${alpha})`;
  for (let y = 22; y < h; y += 36) {
    for (let x = 22; x < w; x += 36) {
      c.beginPath(); c.arc(x, y, 2.6, 0, 7); c.fill();
    }
  }
}

/**
 * 生成三维综合总结分享图
 *
 * @param {Object} syn  synthesize() 结果
 * @param {Object} prof buildProfile() 结果
 * @param {Object} input 原始输入（含 mbti/zodiac/bazi）
 * @returns {Promise<string>} dataURL
 */
async function buildSummaryShareImage(syn, prof, input) {
  const cv = document.createElement('canvas');
  cv.width = PS_W; cv.height = PS_H;
  const c = cv.getContext('2d');

  const arc = prof.archetype;
  const arcCfg = (typeof AVATAR_ARCHETYPE !== 'undefined' && AVATAR_ARCHETYPE[arc.name])
    || (typeof AVATAR_ARCHETYPE !== 'undefined' ? AVATAR_ARCHETYPE['均衡型'] : null);
  const themeBg = arcCfg ? arcCfg.bg : '#E4E0EC';

  /* ================= 背景 ================= */
  c.fillStyle = '#FFFBF4';
  c.fillRect(0, 0, PS_W, PS_H);

  // 顶部主题色渐变
  const g = c.createLinearGradient(0, 0, PS_W * 0.7, 860);
  g.addColorStop(0, themeBg);
  g.addColorStop(1, '#FFFBF4');
  c.fillStyle = g;
  c.fillRect(0, 0, PS_W, 820);

  psDots(c, PS_W, PS_H, 0.05);

  // 装饰小圆
  const deco = [[74, 250, 22, '#FFD84D'], [1006, 200, 17, '#FF9EC4'],
                [58, 700, 14, '#7DDCC0'], [1020, 660, 20, '#C4A9F5'],
                [66, 1180, 16, '#8FC9F5'], [1014, 1500, 18, '#FFD84D']];
  deco.forEach(([x, y, r, f]) => {
    c.fillStyle = INK; c.beginPath(); c.arc(x + 5, y + 5, r, 0, 7); c.fill();
    c.fillStyle = f; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.lineWidth = 4; c.strokeStyle = INK; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke();
  });

  /* ================= 顶部标签 ================= */
  psChip(c, '三维性格分析报告', PS_W / 2, 58, 64, '#FFD84D', 28);

  /* ================= 头像 ================= */
  const AV_CY = 300, AV_R = 118;
  // 阴影底
  c.fillStyle = INK;
  c.beginPath(); c.arc(PS_W / 2 + 11, AV_CY + 11, AV_R, 0, 7); c.fill();

  let avatarDrawn = false;
  if (typeof archetypeAvatar === 'function' && typeof svgToImage === 'function') {
    try {
      const svg = archetypeAvatar(arc.name, 100, true);
      const img = await svgToImage(svg, AV_R * 2);
      c.save();
      c.beginPath(); c.arc(PS_W / 2, AV_CY, AV_R, 0, 7); c.clip();
      c.drawImage(img, PS_W / 2 - AV_R, AV_CY - AV_R, AV_R * 2, AV_R * 2);
      c.restore();
      c.lineWidth = 7; c.strokeStyle = INK;
      c.beginPath(); c.arc(PS_W / 2, AV_CY, AV_R, 0, 7); c.stroke();
      avatarDrawn = true;
    } catch (e) { /* 降级到 emoji */ }
  }
  if (!avatarDrawn) {
    c.fillStyle = '#fff';
    c.beginPath(); c.arc(PS_W / 2, AV_CY, AV_R, 0, 7); c.fill();
    c.lineWidth = 7; c.strokeStyle = INK;
    c.beginPath(); c.arc(PS_W / 2, AV_CY, AV_R, 0, 7); c.stroke();
    c.font = '130px "Apple Color Emoji","Segoe UI Emoji",sans-serif';
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(arc.face, PS_W / 2, AV_CY + 8);
  }

  /* ================= 原型名称（视觉中心）================= */
  c.font = F(34, 800);
  c.fillStyle = '#5A4E63';
  c.textAlign = 'center'; c.textBaseline = 'alphabetic';
  c.fillText('我的人格原型是', PS_W / 2, 484);

  c.font = F(104, 900);
  c.lineWidth = 13; c.strokeStyle = INK;
  c.strokeText(arc.name, PS_W / 2, 596);
  c.fillStyle = '#FFFFFF';
  c.fillText(arc.name, PS_W / 2, 596);

  // 原型副标题
  c.font = F(33, 700);
  c.fillStyle = '#463C50';
  let y = wrap(c, arc.title, PS_W / 2, 650, 900, 42);

  /* ================= 一句话金句（黑卡）================= */
  let cy = y + 18;
  c.font = F(35, 800);
  const oneLines = measureLines(c, prof.oneLiner, 860);
  const oneH = 62 + oneLines * 50;
  psSticker(c, 68, cy, PS_W - 136, oneH, 34, INK, 6, 11);
  c.fillStyle = '#FFF6E5';
  c.font = F(35, 800);
  wrap(c, prof.oneLiner, PS_W / 2, cy + 54, 860, 50);
  cy += oneH + 26;

  /* ================= 三维标签 + 一致性 ================= */
  const dimNames = syn.dims.map(d => d.label);
  const hasScore = syn.overall !== null;

  psSticker(c, 68, cy, PS_W - 136, hasScore ? 232 : 152, 34, '#FFFFFF', 6, 11);

  // 维度徽章
  c.font = F(28, 800);
  const chipY = cy + 28;
  const chipH = 56;
  const gap = 18;
  const widths = dimNames.map(n => c.measureText('✓ ' + n).width + 62);
  const totalW = widths.reduce((a, b) => a + b, 0) + gap * (dimNames.length - 1);
  let cx0 = (PS_W - totalW) / 2;
  const chipColors = { 'MBTI': '#FFD84D', '星座': '#7DDCC0', '八字': '#C4A9F5' };
  dimNames.forEach((n, i) => {
    psSticker(c, cx0, chipY, widths[i], chipH, chipH / 2, chipColors[n] || '#EEE', 4, 6);
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = F(28, 800);
    c.fillText('✓ ' + n, cx0 + widths[i] / 2, chipY + chipH / 2);
    cx0 += widths[i] + gap;
  });

  if (hasScore) {
    // 一致性大数字（社交货币）
    const sy = chipY + chipH + 22;
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.font = F(26, 800); c.fillStyle = '#6B6076';
    c.fillText('三套体系描述吻合度', PS_W / 2, sy + 24);

    c.font = F(76, 900);
    c.fillStyle = syn.level.color;
    c.textBaseline = 'alphabetic';
    const numTxt = syn.overall + '%';
    c.lineWidth = 9; c.strokeStyle = INK;
    c.strokeText(numTxt, PS_W / 2 - 54, sy + 100);
    c.fillText(numTxt, PS_W / 2 - 54, sy + 100);

    c.font = F(32, 900); c.fillStyle = INK;
    c.textAlign = 'left';
    c.fillText(syn.level.label, PS_W / 2 + 34, sy + 94);
    cy += 232 + 26;
  } else {
    cy += 152 + 26;
  }

  /* ================= 五维特质条 ================= */
  const axes = prof.axisDetails;
  const barCardH = 96 + axes.length * 78;
  psSticker(c, 68, cy, PS_W - 136, barCardH, 34, '#FFFFFF', 6, 11);

  c.font = F(31, 900); c.fillStyle = INK;
  c.textAlign = 'left'; c.textBaseline = 'middle';
  c.fillText('五维性格特质', 68 + 42, cy + 50);

  let by = cy + 112;
  axes.forEach(d => {
    const bx = 68 + 42, bw = PS_W - 136 - 84;

    // 名称与分值
    c.font = F(27, 800); c.fillStyle = INK;
    c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(d.axis.cn, bx, by);
    c.textAlign = 'right';
    c.font = F(27, 900);
    c.fillStyle = d.band === 'mid' ? '#8A8095' : d.axis.color;
    c.fillText(d.pole + ' ' + d.val, bx + bw, by);

    // 进度条
    const ty = by + 20, th = 26;
    c.fillStyle = '#F1EDF5';
    psRR(c, bx, ty, bw, th, 13); c.fill();
    c.fillStyle = d.axis.color;
    psRR(c, bx, ty, Math.max(bw * d.val / 100, 26), th, 13); c.fill();
    c.lineWidth = 5; c.strokeStyle = INK;
    psRR(c, bx, ty, bw, th, 13); c.stroke();
    // 中线
    c.lineWidth = 3; c.strokeStyle = 'rgba(43,34,51,.28)';
    c.beginPath(); c.moveTo(bx + bw / 2, ty); c.lineTo(bx + bw / 2, ty + th); c.stroke();

    by += 78;
  });
  cy += barCardH + 26;

  /* ================= 优势标签 ================= */
  if (prof.strengths.length) {
    const tags = prof.strengths.slice(0, 3).map(s => s.axis.cn);
    c.font = F(28, 800);
    const tw = tags.map(t => c.measureText(t).width + 56);
    const tTotal = tw.reduce((a, b) => a + b, 0) + 16 * (tags.length - 1);
    let tx = (PS_W - tTotal) / 2;
    const tagH = 54;
    tags.forEach((t, i) => {
      psSticker(c, tx, cy, tw[i], tagH, tagH / 2, '#DDF5EB', 4, 6);
      c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = F(28, 800);
      c.fillText(t, tx + tw[i] / 2, cy + tagH / 2);
      tx += tw[i] + 16;
    });
    cy += tagH + 30;
  }

  /* ================= 底部 CTA ================= */
  const ctaY = PS_H - 196;

  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = F(42, 900); c.fillStyle = INK;
  c.fillText('你又是哪一种人？', PS_W / 2, ctaY);

  psChip(c, '扫码 / 打开链接 测测看 →', PS_W / 2, ctaY + 34, 76, '#FF8A6B', 30, '#FFFFFF');

  c.font = F(23, 600); c.fillStyle = '#9A90A5';
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.fillText('MBTI 48 题量表 · 太阳星座 · 生辰八字 三维交叉分析', PS_W / 2, ctaY + 152);

  return cv.toDataURL('image/png');
}
