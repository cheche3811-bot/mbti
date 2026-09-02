/* ============================================================
 *  MBTI 题库 —— 48 题李克特 7 级量表
 *  dim : 'EI' | 'SN' | 'TF' | 'JP' | 'AT'
 *  dir : +1表示「同意」偏向该维度的第一个字母 (E/S/T/J/A)
 *        -1 表示「同意」偏向第二个字母 (I/N/F/P/T-turbulent)
 *  正反向题交替出现，用于抵消「默认同意倾向」(acquiescence bias)
 * ============================================================ */

const QUESTIONS = [
  /* ---------- 外倾 E / 内倾 I ：能量从哪里来 ---------- */
  { t: '在热闹的聚会上，我往往越聊越有精神。', dim: 'EI', dir: 1 },
  { t: '独处一段时间之后，我的能量会被重新充满。', dim: 'EI', dir: -1 },
  { t: '遇到陌生人时，我通常是先开口的那一个。', dim: 'EI', dir: 1 },
  { t: '我更喜欢跟一两个熟人深聊，而不是跟一群人泛泛而谈。', dim: 'EI', dir: -1 },
  { t: '在小组讨论里，我习惯一边说一边把想法理清楚。', dim: 'EI', dir: 1 },
  { t: '长时间的社交活动结束后，我需要很久才能缓过来。', dim: 'EI', dir: -1 },
  { t: '我喜欢待在人来人往、有点声响的环境里做事。', dim: 'EI', dir: 1 },
  { t: '打一个重要电话前，我常常要先在心里排练一遍。', dim: 'EI', dir: -1 },
  { t: '我很容易跟刚认识的人熟络起来。', dim: 'EI', dir: 1 },
  { t: '比起出门参加活动，我更愿意安静地在家度过周末。', dim: 'EI', dir: -1 },

  /* ---------- 实感 S / 直觉 N ：如何接收信息 ---------- */
  { t: '我更相信亲眼所见和实际经验，而不是凭空的猜测。', dim: 'SN', dir: 1 },
  { t: '我经常会不自觉地想象未来可能发生的各种情形。', dim: 'SN', dir: -1 },
  { t: '描述一件事时，我习惯把具体细节讲清楚。', dim: 'SN', dir: 1 },
  { t: '我喜欢琢磨抽象的概念和理论，哪怕它眼下没什么用。', dim: 'SN', dir: -1 },
  { t: '我更擅长处理具体、明确、有先例可循的任务。', dim: 'SN', dir: 1 },
  { t: '别人说话时，我常常会去想他背后真正的意思。', dim: 'SN', dir: -1 },
  { t: '做事情我偏好按已经被验证过的方法一步步来。', dim: 'SN', dir: 1 },
  { t: '我的脑子里常常同时冒出很多互不相干的新想法。', dim: 'SN', dir: -1 },
  { t: '我对身边环境的细微变化很敏感（比如东西被挪动了位置）。', dim: 'SN', dir: 1 },
  { t: '比起「现在是什么样」，我更关心「它可以变成什么样」。', dim: 'SN', dir: -1 },

  /* ---------- 思考 T / 情感 F ：如何做决定 ---------- */
  { t: '做决定时，我会先看逻辑和事实，再考虑感受。', dim: 'TF', dir: 1 },
  { t: '朋友难过时，我的第一反应是安抚他的情绪，而不是分析问题。', dim: 'TF', dir: -1 },
  { t: '我认为规则的公平，比照顾到每个人的感受更重要。', dim: 'TF', dir: 1 },
  { t: '我很容易被周围人的情绪牵动。', dim: 'TF', dir: -1 },
  { t: '被批评时，我更在意对方说得对不对，而不是语气好不好。', dim: 'TF', dir: 1 },
  { t: '为了不让别人尴尬，我常常会把话说得更委婉一些。', dim: 'TF', dir: -1 },
  { t: '讨论问题时，我习惯直接指出对方逻辑上的漏洞。', dim: 'TF', dir: 1 },
  { t: '做选择时，我很看重它是否符合我的价值观和内心感受。', dim: 'TF', dir: -1 },
  { t: '在情绪激动的场合，我依然能保持冷静客观。', dim: 'TF', dir: 1 },
  { t: '我天生就容易察觉到，某个人有没有被照顾到。', dim: 'TF', dir: -1 },

  /* ---------- 判断 J / 知觉 P ：如何安排生活 ---------- */
  { t: '我喜欢提前把计划列好，然后照着执行。', dim: 'JP', dir: 1 },
  { t: '我常常要等到快截止了才真正开始动手。', dim: 'JP', dir: -1 },
  { t: '我的东西通常摆放得有条理，用完会归位。', dim: 'JP', dir: 1 },
  { t: '计划被临时打乱时，我反而觉得挺有意思。', dim: 'JP', dir: -1 },
  { t: '事情迟迟定不下来，会让我感到不安。', dim: 'JP', dir: 1 },
  { t: '我喜欢多留几种选择，不急着做最后的决定。', dim: 'JP', dir: -1 },
  { t: '我会给自己定明确的清单和截止时间。', dim: 'JP', dir: 1 },
  { t: '出去玩我更喜欢随性走走，不做详细安排。', dim: 'JP', dir: -1 },
  { t: '把待办事项一个个打上勾，会让我特别满足。', dim: 'JP', dir: 1 },
  { t: '我经常同时开好几件事，而不是做完一件再开下一件。', dim: 'JP', dir: -1 },

  /* ---------- 自信 A / 起伏 T ：身份特征 ---------- */
  { t: '大多数时候，我对自己是满意的。', dim: 'AT', dir: 1 },
  { t: '我经常担心自己做得还不够好。', dim: 'AT', dir: -1 },
  { t: '面对压力时，我通常能保持平稳。', dim: 'AT', dir: 1 },
  { t: '做完一个决定后，我常常反复回想它到底对不对。', dim: 'AT', dir: -1 },
  { t: '别人的评价，不太会动摇我对自己的判断。', dim: 'AT', dir: 1 },
  { t: '我容易因为一个小失误而低落很久。', dim: 'AT', dir: -1 },
  { t: '我相信事情最终会朝着好的方向发展。', dim: 'AT', dir: 1 },
  { t: '我对完美要求较高，达不到时会感到焦虑。', dim: 'AT', dir: -1 }
];

/* 7 级量表选项：value 为 -3 ~ +3 */
const SCALE = [
  { v: 3,  label: '非常同意', size: 30 },
  { v: 2,  label: '同意',     size: 24 },
  { v: 1,  label: '有点同意', size: 19 },
  { v: 0,  label: '说不清',   size: 15 },
  { v: -1, label: '有点反对', size: 19 },
  { v: -2, label: '反对',     size: 24 },
  { v: -3, label: '非常反对', size: 30 }
];

/* 每个维度的正向字母 / 反向字母 */
const DIM_MAP = {
  EI: ['E', 'I'],
  SN: ['S', 'N'],
  TF: ['T', 'F'],
  JP: ['J', 'P'],
  AT: ['A', 'T']
};

/**
 * 计分：把-3~+3 的原始作答折算成每个维度的百分比
 * @param {number[]} answers 与 QUESTIONS 等长的作答数组
 * @returns {{ type:string, identity:string, full:string, percent:Object, raw:Object }}
 */
function calculate(answers) {
  const sum = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };
  const max = { EI: 0, SN: 0, TF: 0, JP: 0, AT: 0 };

  QUESTIONS.forEach((q, i) => {
    const a = typeof answers[i] === 'number' ? answers[i] : 0;
    sum[q.dim] += a * q.dir;
    max[q.dim] += 3;
  });

  const percent = {};
  const letters = {};
  Object.keys(sum).forEach(d => {
    // 把 [-max, +max] 线性映射到 [0, 100]，100 = 完全偏向第一个字母
    const p = Math.round(((sum[d] + max[d]) / (2 * max[d])) * 100);
    const [a, b] = DIM_MAP[d];
    percent[d] = { first: a, second: b, firstPct: p, secondPct: 100 - p };
    letters[d] = p >= 50 ? a : b;
  });

  const type = letters.EI + letters.SN + letters.TF + letters.JP;
  const identity = letters.AT; // A = 自信型, T = 起伏型

  return {
    type,
    identity,
    full: `${type}-${identity}`,
    percent,
    raw: sum
  };
}

/**
 * 实时计算某维度已答题的倾向（供答题中途里程碑用）
 * @param {number[]} answers 与 QUESTIONS 等长的作答数组（未答为 null）
 * @param {string} dim 'EI'|'SN'|'TF'|'JP'|'AT'
 * @returns {{pct:number, first:string, second:string}|null}
 *   该维度已答至少 2 题时返回倾向，否则 null
 */
function partialTendency(answers, dim) {
  let sum = 0, max = 0, answered = 0;
  QUESTIONS.forEach((q, i) => {
    if (q.dim !== dim) return;
    const a = answers[i];
    if (typeof a !== 'number') return;
    sum += a * q.dir;
    max += 3;
    answered++;
  });
  if (answered < 2) return null;
  const pct = Math.round(((sum + max) / (2 * max)) * 100);
  const [first, second] = DIM_MAP[dim];
  return { pct, first, second };
}
