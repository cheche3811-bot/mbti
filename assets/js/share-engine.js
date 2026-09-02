/* ============================================================
 *  分享引擎：成就徽章 + 文案生成
 *
 *  核心设计：
 *  1. 变量池（buildVars）—— 从分析结果抽取所有可插值的数据
 *  2. 徽章计算（calcBadges）—— 把数据转成可炫耀的标签，按权重排序
 *  3. 模板筛选 —— 只用变量齐备的模板，避免出现 {score} 这种未替换占位符
 *  4. 轮换去重 —— localStorage 记录已用模板，优先给没见过的
 *
 *  扩展方式：只改 share-copy.json，不动本文件。
 *  新增风格 → styles 加一个 key
 *  新增模板 → 对应 styles[x].templates 加一项，声明 needs
 *  新增徽章 → badges.rules 加一条，cond 用下方 evalCond 支持的语法
 * ============================================================ */

const SHARE_LS_KEY = 'tri_persona_used_copy';
const SHARE_LS_MAX = 40;   // 记录上限，超出后从头淘汰

/* ============================================================
 *  1. 变量池
 * ============================================================ */

/**
 * 从分析结果构造变量表
 * 值为 null/undefined 的变量视为「不可用」，依赖它的模板会被跳过。
 */
function buildVars(syn, prof, input) {
  const v = {};
  const arc = prof.archetype;

  // 站点链接 —— CTA 拼接用。
  // 优先用「带结果参数的专属链接」（window.__currentShareUrl，
  // 由 share-url.js 的 writeResultUrl 写入），否则退回站点根链接。
  v.url = (typeof window !== 'undefined' && window.__currentShareUrl)
    || (SHARE_COPY_DATA.site && SHARE_COPY_DATA.site.url)
    || '';
  v.siteLabel = (SHARE_COPY_DATA.site && SHARE_COPY_DATA.site.shortLabel) || '';

  v.archetype = arc.name;
  v.archetypeTitle = arc.title;
  // 文案一律用短版：完整版 60+ 字会把 CTA 链接挤出朋友圈折叠阈值。
  // 结果页展示仍用 prof.oneLiner 完整版。
  v.oneLiner = prof.oneLinerShort || prof.oneLiner;
  v.dimCount = syn.count;
  v.dimList = syn.dims.map(d => d.label).join(' + ');

  // 一致性（单维度时为 null）
  if (syn.overall !== null) {
    v.score = syn.overall;
    v.scoreLabel = syn.level.label;
  }

  // MBTI 相关
  if (input.mbti && TYPES[input.mbti.type]) {
    const T = TYPES[input.mbti.type];
    v.mbti = input.mbti.type;
    v.mbtiCn = T.cn;
    v.rarity = T.pct;
    v.rarityNum = parseFloat(T.pct);
    // 动物形象名
    if (typeof ANIMAL_SPEC !== 'undefined' && ANIMAL_SPEC[input.mbti.type]) {
      v.animal = ANIMAL_SPEC[input.mbti.type].animal;
    }
  }

  if (input.zodiac) v.zodiac = input.zodiac.data.cn;
  if (input.bazi) v.dayMaster = input.bazi.dayMaster.cn + input.bazi.dayMaster.elementCn;

  // 特质极值（跳过中间档）。pole 为「居中」的轴放进文案会产生
  // 「求新好奇、居中」这种废句子 —— min-05 模板整条就是
  // {topTrait}、{secondTrait}，一旦 secondTrait 是「居中」整条就废了。
  const sorted = [...prof.axisDetails]
    .filter(d => d.band !== 'mid')
    .sort((a, b) => Math.abs(b.val - 50) - Math.abs(a.val - 50));
  if (sorted[0]) {
    v.topTrait = sorted[0].pole;
    v.topTraitVal = sorted[0].val;
    v.topAxis = sorted[0].axis.cn;
  }
  if (sorted[1]) {
    v.secondTrait = sorted[1].pole;
    v.secondTraitVal = sorted[1].val;
  }

  const byVal = [...prof.axisDetails].sort((a, b) => b.val - a.val);
  v.maxTrait = byVal[0].val;
  v.minTrait = byVal[byVal.length - 1].val;
  v.lowTrait = byVal[byVal.length - 1].axis.low;
  v.lowTraitVal = byVal[byVal.length - 1].val;

  // 优势与建议（取首条）
  if (prof.strengths.length) v.strength = prof.strengths[0].text;
  if (prof.advices.length) v.advice = prof.advices[0].text;

  // 冲突轴
  if (syn.conflicts.length) v.conflictAxis = syn.conflicts[0].axis.cn;

  // 反差型原型的金句（contrastArchetypes 的 contrastLine）。
  // 常规原型没有这个字段，缺失时依赖它的模板会被自动跳过。
  if (arc.contrastLine) v.contrastLine = arc.contrastLine;

  // ---------- 反差/分歧变量（供「反差叙事」风格文案使用）----------
  // conflicts 已按 gap 降序，[0] 是分歧最激烈的那条轴。
  // splitHigh/Low 是维度名（如「星座」「MBTI」），
  // splitHigh/LowLabel 是该轴两端的中文标签（如「外向活跃」「沉静内敛」）。
  if (syn.conflicts.length) {
    const t = syn.conflicts[0];
    v.conflictCount = syn.conflicts.length;
    v.splitAxis = t.axis.cn;
    v.splitGap = t.gap;
    v.splitHighWho = t.high.label;
    v.splitLowWho = t.low.label;
    v.splitHighVal = t.high.val;
    v.splitLowVal = t.low.val;
    v.splitHighLabel = t.axis.high;
    v.splitLowLabel = t.axis.low;
  } else {
    v.conflictCount = 0;
  }

  // 五维跨度（供 balanced 徽章）。实测 allMid 几乎不出现，
  // 因为 MBTI 向量本身带方向性，三维平均后仍会偏离中值。
  // 改用「最高分 - 最低分」衡量均衡度，更贴合真实分布。
  v.traitSpan = v.maxTrait - v.minTrait;
  v.allMid = prof.axisDetails.every(d => d.band === 'mid');

  // ⚠️ 有分歧时不得判「均衡型」。
  // 平均向量会把两个极端抵消（INFP 32 与白羊 78 平均成 55），
  // 跨度因此变小，于是「罕见均衡型」与「多面人格」同时出现——
  // 同一屏里两条自相矛盾的徽章。平均后的平淡不等于这个人平淡，
  // 那恰恰是他身上落差最大的地方。这里置为大值让 balanced 规则落空。
  if (syn.conflicts.length) v.traitSpan = 999;

  return v;
}


/* ============================================================
 *  2. 成就徽章
 * ============================================================ */

/**
 * 极简条件求值器
 * 支持：字段 + 比较符 + 数字，以及裸布尔字段。
 * 例：'rarity<4' / 'score>=85' / 'dimCount==3' / 'allMid'
 *
 * 不用 eval —— 避免数据文件成为代码注入点。
 */
function evalCond(cond, vars) {
  const m = cond.match(/^(\w+)\s*(>=|<=|==|>|<)\s*(-?[\d.]+)$/);
  if (!m) {
    // 裸字段，按布尔判断
    return !!vars[cond];
  }
  const [, field, op, numStr] = m;
  // rarity 特殊：变量里是 '1.5%' 字符串，比较要用数值版
  let left = field === 'rarity' ? vars.rarityNum : vars[field];
  if (left === undefined || left === null) return false;
  const right = parseFloat(numStr);
  switch (op) {
    case '>=': return left >= right;
    case '<=': return left <= right;
    case '==': return left == right;
    case '>':  return left > right;
    case '<':  return left < right;
    default:   return false;
  }
}

/**
 * 计算已解锁徽章，按权重降序
 * @returns {Array} [{id, icon, label, sub, color, weight}]
 */
function calcBadges(vars) {
  const out = [];
  SHARE_COPY_DATA.badges.rules.forEach(r => {
    if (!evalCond(r.cond, vars)) return;
    out.push({
      id: r.id,
      icon: r.icon,
      label: interpolate(r.label, vars),
      sub: interpolate(r.sub, vars),
      color: r.color,
      weight: r.weight
    });
  });

  // 稀有度徽章去重：ultra-rare 与 rare 只保留更高等级
  const hasUltra = out.some(b => b.id === 'ultra-rare');
  const hasPerfect = out.some(b => b.id === 'perfect-sync');
  return out
    .filter(b => !(hasUltra && b.id === 'rare'))
    .filter(b => !(hasPerfect && b.id === 'high-sync'))
    .sort((a, b) => b.weight - a.weight);
}


/* ============================================================
 *  3. 文案生成
 * ============================================================ */

/** 变量插值。缺失变量保留原样，便于测试发现问题。 */
function interpolate(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (m, k) =>
    (vars[k] !== undefined && vars[k] !== null) ? String(vars[k]) : m);
}

/** 读取已用模板 ID 列表 */
function getUsedIds() {
  try {
    const raw = localStorage.getItem(SHARE_LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

/** 记录已用模板 ID */
function markUsed(ids) {
  try {
    const cur = getUsedIds();
    const next = [...cur, ...ids].slice(-SHARE_LS_MAX);
    localStorage.setItem(SHARE_LS_KEY, JSON.stringify(next));
  } catch (e) { /* 隐私模式下 localStorage 不可用，静默降级 */ }
}

/**
 * 从一组模板中挑一个
 *
 * 筛选顺序：
 * 1. 变量齐备（needs 全部有值）—— 否则会出现未替换占位符
 * 2. 插值后长度不超平台上限 —— 与其截断毁掉文案，不如换一个短模板
 * 3. 优先未用过的（轮换去重）
 */
function pickTemplate(templates, vars, usedIds, maxLen) {
  // 变量齐备
  let usable = templates.filter(t =>
    (t.needs || []).every(n => vars[n] !== undefined && vars[n] !== null));
  if (!usable.length) return null;

  // 长度预筛：按实际插值结果判断，而非模板原文
  if (maxLen) {
    const fit = usable.filter(t => interpolate(t.text, vars).length <= maxLen);
    // 若该风格下无模板能满足长度，退回全部（由调用方决定是否标记 overLimit）
    if (fit.length) usable = fit;
  }

  const fresh = usable.filter(t => !usedIds.includes(t.id));
  const pool = fresh.length ? fresh : usable;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 生成多套风格化文案候选
 *
 * @param {Object} syn synthesize() 结果
 * @param {Object} prof buildProfile() 结果
 * @param {Object} input 原始输入
 * @param {Object} opt { withCta:bool, platform:'wechat_moments'|'weibo'|... }
 * @returns {Array} [{styleKey, styleName, icon, desc, text, len, templateId}]
 */
function generateCopyCandidates(syn, prof, input, opt = {}) {
  const withCta = opt.withCta !== false;
  const platform = opt.platform || 'wechat_moments';
  const maxLen = SHARE_COPY_DATA._meta.lengthGuide[platform]
    ? SHARE_COPY_DATA._meta.lengthGuide[platform].max : 120;

  const vars = buildVars(syn, prof, input);
  const badges = calcBadges(vars);
  if (badges.length) {
    vars.badge = badges[0].icon + ' ' + badges[0].label;
  }

  const usedIds = getUsedIds();
  const out = [];
  const pickedIds = [];

  Object.entries(SHARE_COPY_DATA.styles).forEach(([key, style]) => {
    const tpl = pickTemplate(style.templates, vars, usedIds, maxLen);
    if (!tpl) return;   // 该风格无可用模板（如单维度时缺 score）

    let text = interpolate(tpl.text, vars);

    // 极简式不加 CTA —— 加了就不极简了
    if (withCta && key !== 'minimal') {
      const ctas = SHARE_COPY_DATA.cta.list;
      const raw = ctas[Math.floor(Math.random() * ctas.length)];
      // 必须先插值再算长度：{url} 展开后约 40 字符，
      // 用模板原文判断会严重低估，导致超出平台上限
      let cta = interpolate(raw, vars);
      // 长文案兜底：标准 CTA 挂不上时换极短版，
      // 确保「链接一定出现」——没有链接的分享文案等于断了传播闭环
      if (text.length + cta.length + 2 > maxLen) {
        const shorts = SHARE_COPY_DATA.cta.short || [];
        for (const sc of shorts) {
          const t = interpolate(sc, vars);
          if (text.length + t.length + 2 <= maxLen) { cta = t; break; }
        }
      }
      if (text.length + cta.length + 2 <= maxLen) {
        text += '\n\n' + cta;
      }
    }

    out.push({
      styleKey: key,
      styleName: style.name,
      icon: style.icon,
      desc: style.desc,
      text,
      len: text.length,
      overLimit: text.length > maxLen,
      templateId: tpl.id
    });
    pickedIds.push(tpl.id);
  });

  markUsed(pickedIds);

  return out;
}

/**
 * 重新生成（换一批）—— 供「换一换」按钮调用
 * 与 generateCopyCandidates 相同，但由于 usedIds 已更新，
 * 会自然给出不同的模板组合。
 */
function regenerateCopyCandidates(syn, prof, input, opt) {
  return generateCopyCandidates(syn, prof, input, opt);
}

/**
 * 随机取一个配色主题
 * 同一结果每次生成的图略有不同 → 增加再生成的动力
 */
function pickTheme(seedKey) {
  const list = SHARE_COPY_DATA.themes.list;
  // 若传入 seedKey，做稳定映射（同一 key 总是同一主题）；否则随机
  if (seedKey) {
    let h = 0;
    for (let i = 0; i < seedKey.length; i++) h = (h * 31 + seedKey.charCodeAt(i)) % 9973;
    return list[h % list.length];
  }
  return list[Math.floor(Math.random() * list.length)];
}

/** 统计信息：供调试与测试 */
function shareCopyStats() {
  const styles = SHARE_COPY_DATA.styles;
  const total = Object.values(styles).reduce((s, x) => s + x.templates.length, 0);
  return {
    styleCount: Object.keys(styles).length,
    templateTotal: total,
    perStyle: Object.fromEntries(Object.entries(styles).map(([k, v]) => [k, v.templates.length])),
    badgeRules: SHARE_COPY_DATA.badges.rules.length,
    themes: SHARE_COPY_DATA.themes.list.length,
    ctaCount: SHARE_COPY_DATA.cta.list.length
  };
}
