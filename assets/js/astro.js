/* ============================================================
 *  星座与八字计算引擎
 *
 *  设计原则：纯函数、无副作用、不依赖 DOM，可独立单元测试。
 *
 *  ⚠️ 依据性质说明（重要）
 *  本文件包含两类截然不同的代码：
 *  1. 历法计算（可验证）：儒略日换算、干支循环、星座日期区间。
 *     这些是确定的数学与天文计算，可独立验证正确性。
 *  2. 性格解读（传统说法）：由计算结果映射到性格描述的部分。
 *     这些源自传统文化典籍，无实证支持，不具预测效力。
 *  切勿因第 1 类计算的精确性，而误认为第 2 类解读同样可靠。
 * ============================================================ */

/* ---------- 常量表 ---------- */

// 十天干（甲乙丙丁戊己庚辛壬癸）
const STEMS_CN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];

// 十二地支（子丑寅卯辰巳午未申酉戌亥）
const BRANCHES_CN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

// 天干五行归属，索引对应 STEMS_CN
// 甲乙木、丙丁火、戊己土、庚辛金、壬癸水
const STEM_ELEMENT = ['wood', 'wood', 'fire', 'fire', 'earth', 'earth', 'metal', 'metal', 'water', 'water'];

// 地支五行归属，索引对应 BRANCHES_CN
// 子水、丑土、寅木、卯木、辰土、巳火、午火、未土、申金、酉金、戌土、亥水
const BRANCH_ELEMENT = ['water', 'earth', 'wood', 'wood', 'earth', 'fire', 'fire', 'earth', 'metal', 'metal', 'earth', 'water'];


/* ============================================================
 *  第一部分：星座计算
 *  依据：黄道十二宫日期边界（天文平均值）
 *  srcId: astro_boundary_aa2024
 * ============================================================ */

/**
 * 根据月日判断太阳星座
 * @param {number} month 1-12
 * @param {number} day 1-31
 * @returns {{key:string, data:Object, nearBoundary:boolean, boundaryNote:string}|null}
 *
 * 实现说明：用「起始日查表」而非逐个 if 判断，避免边界遗漏。
 * 摩羯座跨年（12/22 - 1/19），需单独处理。
 */
function getZodiacSign(month, day) {
  const signs = ZODIAC_DATA.signs;

  for (const s of signs) {
    const [fm, fd] = s.from;
    const [tm, td] = s.to;

    let matched = false;
    if (fm === tm) {
      // 同月内（理论上不会出现，保留以防数据变更）
      matched = month === fm && day >= fd && day <= td;
    } else if (fm < tm) {
      // 正常跨月，如白羊 3/21 - 4/19
      matched = (month === fm && day >= fd) || (month === tm && day <= td);
    } else {
      // 跨年，如摩羯 12/22 - 1/19
      matched = (month === fm && day >= fd) || (month === tm && day <= td);
    }

    if (matched) {
      // 判断是否处于交界日（前后各 1 天）
      // 依据：太阳过黄经各宫起点的实际时刻每年浮动约 ±1 天
      const nearStart = month === fm && Math.abs(day - fd) <= 1;
      const nearEnd = month === tm && Math.abs(day - td) <= 1;
      const nearBoundary = nearStart || nearEnd;

      return {
        key: s.key,
        data: s,
        nearBoundary,
        boundaryNote: nearBoundary
          ? '你的生日接近星座交界日。星座分界的实际时刻每年浮动约 ±1 天，建议以出生当年的天文数据核对。'
          : ''
      };
    }
  }
  return null;
}


/* ============================================================
 *  第二部分：八字排盘
 *
 *  ⚠️ 历法计算部分可验证，性格解读部分属传统说法
 *  srcId: bazi_ganzhi_calendar（历法）, bazi_yuanhaiziping（排盘规则）
 * ============================================================ */

/**
 * 公历日期 → 儒略日数（Julian Day Number）
 * 标准算法（Fliegel & Van Flandern, 1968），可独立验证。
 * @returns {number} 整数儒略日
 */
function toJulianDay(y, m, d) {
  const a = Math.floor((14 - m) / 12);
  const y2 = y + 4800 - a;
  const m2 = m + 12 * a - 3;
  return d + Math.floor((153 * m2 + 2) / 5) + 365 * y2
    + Math.floor(y2 / 4) - Math.floor(y2 / 100) + Math.floor(y2 / 400) - 32045;
}

/**
 * 推算日柱干支
 *
 * 基准：1900-01-31 为「甲辰」日，儒略日 2415051。
 * 甲辰 = 天干索引 0（甲）、地支索引 4（辰）。
 * 干支纪日自古连续未断，因此可用取模直接推算，此换算可独立验证。
 * srcId: bazi_ganzhi_calendar
 *
 * @returns {{stemIdx:number, branchIdx:number, cn:string}}
 */
function getDayPillar(y, m, d) {
  const jd = toJulianDay(y, m, d);
  const baseJd = 2415051;        // 1900-01-31
  const baseStem = 0;            // 甲
  const baseBranch = 4;          // 辰

  const diff = jd - baseJd;
  // JS 取模对负数返回负值，需用 ((n % k) + k) % k 保证非负
  const stemIdx = (((baseStem + diff) % 10) + 10) % 10;
  const branchIdx = (((baseBranch + diff) % 12) + 12) % 12;

  return {
    stemIdx,
    branchIdx,
    cn: STEMS_CN[stemIdx] + BRANCHES_CN[branchIdx]
  };
}

/**
 * 推算年柱干支
 *
 * 命理年柱以「立春」为界，而非公历元旦或农历正月初一。
 * 立春为太阳过黄经 315°，多在 2 月 3-5 日，此处取近似值 2 月 4 日。
 * srcId: bazi_lichun_year
 *
 * 公式：1984 年为甲子年（干支索引 0），以此为基准取模 60。
 */
function getYearPillar(y, m, d) {
  const lichun = BAZI_DATA.lichun;
  // 立春前算上一年
  let year = y;
  if (m < lichun.month || (m === lichun.month && d < lichun.day)) {
    year = y - 1;
  }

  // 1984 = 甲子年
  const offset = (((year - 1984) % 60) + 60) % 60;
  const stemIdx = offset % 10;
  const branchIdx = offset % 12;

  return {
    stemIdx,
    branchIdx,
    cn: STEMS_CN[stemIdx] + BRANCHES_CN[branchIdx],
    adjustedYear: year,
    lichunAdjusted: year !== y
  };
}

/**
 * 推算月柱干支
 *
 * 月支按节气划分（非公历月），寅月起于立春。
 * 月干用「五虎遁」口诀：
 *   甲己之年丙作首，乙庚之岁戊为头，
 *   丙辛必定寻庚起，丁壬壬位顺行流，
 *   若言戊癸何方发，甲寅之上好追求。
 * srcId: bazi_yuanhaiziping
 *
 * 注：本实现按公历月近似划分节气月，未做精确节气计算，
 * 交节前后 1-2 天可能有偏差。
 */
function getMonthPillar(y, m, d, yearStemIdx) {
  // 节气月近似边界：各月交节日约在 4-7 日之间，此处取 5 日近似
  // 寅月(1) 立春约2/4起，卯月(2) 惊蛰约3/6起 …
  const APPROX_JIE_DAY = 5;
  let monthOrder = m - 1;   // 公历月 → 节气月序偏移
  if (d < APPROX_JIE_DAY) monthOrder -= 1;
  // monthOrder: 1=寅月 … 12=丑月，需归一化到 1-12
  monthOrder = ((monthOrder - 1 + 12) % 12) + 1;

  // 月支：寅月对应地支索引 2
  const branchIdx = (monthOrder + 1) % 12;

  // 五虎遁：年干 甲/己→丙寅起，乙/庚→戊寅，丙/辛→庚寅，丁/壬→壬寅，戊/癸→甲寅
  const TIGER_START = [2, 4, 6, 8, 0, 2, 4, 6, 8, 0]; // 索引=年干，值=寅月的月干索引
  const startStem = TIGER_START[yearStemIdx];
  const stemIdx = (startStem + (monthOrder - 1)) % 10;

  return {
    stemIdx,
    branchIdx,
    cn: STEMS_CN[stemIdx] + BRANCHES_CN[branchIdx],
    approximate: true
  };
}

/**
 * 推算时柱干支
 *
 * 时支按两小时一时辰，子时为 23:00-00:59（跨日）。
 * 时干用「五鼠遁」口诀：
 *   甲己还加甲，乙庚丙作初，
 *   丙辛从戊起，丁壬庚子居，
 *   戊癸何方发，壬子是真途。
 * srcId: bazi_yuanhaiziping
 *
 * ⚠️ 未做真太阳时校正（经度时差 + 均时差），时柱为近似值。
 * srcId: bazi_true_solar_time
 */
function getHourPillar(hour, dayStemIdx) {
  // 时支索引：23-0点为子(0)，1-2为丑(1) …
  const branchIdx = Math.floor(((hour + 1) % 24) / 2);

  // 五鼠遁：日干 甲/己→甲子起，乙/庚→丙子，丙/辛→戊子，丁/壬→庚子，戊/癸→壬子
  const RAT_START = [0, 2, 4, 6, 8, 0, 2, 4, 6, 8]; // 索引=日干，值=子时的时干索引
  const startStem = RAT_START[dayStemIdx];
  const stemIdx = (startStem + branchIdx) % 10;

  return {
    stemIdx,
    branchIdx,
    cn: STEMS_CN[stemIdx] + BRANCHES_CN[branchIdx],
    approximate: true
  };
}

/**
 * 完整排盘 + 五行统计
 *
 * @param {number} y 公历年
 * @param {number} m 公历月 1-12
 * @param {number} d 公历日
 * @param {number|null} hour 24 小时制 0-23；传 null 表示不知时辰，仅排三柱
 * @returns {Object} 排盘结果
 */
function calcBazi(y, m, d, hour) {
  const year = getYearPillar(y, m, d);
  const day = getDayPillar(y, m, d);
  const month = getMonthPillar(y, m, d, year.stemIdx);
  const hasHour = hour !== null && hour !== undefined && hour !== '';
  const hourP = hasHour ? getHourPillar(Number(hour), day.stemIdx) : null;

  // ---------- 五行统计 ----------
  // 每柱天干、地支各计 1 分。不知时辰则只统计三柱。
  const counts = { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 };
  const pillars = [year, month, day];
  if (hourP) pillars.push(hourP);

  pillars.forEach(p => {
    counts[STEM_ELEMENT[p.stemIdx]]++;
    counts[BRANCH_ELEMENT[p.branchIdx]]++;
  });

  const totalCount = pillars.length * 2;

  // 旺衰判定
  const levels = BAZI_DATA.strengthLevels;
  const elements = Object.keys(counts).map(k => {
    const n = counts[k];
    const lv = levels.find(l => n >= l.min) || levels[levels.length - 1];
    return {
      key: k,
      count: n,
      pct: Math.round(n / totalCount * 100),
      level: lv.label,
      color: lv.color,
      data: BAZI_DATA.elements[k]
    };
  }).sort((a, b) => b.count - a.count);

  // 日主（日柱天干）——传统命理以此代表命主本人性格
  const dayMaster = BAZI_DATA.stems[day.stemIdx];

  return {
    pillars: {
      year: { ...year, elementCn: BAZI_DATA.elements[STEM_ELEMENT[year.stemIdx]].cn },
      month: { ...month, elementCn: BAZI_DATA.elements[STEM_ELEMENT[month.stemIdx]].cn },
      day: { ...day, elementCn: BAZI_DATA.elements[STEM_ELEMENT[day.stemIdx]].cn },
      hour: hourP ? { ...hourP, elementCn: BAZI_DATA.elements[STEM_ELEMENT[hourP.stemIdx]].cn } : null
    },
    hasHour,
    dayMaster,
    elements,
    strongest: elements[0],
    weakest: elements[elements.length - 1],
    lichunAdjusted: year.lichunAdjusted,
    adjustedYear: year.adjustedYear,
    zodiacAnimal: BAZI_DATA.branches[year.branchIdx].animal,
    notes: [
      '月柱按公历近似划分节气，交节前后 1-2 天可能有偏差',
      hasHour
        ? '时柱未做真太阳时校正（经度时差与均时差），为近似值'
        : '未提供出生时辰，仅排年月日三柱，五行统计相应减少一柱'
    ]
  };
}

/**
 * 获取时辰选项列表（供表单使用）
 */
function getHourOptions() {
  return BAZI_DATA.branches.map(b => ({
    value: b.hourFrom === 23 ? 23 : b.hourFrom,
    label: `${b.cn}时 · ${String(b.hourFrom).padStart(2, '0')}:00-${String((b.hourTo + 23) % 24).padStart(2, '0')}:59`,
    cn: b.cn
  }));
}
