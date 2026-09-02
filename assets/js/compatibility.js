/* ============================================================
 *  双人契合度引擎
 *
 *  职责：把「两个人」的大五人格向量做匹配，输出契合度评分、
 *        相处建议、以及「理想型」推荐（遍历 MBTI × 星座）。
 *
 *  ⚠️ 方法论诚实声明
 *  srcId: synthesis_heuristic
 *
 *  1. 单人向量复用 synthesis.js 的映射（MBTI→大五有实测相关，
 *     星座/八字→大五是传统描述语义归纳）。
 *  2. 「契合度 = 向量相似/互补评分」是本项目的启发式设计，
 *     不构成科学配对结论，仅供娱乐参考。
 *
 *  契合度模型：
 *  - 宜人性 / 尽责性 / 开放性 / 情绪稳定性：以「相似」计分
 *    （价值观与生活方式接近，相处更省力）。
 *  - 外向性：允许「互补」——内外向搭配往往和谐，所以距离落在
 *    互补带（约 45 分）同样得分，而非一味扣分。
 * ============================================================ */

/* ---------- 单人向量：复用 synthesize 得到 avgVector ---------- */
function personVector(input) {
  const syn = synthesize(input);
  return syn ? syn.avgVector : null;
}

/* ---------- 契合度评分（0-100） ----------
 * 主体用 cosineSimilarity（已做 [-50,50] 平移，能区分向量方向）：
 *   - 同元素星座（火火/水水/风风）向量方向一致 → 高分
 *   - 相克组合（火水/火土）方向相反 → 低分
 * 再叠加「外向性互补奖励」：一内一外（差异 30-60）是和谐搭配，小幅加分。
 */
function computeScore(vA, vB) {
  let score = cosineSimilarity(vA, vB);
  const exDist = Math.abs(vA.extraversion - vB.extraversion);
  if (exDist >= 30 && exDist <= 60) score += 8;
  return Math.min(100, score);
}

/* ---------- 相处建议：按每轴「相似高/相似低/相似中/互补」取文案 ---------- */
function buildAdvice(vA, vB) {
  const out = [];
  AXIS_KEYS.forEach(k => {
    const rule = COMPAT_DATA.axisAdvice[k];
    if (!rule) return;
    const dist = Math.abs(vA[k] - vB[k]);
    let key;
    if (dist <= 18) {
      const mid = (vA[k] + vB[k]) / 2;
      key = mid >= 62 ? 'similarHigh' : mid <= 38 ? 'similarLow' : 'similarMid';
    } else {
      key = 'complement';
    }
    out.push({ axis: k, text: rule[key] || '' });
  });
  return out.filter(a => a.text);
}

/* ---------- 双人匹配主入口 ----------
 * @param {Object} inputA / inputB  与 synthesize() 相同的输入结构
 * @returns {Object|null} { score, level, advice:[{axis,text}], vA, vB }
 */
function coupleMatch(inputA, inputB) {
  const vA = personVector(inputA);
  const vB = personVector(inputB);
  if (!vA || !vB) return null;
  const score = computeScore(vA, vB);
  const level = COMPAT_DATA.levels.find(l => score >= l.min) || COMPAT_DATA.levels[COMPAT_DATA.levels.length - 1];
  return { score, level, advice: buildAdvice(vA, vB), vA, vB };
}

/* ---------- 理想型推荐：遍历 16 型 × 12 星座，取契合度 top 3 ---------- */
function findBestMatch(inputA) {
  const vA = personVector(inputA);
  if (!vA) return [];

  const results = [];
  Object.keys(TYPES).forEach(type => {
    const mv = mbtiTypeToVector(type, 'A');
    ZODIAC_DATA.signs.forEach(sign => {
      const zv = sign.vector;
      // 对方 = MBTI + 星座 的平均向量（与 synthesize 的 count=2 一致）
      const vB = {};
      AXIS_KEYS.forEach(k => { vB[k] = Math.round((mv[k] + zv[k]) / 2); });
      results.push({
        type,
        signKey: sign.key,
        signCn: sign.cn,
        score: computeScore(vA, vB)
      });
    });
  });

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 3);
}
