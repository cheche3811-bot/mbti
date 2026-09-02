/* ============================================================
 *  三维综合分析引擎
 *
 *  职责：把 MBTI / 星座 / 八字 三个维度统一映射到大五人格五轴，
 *        计算一致性、识别冲突点、生成交叉洞察。
 *
 *  ⚠️ 方法论诚实声明（务必阅读）
 *  srcId: synthesis_heuristic
 *
 *  1. MBTI → 大五 的映射系数有实证支持（McCrae & Costa, 1989），
 *     是本文件唯一有实测相关性依据的映射。
 *  2. 星座 → 大五、八字 → 大五 的映射是对其传统性格描述文本的
 *     语义归纳，属启发式赋值，无任何实证依据。
 *  3. 因此「一致性百分比」的正确解读是：
 *     『三套性格描述体系在文字层面的吻合程度』
 *     而不是『三种方法测量同一人格的收敛效度』。
 *  4. 高一致性不代表结论更可靠——它只说明三套说法碰巧描述相近。
 *
 *  支持 1-3 个维度的任意组合：
 *  - 单维度：只呈现该维度画像，不计算一致性（无可比对象）
 *  - 双维度：计算两者一致性
 *  - 三维度：计算两两一致性 + 整体平均
 * ============================================================ */

const AXES = TRAITS_DATA.axes;
const AXIS_KEYS = AXES.map(a => a.key);

/* ============================================================
 *  向量构建
 * ============================================================ */

/**
 * MBTI 结果 → 大五特质向量
 * 唯一有实证支持的映射。
 * srcId: mbti_bigfive_mccrae1989
 *
 * @param {Object} mbtiResult calculate() 的返回值，或 {percent:{...}} 形态
 * @returns {Object} { extraversion: 0-100, ... }
 */
function mbtiToVector(mbtiResult) {
  const v = {};
  AXIS_KEYS.forEach(k => { v[k] = 50; });

  TRAITS_DATA.mbtiMapping.rules.forEach(r => {
    const p = mbtiResult.percent[r.dim];
    if (!p) return;
    // firstPct 为第一个字母的强度（如 EI 的 E）
    // 公式：50 + (pct - 50) * weight * direction
    const delta = (p.firstPct - 50) * r.weight * r.direction;
    v[r.axis] = Math.round(Math.max(0, Math.min(100, 50 + delta)));
  });

  return v;
}

/**
 * 由 MBTI 类型代码直接构造向量（用户手填类型、无百分比时使用）
 * 以每维度 75% 的典型强度估算——因为手填只知方向不知强度。
 */
function mbtiTypeToVector(typeCode, identity) {
  const T = typeCode.toUpperCase();
  const DEFAULT_STRENGTH = 75;
  const percent = {
    EI: { firstPct: T[0] === 'E' ? DEFAULT_STRENGTH : 100 - DEFAULT_STRENGTH },
    SN: { firstPct: T[1] === 'S' ? DEFAULT_STRENGTH : 100 - DEFAULT_STRENGTH },
    TF: { firstPct: T[2] === 'T' ? DEFAULT_STRENGTH : 100 - DEFAULT_STRENGTH },
    JP: { firstPct: T[3] === 'J' ? DEFAULT_STRENGTH : 100 - DEFAULT_STRENGTH },
    AT: { firstPct: identity === 'A' ? DEFAULT_STRENGTH : 100 - DEFAULT_STRENGTH }
  };
  return mbtiToVector({ percent });
}

/**
 * 星座 → 特质向量（直接取数据表中的启发式赋值）
 */
function zodiacToVector(signData) {
  return { ...signData.vector };
}

/**
 * 八字 → 特质向量
 * 以日主天干向量为基础，再按五行旺衰做小幅调整。
 * 传统命理以日柱天干（日主）代表命主本人，故以其为主。
 */
function baziToVector(baziResult) {
  const base = { ...baziResult.dayMaster.vector };

  // 五行偏旺/缺失的调整规则（传统说法的量化近似）
  // 木旺→尽责性略降（固执）；火旺→外向升、稳定降（急躁）
  // 土旺→稳定升、开放降（保守）；金旺→宜人降（刚硬）；水旺→开放升、尽责降（多思）
  const ADJ = {
    wood:  { conscientiousness: -4, agreeableness: -3 },
    fire:  { extraversion: +6, stability: -5 },
    earth: { stability: +5, openness: -5 },
    metal: { agreeableness: -6, conscientiousness: +3 },
    water: { openness: +6, conscientiousness: -4 }
  };

  const strongest = baziResult.strongest;
  // 仅当明显偏旺（>=4，即八字中占半数以上）才施加调整
  if (strongest && strongest.count >= 4 && ADJ[strongest.key]) {
    Object.entries(ADJ[strongest.key]).forEach(([axis, d]) => {
      base[axis] = Math.max(0, Math.min(100, base[axis] + d));
    });
  }

  return base;
}


/* ============================================================
 *  一致性计算
 * ============================================================ */

/**
 * 余弦相似度 → 一致性百分比
 * srcId: cosine_similarity
 *
 * 注意：直接对原始向量求余弦相似度会虚高（所有值都在 0-100 正区间，
 * 夹角天然很小）。因此先将向量以 50 为中心平移到 [-50, +50]，
 * 使「高于均值」与「低于均值」成为反向，相似度才有区分度。
 */
function cosineSimilarity(v1, v2) {
  let dot = 0, n1 = 0, n2 = 0;
  AXIS_KEYS.forEach(k => {
    const a = (v1[k] ?? 50) - 50;
    const b = (v2[k] ?? 50) - 50;
    dot += a * b;
    n1 += a * a;
    n2 += b * b;
  });

  // 任一向量为零向量（全部恰好 50）时无法定义夹角，返回中性值
  if (n1 === 0 || n2 === 0) return 50;

  const cos = dot / (Math.sqrt(n1) * Math.sqrt(n2));
  // cos ∈ [-1, 1] → 映射到 [0, 100]
  return Math.round((cos + 1) / 2 * 100);
}

/**
 * 识别冲突特质轴
 * 同一轴上两维度分值差超过阈值即视为冲突。
 */
function findConflicts(vectors, labels) {
  const threshold = TRAITS_DATA.consistency.conflictThreshold;
  const conflicts = [];

  AXES.forEach(axis => {
    const vals = vectors.map((v, i) => ({ val: v[axis.key] ?? 50, label: labels[i] }));
    if (vals.length < 2) return;

    const sorted = [...vals].sort((a, b) => b.val - a.val);
    const hi = sorted[0], lo = sorted[sorted.length - 1];
    const gap = hi.val - lo.val;

    if (gap >= threshold) {
      conflicts.push({
        axis,
        gap,
        high: hi,
        low: lo,
        desc: `${hi.label}认为你偏「${axis.high}」（${hi.val}），${lo.label}则指向「${axis.low}」（${lo.val}）`
      });
    }
  });

  return conflicts.sort((a, b) => b.gap - a.gap);
}

/**
 * 找出三维共识特质（各维度都指向同一方向且偏离中值明显）
 */
function findConsensus(vectors, labels) {
  const out = [];

  AXES.forEach(axis => {
    const vals = vectors.map(v => v[axis.key] ?? 50);
    const allHigh = vals.every(v => v >= 62);
    const allLow = vals.every(v => v <= 38);

    if (allHigh || allLow) {
      const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
      out.push({
        axis,
        avg,
        direction: allHigh ? 'high' : 'low',
        label: allHigh ? axis.high : axis.low,
        desc: `${labels.join('、')}都指向「${allHigh ? axis.high : axis.low}」`
      });
    }
  });

  // 偏离中值越远的排前面
  return out.sort((a, b) => Math.abs(b.avg - 50) - Math.abs(a.avg - 50));
}


/* ============================================================
 *  主入口
 * ============================================================ */

/**
 * 综合分析
 *
 * @param {Object} input
 *   @param {Object|null} input.mbti  - { type, identity, percent } 或 null
 *   @param {Object|null} input.zodiac - getZodiacSign() 的返回值 或 null
 *   @param {Object|null} input.bazi   - calcBazi() 的返回值 或 null
 * @returns {Object} 综合分析结果
 */
function synthesize(input) {
  const dims = [];

  // ---------- 逐维度构建向量 ----------
  if (input.mbti) {
    const m = input.mbti;
    const vector = m.percent ? mbtiToVector(m) : mbtiTypeToVector(m.type, m.identity);
    dims.push({
      key: 'mbti',
      label: 'MBTI',
      title: `${m.type}${m.identity ? '-' + m.identity : ''}`,
      subtitle: TYPES[m.type] ? TYPES[m.type].cn : '',
      face: TYPES[m.type] ? TYPES[m.type].face : '🧩',
      evidence: 'contested',
      srcIds: ['mbti_bigfive_mccrae1989', 'mbti_reliability_pittenger2005'],
      vector,
      estimated: !m.percent   // 手填类型时为估算向量
    });
  }

  if (input.zodiac) {
    const z = input.zodiac.data;
    dims.push({
      key: 'zodiac',
      label: '星座',
      title: z.cn,
      subtitle: `${z.elementCn} · ${z.qualityCn}`,
      face: z.face,
      evidence: 'tradition',
      srcIds: ['astro_tradition_ptolemy', 'astro_carlson1985'],
      vector: zodiacToVector(z)
    });
  }

  if (input.bazi) {
    const b = input.bazi;
    dims.push({
      key: 'bazi',
      label: '八字',
      title: `${b.dayMaster.cn}${b.dayMaster.elementCn}日主`,
      subtitle: b.dayMaster.title,
      face: b.dayMaster.face,
      evidence: 'tradition',
      srcIds: ['bazi_sanmingtonghui', 'bazi_yuanhaiziping'],
      vector: baziToVector(b)
    });
  }

  const count = dims.length;
  if (count === 0) return null;

  // ---------- 平均向量（综合画像）----------
  const avgVector = {};
  AXIS_KEYS.forEach(k => {
    const sum = dims.reduce((s, d) => s + (d.vector[k] ?? 50), 0);
    avgVector[k] = Math.round(sum / count);
  });

  // ---------- 两两一致性 ----------
  const pairs = [];
  for (let i = 0; i < dims.length; i++) {
    for (let j = i + 1; j < dims.length; j++) {
      pairs.push({
        a: dims[i].label,
        b: dims[j].label,
        score: cosineSimilarity(dims[i].vector, dims[j].vector)
      });
    }
  }

  // 整体一致性 = 两两平均；单维度时为 null
  const overall = pairs.length
    ? Math.round(pairs.reduce((s, p) => s + p.score, 0) / pairs.length)
    : null;

  const level = overall !== null
    ? TRAITS_DATA.consistency.levels.find(l => overall >= l.min)
    : null;

  const labels = dims.map(d => d.label);

  // ---------- 特质轴汇总（供可视化）----------
  const axisRows = AXES.map(axis => ({
    axis,
    values: dims.map(d => ({
      label: d.label,
      key: d.key,
      val: d.vector[axis.key] ?? 50
    })),
    avg: avgVector[axis.key]
  }));

  // ---------- 主导特质（综合向量中最突出的）----------
  const dominant = [...axisRows]
    .sort((a, b) => Math.abs(b.avg - 50) - Math.abs(a.avg - 50))
    .slice(0, 3)
    .map(r => ({
      axis: r.axis,
      avg: r.avg,
      label: r.avg >= 50 ? r.axis.high : r.axis.low,
      strength: Math.abs(r.avg - 50)
    }));

  return {
    dims,
    count,
    avgVector,
    axisRows,
    dominant,
    pairs,
    overall,
    level,
    conflicts: count >= 2 ? findConflicts(dims.map(d => d.vector), labels) : [],
    consensus: count >= 2 ? findConsensus(dims.map(d => d.vector), labels) : [],
    // 依据构成说明
    evidenceMix: {
      hasEmpirical: dims.some(d => d.evidence === 'contested'),  // MBTI 有实证基础但有争议
      hasTradition: dims.some(d => d.evidence === 'tradition'),
      traditionCount: dims.filter(d => d.evidence === 'tradition').length
    }
  };
}

/**
 * 生成综合结论文案
 * 依据填写的维度数量与一致性水平动态组织。
 */
function buildSynthesisText(syn) {
  if (!syn) return '';

  const { count, dominant, level, overall, conflicts, consensus, dims } = syn;

  // 单维度：无从交叉
  if (count === 1) {
    const d = dims[0];
    return `你只填写了「${d.label}」一个维度，因此暂无交叉对比。` +
      `从这一维度看，你最突出的特质是「${dominant[0].label}」。` +
      `补充其余维度后，可以看到不同体系之间的吻合与分歧。`;
  }

  const parts = [];

  // 一致性总述
  parts.push(`你填写的 ${count} 个维度整体一致性为 <b>${overall}%</b>（${level.label}）。${level.desc}。`);

  // 共识特质
  if (consensus.length) {
    const top = consensus.slice(0, 2).map(c => `「${c.label}」`).join('和');
    parts.push(`其中 ${top} 是各维度共同指向的特质——这部分描述的重合度最高。`);
  }

  // 冲突特质
  if (conflicts.length) {
    const c = conflicts[0];
    parts.push(`分歧最大的是「${c.axis.cn}」：${c.desc}。` +
      `这类分歧很常见，因为三套体系的来源与方法完全不同，本不应期待它们相互印证。`);
  } else if (count >= 2) {
    parts.push(`各维度之间没有出现明显冲突的特质轴。`);
  }

  return parts.join('');
}


/* ============================================================
 *  性格总结生成器
 *
 *  由三维融合后的平均向量驱动，输出完整的人格叙述。
 *
 *  ⚠️ 依据说明
 *  srcId: bigfive_costa1992（各轴定义）, synthesis_heuristic（融合方式）
 *  大五各维度的行为含义有实证基础，但「由三维融合向量生成总结」
 *  是本项目的启发式设计。总结描述的是你所填写的三套体系融合后的
 *  画像，不是一次独立的人格测量。
 * ============================================================ */

/**
 * 判断某轴落在高/中/低哪一档
 */
function axisBand(val) {
  const t = PROFILE_DATA.thresholds;
  if (val >= t.high) return 'high';
  if (val <= t.low) return 'low';
  return 'mid';
}

/**
 * 匹配人格原型
 * 取两条最突出（偏离 50 最远）且不在中间档的轴，按组合查表。
 * 匹配不到则回退到「均衡型」。
 */
function matchArchetype(vector) {
  // 按偏离中值的幅度排序
  const ranked = AXIS_KEYS
    .map(k => ({ key: k, val: vector[k], band: axisBand(vector[k]), dist: Math.abs(vector[k] - 50) }))
    .filter(a => a.band !== 'mid')
    .sort((a, b) => b.dist - a.dist);

  if (ranked.length < 2) return { ...PROFILE_DATA.fallbackArchetype, matched: false };

  // 依次尝试前几名的两两组合，找到第一个命中的原型
  for (let i = 0; i < Math.min(ranked.length, 3); i++) {
    for (let j = i + 1; j < Math.min(ranked.length, 4); j++) {
      const tagA = `${ranked[i].key}:${ranked[i].band}`;
      const tagB = `${ranked[j].key}:${ranked[j].band}`;
      const found = PROFILE_DATA.archetypes.find(a =>
        a.keys.includes(tagA) && a.keys.includes(tagB));
      if (found) {
        return { ...found, matched: true, basedOn: [ranked[i], ranked[j]] };
      }
    }
  }

  return { ...PROFILE_DATA.fallbackArchetype, matched: false };
}

/* ============================================================
 *  反差型原型匹配
 *
 *  ⚠️ 为什么需要这个
 *
 *  平均向量会把两个极端互相抵消：INFP 的外向性 32 与白羊座的 78，
 *  平均后是 55 —— 恰好落在「中间档」。于是 matchArchetype 找不到
 *  两条非中间档的轴，只能回退到「均衡型」，输出「你没有特别极端的
 *  特质，鲜明标签不明显」。
 *
 *  但事实恰恰相反：46 分的落差说明这个人身上有强烈反差，
 *  那才是他最鲜明、最值得分享的标签。取平均 = 把最有张力的人
 *  说成最无聊的人。
 *
 *  所以当存在显著分歧时，改用「分歧轴」驱动匹配 —— 不看平均值，
 *  看两个体系在哪里打架，然后把「打架」本身命名成一个原型。
 * ============================================================ */

/* ============================================================
 *  反差轴文案
 *
 *  当两个体系在某一轴上给出相反答案时，最值得说的不是
 *  「某条轴偏高」，而是「反差轴的两端你都能用」。
 *  平均向量会把反差抹平，导致优势/建议退化成单薄的单轴描述，
 *  所以有分歧时直接按分歧轴取这里的文案。
 * ============================================================ */
const CONTRAST_AXIS_TEXT = {
  extraversion: {
    strength: '能静得下，也能冲得出去',
    advice: '内外都是你，别逼自己选一边'
  },
  openness: {
    strength: '敢想，也踩得住地',
    advice: '想法可以飞，务实也别丢'
  },
  conscientiousness: {
    strength: '松紧由你，弹性十足',
    advice: '自律和随性，配着来才不累'
  },
  agreeableness: {
    strength: '有边界，也有温度',
    advice: '直率之外，也给温柔留点位置'
  },
  stability: {
    strength: '感知敏锐，也稳得住',
    advice: '敏感不是缺点，是你的雷达'
  }
};

/**
 * 按最大分歧轴匹配反差型原型
 *
 * @param {Object} syn synthesize() 的返回值
 * @returns {Object|null} 匹配不到返回 null，由调用方回退到常规匹配
 */
function matchContrastArchetype(syn) {
  const list = PROFILE_DATA.contrastArchetypes;
  if (!list || !list.length) return null;
  if (!syn.conflicts || !syn.conflicts.length) return null;

  // conflicts 已按 gap 降序排好，取第一个 = 分歧最激烈的轴
  const top = syn.conflicts[0];
  const onAxis = list.filter(a => (a.keys || []).includes(top.axis.key));
  if (!onAxis.length) return null;

  // 优先按 gapMin 分档：选满足「分歧足够大」的最高档，
  // 让「温和反差」与「强烈反差」落到不同原型上。
  // gapMin 是可选字段，数据里没写时一律当 0，顺序无关。
  const qualified = onAxis.filter(a => (a.gapMin || 0) <= top.gap);
  const pool = qualified.length ? qualified : onAxis;
  const pick = pool.sort((a, b) => (b.gapMin || 0) - (a.gapMin || 0))[0];

  return {
    ...pick,
    matched: true,
    contrast: true,
    splitAxis: top.axis,
    splitGap: top.gap,
    splitHigh: top.high,   // { label: 维度名, val: 分值 }
    splitLow: top.low
  };
}

/**
 * 生成完整性格总结
 *
 * @param {Object} syn synthesize() 的返回值
 * @returns {Object} 总结对象
 */
function buildProfile(syn) {
  if (!syn) return null;

  const v = syn.avgVector;
  const AT = PROFILE_DATA.axisText;

  // ---------- 各轴档位与文案 ----------
  const bands = {};
  AXIS_KEYS.forEach(k => { bands[k] = axisBand(v[k]); });

  const axisDetails = AXES.map(axis => {
    const band = bands[axis.key];
    const t = AT[axis.key][band];
    return {
      axis,
      val: v[axis.key],
      band,
      bandLabel: band === 'high' ? '偏高' : band === 'low' ? '偏低' : '中等',
      pole: band === 'high' ? axis.high : band === 'low' ? axis.low : '居中',
      ...t
    };
  });

  // ---------- 人格原型 ----------
  // 有显著分歧时优先走反差型原型：平均向量会把两个极端抹平，
  // 照它匹配只会得到「均衡型」，等于把最有张力的人说成最无聊的人。
  const archetype = matchContrastArchetype(syn) || matchArchetype(v);

  // ---------- 整体叙述（取非中间档的轴，按突出程度排序）----------
  const salient = [...axisDetails]
    .filter(d => d.band !== 'mid')
    .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50));

  // 若全部落在中间档，则取偏离最大的两条来描述
  const narrativeSource = salient.length
    ? salient.slice(0, 3)
    : [...axisDetails].sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50)).slice(0, 2);

  let narrative = narrativeSource.map(d => d.narrative).join('。') + '。';

  // 有分歧时补一句反差钩子：把「两个体系打架」翻译成「你这个人有层次」。
  // 旧输出只有一条轴的内容（其余全被平均成中间档），单薄到没法分享。
  if (syn.conflicts && syn.conflicts.length) {
    const t = syn.conflicts[0];
    narrative += `而在「${t.axis.cn}」上，两个体系给出了几乎相反的答案：` +
      `${t.high.label}把你放在${t.high.val}分的「${t.axis.high}」一端，` +
      `${t.low.label}则把你放在${t.low.val}分的「${t.axis.low}」一端。` +
      `这不是哪边测错了，更像是你在不同情境下真的会长出不同的样子。`;
  }

  // ---------- 分类汇总 ----------
  const workStyle = narrativeSource.slice(0, 2).map(d => d.work);
  const socialStyle = narrativeSource.slice(0, 2).map(d => d.social);

  // 优势取高档轴 + 低档轴中本身是优势的表述。
  // ⚠️ 有分歧时换反差向文案：平均向量把两个极端抵消（INFP 32 与白羊 78 → 55），
  // 照它取优势只会剩「开放性」一条，跟用户最鲜明的反差毫无关系。
  let strengths, advices;
  if (syn.conflicts && syn.conflicts.length) {
    const t = syn.conflicts[0];
    const CT = CONTRAST_AXIS_TEXT[t.axis.key];
    if (CT) {
      strengths = [{ axis: t.axis, text: CT.strength }];
      advices = [{ axis: t.axis, text: CT.advice }];
      // 反差优势放最前，再从平均向量补 1-2 条非分歧轴的优势/建议，
      // 避免只有一条显得单薄（三维全填时尤其需要内容量）。
      const rest = axisDetails
        .filter(d => d.band !== 'mid' && d.axis.key !== t.axis.key)
        .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50));
      rest.slice(0, 2).forEach(d => strengths.push({ axis: d.axis, text: d.strength }));
      rest.slice(0, 1).forEach(d => advices.push({ axis: d.axis, text: d.advice }));
    }
  }

  if (!strengths) {
    strengths = axisDetails
      .filter(d => d.band !== 'mid')
      .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50))
      .slice(0, 4)
      .map(d => ({ axis: d.axis, text: d.strength }));

    advices = axisDetails
      .filter(d => d.band !== 'mid')
      .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50))
      .slice(0, 3)
      .map(d => ({ axis: d.axis, text: d.advice }));

    // 全中间档时也要给出建议
    if (!advices.length) {
      const top = [...axisDetails].sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50)).slice(0, 2);
      top.forEach(d => advices.push({ axis: d.axis, text: d.advice }));
      top.forEach(d => strengths.push({ axis: d.axis, text: d.strength }));
    }
  }

  // ---------- 一致性洞察 ----------
  let insight;
  if (syn.count === 1) {
    insight = PROFILE_DATA.consistencyInsight.single;
  } else if (syn.overall >= 70) {
    insight = PROFILE_DATA.consistencyInsight.high;
  } else if (syn.overall >= 50) {
    insight = PROFILE_DATA.consistencyInsight.mid;
  } else {
    insight = PROFILE_DATA.consistencyInsight.low;
  }

  // ---------- 张力点（融合后仍存在分歧的轴）----------
  const tensions = syn.conflicts.slice(0, 2).map(c => ({
    axis: c.axis,
    gap: c.gap,
    text: `在「${c.axis.cn}」上，${c.high.label}与${c.low.label}各执一词，相差 ${c.gap} 分。` +
          `这种落差不是缺陷——它意味着你能按场合切换状态，比只有一个标签的人多出一整套应对方式。`
  }));

  // ---------- 一句话概括 ----------
  const poles = salient.slice(0, 2).map(d => d.pole);
  let oneLiner;

  if (syn.conflicts && syn.conflicts.length) {
    // 有分歧时，最鲜明的标签就是「反差」本身，而不是某个特质。
    // 旧逻辑会输出「求新好奇是你最鲜明的特点，其余特质都比较居中」——
    // 听起来像「你没什么特点」，而这恰恰与事实相反。
    const t = syn.conflicts[0];
    oneLiner = `最鲜明的标签不是某个特质，而是${t.axis.cn}上 ${t.gap} 分的落差——` +
               `${t.high.label}说你「${t.axis.high}」，${t.low.label}说你「${t.axis.low}」，` +
               `两个都在你身上成立。`;
  } else if (poles.length >= 2) {
    oneLiner = `${poles[0]}、${poles[1]}，是你身上最明显的两个特点。`;
  } else if (poles.length === 1) {
    oneLiner = `${poles[0]}是你最鲜明的特点，其余特质都比较居中。`;
  } else {
    oneLiner = '你的五项特质都落在中间地带，是相当均衡的类型。';
  }

  // ---------- 短版一句话（供分享文案用）----------
  // 完整版要 60+ 字，而朋友圈折叠阈值 112 字、CTA 链接还要占约 40 字符。
  // 文案里塞完整版会把链接直接挤掉，等于断了传播闭环。
  // 结果页要表现力，文案要传播力 —— 两个场景两套长度，各自满足。
  // 下界也要守住：有模板（如 min-03）整条文案就是 {oneLiner} 本身，
  // 短到「果断、周密」这种 5 字会被判为无效文案。故一律补成完整短句。
  let oneLinerShort;
  if (syn.conflicts && syn.conflicts.length) {
    const t = syn.conflicts[0];
    // 之前是「外向性上 46 分的反差」——像检验报告片段，断在半句不像人话。
    // 「上差 46 分，两面都是我」成句、有态度，且把「反差」落回「人」身上。
    oneLinerShort = `${t.axis.cn}上差 ${t.gap} 分，两面都是我`;
  } else if (poles.length >= 2) {
    oneLinerShort = `${poles[0]}、${poles[1]}，就是我`;
  } else if (poles.length === 1) {
    oneLinerShort = `我是${poles[0]}的人`;
  } else {
    oneLinerShort = '相当均衡的一个人';
  }

  return {
    archetype,
    oneLiner,
    oneLinerShort,
    narrative,
    axisDetails,
    salientCount: salient.length,
    workStyle,
    socialStyle,
    strengths,
    advices,
    insight,
    tensions,
    dimLabels: syn.dims.map(d => d.label),
    count: syn.count,
    overall: syn.overall
  };
}
