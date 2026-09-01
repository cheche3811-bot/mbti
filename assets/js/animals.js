/* ============================================================
 *  MBTI 16 型动物拟物化头像系统
 *
 *  设计逻辑：动物的行为特征 = 该型认知功能的具象表现
 *  不是随机配可爱动物，每个形象都对应功能栈特点。
 *
 *  规格：
 *  - viewBox 0 0 512 512（正方形）
 *  - 输出 512×512 / 128×128 两档
 *  - 圆形（circle）/ 方形圆角（squircle）两种裁切
 *  - 头部中心 (256, 236)，头大身小的可爱比例
 *  - 统一描边 #2B2233，宽度随尺寸等比缩放
 * ============================================================ */

const ANI_LINE = '#2B2233';

/* ============================================================
 *  16 型形象设定
 *  bg   背景色（主色提亮）
 *  body 身体主色
 *  shade 阴影面（主色加深）
 *  accent 配饰强调色
 *  pattern 背景图案类型
 * ============================================================ */
const ANIMAL_SPEC = {
  /* ---------- 分析家 NT · 紫罗兰系 ---------- */
  INTJ: {
    animal: '深夜猫头鹰', emoji: '🦉', group: 'analyst',
    main: '#8B7BD8', bg: '#E4DEF8', body: '#9D8FE0', shade: '#7B6BC4', accent: '#FFD84D',
    pattern: 'stars', ears: 'tuft', eye: 'oneClosed', brow: 'flat', mouth: 'beakSmall',
    acc: 'blueprint', blush: false,
    trait: '猫头鹰夜间独行、视野锐利，对应 Ni 主导的长线推演与独处偏好'
  },
  INTP: {
    animal: '走神黑猫', emoji: '🐈‍⬛', group: 'analyst',
    main: '#A594E8', bg: '#EBE5FB', body: '#8B7FA8', shade: '#6E6489', accent: '#FFF3D6',
    pattern: 'gears', ears: 'cat', eye: 'glasses', brow: 'none', mouth: 'w',
    acc: 'question', blush: false,
    trait: '猫的好奇与漫不经心并存，Ti 的自娱式钻研——想得多、动得少'
  },
  ENTJ: {
    animal: '指挥雄鹰', emoji: '🦅', group: 'analyst',
    main: '#7B5FD1', bg: '#DED5F5', body: '#8E76D9', shade: '#6B4FBF', accent: '#FF8A6B',
    pattern: 'rays', ears: 'none', eye: 'sharp', brow: 'angry', mouth: 'beak',
    acc: 'cape', blush: false,
    trait: '鹰高空俯瞰、精准出击，Te 的统筹与决断力'
  },
  ENTP: {
    animal: '抬杠狐狸', emoji: '🦊', group: 'analyst',
    main: '#B49BF0', bg: '#EDE6FD', body: '#C9A0E8', shade: '#A87FD1', accent: '#FFD84D',
    pattern: 'bubbles', ears: 'fox', eye: 'wink', brow: 'raised', mouth: 'smirk',
    acc: 'pen', blush: false,
    trait: '狐狸机敏善辩，Ne 的联想爆发与「压力测试」式抬杠'
  },

  /* ---------- 外交家 NF · 薄荷绿系 ---------- */
  INFJ: {
    animal: '树精绿老头', emoji: '🌳', group: 'diplomat',
    main: '#5FBF95', bg: '#D8F0E4', body: '#7FCFA8', shade: '#4FA87F', accent: '#FFF3D6',
    pattern: 'rings', ears: 'leaf', eye: 'closed', brow: 'none', mouth: 'gentle',
    acc: 'beard', blush: false,
    trait: '古树般沉静深远，Ni+Fe 的洞察力与守护感'
  },
  INFP: {
    animal: '做梦小蝴蝶', emoji: '🦋', group: 'diplomat',
    main: '#7DD8B0', bg: '#DFF6EA', body: '#8FE0BE', shade: '#6BC49B', accent: '#FF9EC4',
    pattern: 'petals', ears: 'antenna', eye: 'teary', brow: 'none', mouth: 'small',
    acc: 'wings', blush: true,
    trait: '蝴蝶脆弱而自由，Fi 主导的丰富内在世界与理想主义'
  },
  ENFJ: {
    animal: '领队金毛', emoji: '🐕', group: 'diplomat',
    main: '#4DC98F', bg: '#D4F2E2', body: '#F0C070', shade: '#D9A455', accent: '#FF8A6B',
    pattern: 'glow', ears: 'dogFloppy', eye: 'happy', brow: 'none', mouth: 'bigSmile',
    acc: 'scarf', blush: true,
    trait: '金毛的号召力与照顾欲，Fe 主导的凝聚力'
  },
  ENFP: {
    animal: '快乐小狗', emoji: '🐶', group: 'diplomat',
    main: '#8FE3BE', bg: '#E2F8EE', body: '#F5D9A8', shade: '#DCBC84', accent: '#FF9EC4',
    pattern: 'confetti', ears: 'dogUp', eye: 'star', mouth: 'tongue',
    brow: 'none', acc: 'none', blush: true,
    trait: '摇尾巴的快乐小狗，Ne 的热情四溢与三分钟热度'
  },

  /* ---------- 守护者 SJ · 天空蓝系 ---------- */
  ISTJ: {
    animal: '档案乌龟', emoji: '🐢', group: 'sentinel',
    main: '#5B9BD5', bg: '#D8E8F7', body: '#8FC98F', shade: '#6FA86F', accent: '#C89B72',
    pattern: 'grid', ears: 'none', eye: 'calm', brow: 'worried', mouth: 'flat',
    acc: 'shell', blush: false,
    trait: '乌龟慢而稳、壳如档案柜，Si 的秩序感与可靠'
  },
  ISFJ: {
    animal: '暖手考拉', emoji: '🐨', group: 'sentinel',
    main: '#7FB8E8', bg: '#DFEDFA', body: '#B8C4CF', shade: '#98A4AF', accent: '#FF9EC4',
    pattern: 'hearts', ears: 'koala', eye: 'gentle', brow: 'none', mouth: 'gentle',
    acc: 'blanket', blush: true,
    trait: '考拉抱树不放，Si+Fe 的默默守护与念旧'
  },
  ESTJ: {
    animal: '主管灰狼', emoji: '🐺', group: 'sentinel',
    main: '#4A88C8', bg: '#D4E4F5', body: '#9AA8B8', shade: '#7A8898', accent: '#C4453C',
    pattern: 'lines', ears: 'wolf', eye: 'sharp', brow: 'angry', mouth: 'flat',
    acc: 'tie', blush: false,
    trait: '狼群的纪律与领导性，Te+Si 的强执行力'
  },
  ESFJ: {
    animal: '张罗小蜜蜂', emoji: '🐝', group: 'sentinel',
    main: '#9BCBF0', bg: '#E4F0FB', body: '#FFD84D', shade: '#E0BB35', accent: '#2B2233',
    pattern: 'hexagon', ears: 'antenna', eye: 'happy', brow: 'none', mouth: 'bigSmile',
    acc: 'beeStripe', blush: true,
    trait: '蜜蜂的社群性与勤劳，Fe 的人际张罗'
  },

  /* ---------- 探险家 SP · 蜜橘系 ---------- */
  ISTP: {
    animal: '拆机狸花猫', emoji: '🐱', group: 'explorer',
    main: '#E8A44D', bg: '#FBEBD4', body: '#C9A882', shade: '#A88A66', accent: '#8FC9F5',
    pattern: 'parts', ears: 'cat', eye: 'oneClosed', brow: 'flat', mouth: 'w',
    acc: 'wrench', blush: false,
    trait: '猫的独立与动手欲，Ti+Se 的实操派'
  },
  ISFP: {
    animal: '画画小鹿', emoji: '🦌', group: 'explorer',
    main: '#F0BC7A', bg: '#FCF0DF', body: '#D9A87F', shade: '#BC8A62', accent: '#FF9EC4',
    pattern: 'paint', ears: 'deer', eye: 'lashes', brow: 'none', mouth: 'small',
    acc: 'flower', blush: true,
    trait: '鹿的安静与审美天赋，Fi+Se 的生活艺术家'
  },
  ESTP: {
    animal: '冲刺猎豹', emoji: '🐆', group: 'explorer',
    main: '#F09340', bg: '#FDE6CE', body: '#F0B860', shade: '#D49A45', accent: '#2B2233',
    pattern: 'bolt', ears: 'cat', eye: 'bright', brow: 'raised', mouth: 'grin',
    acc: 'sunglasses', blush: false,
    trait: '猎豹的瞬间爆发力，Se 主导的先做再说'
  },
  ESFP: {
    animal: '派对海豚', emoji: '🐬', group: 'explorer',
    main: '#FFCB85', bg: '#FFF0DC', body: '#8FC9F5', shade: '#6FA8D4', accent: '#FF9EC4',
    pattern: 'notes', ears: 'fin', eye: 'star', brow: 'none', mouth: 'open',
    acc: 'lei', blush: true,
    trait: '海豚爱玩爱互动，Se+Fi 的天生舞台感'
  }
};


/* ============================================================
 *  背景图案
 * ============================================================ */
function aniPattern(type, color) {
  const o = 'opacity=".26"';
  const P = {
    stars: `<g fill="${color}" ${o}>
      <path d="M92 108l7 17 18 1-14 12 5 18-16-10-16 10 5-18-14-12 18-1z"/>
      <path d="M420 150l5 12 13 1-10 8 4 13-12-7-12 7 4-13-10-8 13-1z"/>
      <circle cx="60" cy="230" r="6"/><circle cx="452" cy="270" r="7"/>
      <circle cx="120" cy="60" r="5"/><circle cx="392" cy="72" r="5"/></g>`,
    gears: `<g fill="none" stroke="${color}" stroke-width="9" ${o}>
      <circle cx="96" cy="128" r="30"/><circle cx="96" cy="128" r="12"/>
      <circle cx="416" cy="170" r="24"/><circle cx="416" cy="170" r="9"/>
      <circle cx="66" cy="290" r="18"/></g>`,
    rays: `<g stroke="${color}" stroke-width="13" stroke-linecap="round" ${o}>
      <path d="M50 90l40 34"/><path d="M462 90l-40 34"/>
      <path d="M34 216h44"/><path d="M478 216h-44"/>
      <path d="M56 330l38-26"/><path d="M456 330l-38-26"/></g>`,
    bubbles: `<g fill="${color}" ${o}>
      <rect x="52" y="104" width="70" height="46" rx="20"/>
      <rect x="392" y="140" width="62" height="40" rx="18"/>
      <circle cx="70" cy="290" r="16"/><circle cx="446" cy="264" r="13"/></g>`,
    rings: `<g fill="none" stroke="${color}" stroke-width="9" ${o}>
      <circle cx="256" cy="256" r="150"/><circle cx="256" cy="256" r="192"/>
      <circle cx="256" cy="256" r="232"/></g>`,
    petals: `<g fill="${color}" ${o}>
      <ellipse cx="88" cy="120" rx="17" ry="26" transform="rotate(-28 88 120)"/>
      <ellipse cx="424" cy="160" rx="15" ry="24" transform="rotate(34 424 160)"/>
      <ellipse cx="62" cy="278" rx="13" ry="21" transform="rotate(-14 62 278)"/>
      <ellipse cx="450" cy="300" rx="14" ry="22" transform="rotate(22 450 300)"/></g>`,
    glow: `<g fill="none" stroke="${color}" stroke-width="14" stroke-linecap="round" ${o}>
      <path d="M46 100l34 30"/><path d="M466 100l-34 30"/>
      <path d="M30 230h40"/><path d="M482 230h-40"/>
      <path d="M52 340l34-24"/><path d="M460 340l-34-24"/></g>`,
    confetti: `<g ${o}>
      <rect x="70" y="110" width="22" height="12" rx="6" fill="#FF9EC4" transform="rotate(-24 70 110)"/>
      <rect x="410" y="146" width="22" height="12" rx="6" fill="#FFD84D" transform="rotate(30 410 146)"/>
      <rect x="52" y="272" width="20" height="11" rx="5" fill="#8FC9F5" transform="rotate(14 52 272)"/>
      <rect x="440" y="296" width="20" height="11" rx="5" fill="#C4A9F5" transform="rotate(-18 440 296)"/>
      <circle cx="120" cy="70" r="8" fill="#FF8A6B"/><circle cx="396" cy="82" r="7" fill="#7DDCC0"/></g>`,
    grid: `<g stroke="${color}" stroke-width="7" ${o}>
      <path d="M0 130h512M0 210h512M0 300h512M0 390h512"/>
      <path d="M110 0v512M210 0v512M310 0v512M410 0v512"/></g>`,
    hearts: `<g fill="${color}" ${o}>
      <path d="M86 122c-14-13-2-30 12-22 14-8 26 9 12 22l-12 12z"/>
      <path d="M424 162c-11-10-2-24 10-18 12-6 21 8 10 18l-10 10z"/>
      <path d="M62 288c-9-9-1-20 8-15 10-5 18 6 9 15l-8 8z"/></g>`,
    lines: `<g stroke="${color}" stroke-width="11" stroke-linecap="round" ${o}>
      <path d="M40 120h80"/><path d="M392 120h80"/>
      <path d="M40 190h56"/><path d="M416 190h56"/>
      <path d="M40 300h68"/><path d="M404 300h68"/></g>`,
    hexagon: `<g fill="none" stroke="${color}" stroke-width="9" ${o}>
      <path d="M78 106l26-15 26 15v30l-26 15-26-15z"/>
      <path d="M382 150l24-14 24 14v28l-24 14-24-14z"/>
      <path d="M54 272l22-13 22 13v26l-22 13-22-13z"/></g>`,
    parts: `<g fill="none" stroke="${color}" stroke-width="8" ${o}>
      <circle cx="88" cy="126" r="20"/><path d="M88 106v-14M88 146v14M68 126h-14M108 126h14"/>
      <rect x="398" y="152" width="38" height="18" rx="8"/>
      <circle cx="66" cy="290" r="14"/></g>`,
    paint: `<g ${o}>
      <ellipse cx="86" cy="124" rx="26" ry="20" fill="#FF9EC4"/>
      <ellipse cx="426" cy="164" rx="22" ry="17" fill="#8FC9F5"/>
      <ellipse cx="62" cy="286" rx="19" ry="15" fill="#FFD84D"/>
      <ellipse cx="448" cy="300" rx="20" ry="16" fill="#7DDCC0"/></g>`,
    bolt: `<g fill="${color}" ${o}>
      <path d="M96 96l-24 46h20l-14 40 40-52h-22l18-34z"/>
      <path d="M420 150l-18 34h15l-11 30 30-39h-16l13-25z"/></g>`,
    notes: `<g fill="${color}" ${o}>
      <path d="M84 140c0-8 6-12 14-12v-34l24-6v10l-16 4v42c0 10-8 16-16 16s-14-6-14-14 6-14 14-14z" />
      <path d="M416 176c0-6 5-10 11-10v-27l19-5v8l-13 3v34c0 8-6 13-13 13s-11-5-11-11 5-11 11-11z"/>
      <circle cx="60" cy="288" r="11"/></g>`
  };
  return P[type] || '';
}


/* ============================================================
 *  耳朵 / 头顶
 * ============================================================ */
function aniEars(type, body, shade, accent) {
  const S = `stroke="${ANI_LINE}" stroke-width="10" stroke-linejoin="round"`;
  const E = {
    none: '',
    tuft: `<g fill="${body}" ${S}><path d="M150 138c-10-34 4-58 18-66-2 26 8 42 20 52z"/>
      <path d="M362 138c10-34-4-58-18-66 2 26-8 42-20 52z"/></g>`,
    cat: `<g fill="${body}" ${S}><path d="M148 146l-8-72 62 34z"/><path d="M364 146l8-72-62 34z"/></g>
      <g fill="${accent}" opacity=".55"><path d="M158 136l-4-40 34 20z"/><path d="M354 136l4-40-34 20z"/></g>`,
    fox: `<g fill="${body}" ${S}><path d="M144 150l-14-84 74 42z"/><path d="M368 150l14-84-74 42z"/></g>
      <g fill="#fff" opacity=".6"><path d="M156 138l-6-46 38 22z"/><path d="M356 138l6-46-38 22z"/></g>`,
    dogUp: `<g fill="${shade}" ${S}><path d="M144 158c-24-28-26-72-8-88 18 12 34 44 40 64z"/>
      <path d="M368 158c24-28 26-72 8-88-18 12-34 44-40 64z"/></g>`,
    dogFloppy: `<g fill="${shade}" ${S}><ellipse cx="132" cy="230" rx="34" ry="60"/>
      <ellipse cx="380" cy="230" rx="34" ry="60"/></g>`,
    wolf: `<g fill="${shade}" ${S}><path d="M146 148l-10-80 70 40z"/><path d="M366 148l10-80-70 40z"/></g>
      <g fill="#F5DCC4" opacity=".7"><path d="M158 138l-5-44 36 22z"/><path d="M354 138l5-44-36 22z"/></g>`,
    koala: `<g fill="${shade}" ${S}><circle cx="132" cy="176" r="44"/><circle cx="380" cy="176" r="44"/></g>
      <g fill="#E8D4DC" opacity=".8"><circle cx="132" cy="176" r="26"/><circle cx="380" cy="176" r="26"/></g>`,
    deer: `<g fill="${shade}" ${S}><ellipse cx="140" cy="180" rx="26" ry="42" transform="rotate(-22 140 180)"/>
      <ellipse cx="372" cy="180" rx="26" ry="42" transform="rotate(22 372 180)"/></g>
      <g fill="none" ${S}><path d="M186 122l-14-46M172 92l-24-10M326 122l14-46M340 92l24-10"/></g>`,
    antenna: `<g fill="none" ${S}><path d="M206 128c-14-30-8-54 4-64"/><path d="M306 128c14-30 8-54-4-64"/></g>
      <g fill="${accent}" ${S}><circle cx="208" cy="58" r="14"/><circle cx="304" cy="58" r="14"/></g>`,
    leaf: `<g fill="#5FBF95" ${S}><path d="M256 128c-4-42 14-66 40-72-6 34-18 54-40 72z"/>
      <path d="M232 134c-24-30-22-58-12-72 16 24 20 46 12 72z"/></g>`,
    fin: `<g fill="${shade}" ${S}><path d="M256 130c-8-52 6-76 14-86 10 30 8 62-14 86z"/></g>`
  };
  return E[type] || '';
}


/* ============================================================
 *  眼睛
 * ============================================================ */
function aniEye(type) {
  const L = ANI_LINE;
  const E = {
    dot: `<circle cx="212" cy="248" r="17" fill="${L}"/><circle cx="300" cy="248" r="17" fill="${L}"/>`,
    bright: `<g><circle cx="212" cy="248" r="21" fill="${L}"/><circle cx="300" cy="248" r="21" fill="${L}"/>
      <circle cx="219" cy="240" r="7" fill="#fff"/><circle cx="307" cy="240" r="7" fill="#fff"/></g>`,
    happy: `<g stroke="${L}" stroke-width="11" stroke-linecap="round" fill="none">
      <path d="M192 254c8-14 28-14 36 0"/><path d="M284 254c8-14 28-14 36 0"/></g>`,
    calm: `<g stroke="${L}" stroke-width="11" stroke-linecap="round"><path d="M190 248h42"/><path d="M280 248h42"/></g>`,
    closed: `<g stroke="${L}" stroke-width="11" stroke-linecap="round" fill="none">
      <path d="M188 246c10 12 32 12 42 0"/><path d="M282 246c10 12 32 12 42 0"/></g>`,
    sharp: `<g fill="${L}"><path d="M186 238l46 14-46 10z"/><path d="M326 238l-46 14 46 10z"/></g>`,
    oneClosed: `<g><circle cx="212" cy="248" r="20" fill="${L}"/><circle cx="219" cy="240" r="6.5" fill="#fff"/>
      <path d="M280 248c10 11 32 11 42 0" stroke="${L}" stroke-width="11" stroke-linecap="round" fill="none"/></g>`,
    wink: `<g><path d="M190 248c10 11 32 11 42 0" stroke="${L}" stroke-width="11" stroke-linecap="round" fill="none"/>
      <circle cx="300" cy="248" r="20" fill="${L}"/><circle cx="307" cy="240" r="6.5" fill="#fff"/></g>`,
    star: `<g fill="${L}"><path d="M212 226l7 17 18 1-14 12 5 18-16-10-16 10 5-18-14-12 18-1z"/>
      <path d="M300 226l7 17 18 1-14 12 5 18-16-10-16 10 5-18-14-12 18-1z"/></g>`,
    teary: `<g><ellipse cx="212" cy="250" rx="20" ry="23" fill="${L}"/><ellipse cx="300" cy="250" rx="20" ry="23" fill="${L}"/>
      <ellipse cx="220" cy="241" rx="8" ry="9" fill="#fff"/><ellipse cx="308" cy="241" rx="8" ry="9" fill="#fff"/>
      <circle cx="204" cy="258" r="4" fill="#fff" opacity=".8"/><circle cx="292" cy="258" r="4" fill="#fff" opacity=".8"/></g>`,
    gentle: `<g><ellipse cx="212" cy="250" rx="17" ry="19" fill="${L}"/><ellipse cx="300" cy="250" rx="17" ry="19" fill="${L}"/>
      <circle cx="218" cy="243" r="5.5" fill="#fff"/><circle cx="306" cy="243" r="5.5" fill="#fff"/></g>`,
    lashes: `<g><ellipse cx="212" cy="250" rx="17" ry="20" fill="${L}"/><ellipse cx="300" cy="250" rx="17" ry="20" fill="${L}"/>
      <circle cx="218" cy="243" r="5.5" fill="#fff"/><circle cx="306" cy="243" r="5.5" fill="#fff"/>
      <g stroke="${L}" stroke-width="8" stroke-linecap="round">
        <path d="M188 232l-14-10"/><path d="M324 232l14-10"/></g></g>`,
    glasses: `<g><circle cx="212" cy="250" r="15" fill="${L}"/><circle cx="300" cy="250" r="15" fill="${L}"/>
      <g fill="none" stroke="${L}" stroke-width="9"><circle cx="212" cy="250" r="34"/><circle cx="300" cy="250" r="34"/>
      <path d="M246 250h20"/><path d="M178 244l-24-8"/><path d="M334 244l24-8"/></g></g>`
  };
  return E[type] || E.dot;
}

/* ---------- 眉毛（仅 T 型使用）---------- */
function aniBrow(type) {
  const S = `stroke="${ANI_LINE}" stroke-width="11" stroke-linecap="round" fill="none"`;
  const B = {
    none: '',
    flat: `<g ${S}><path d="M188 210h44"/><path d="M280 210h44"/></g>`,
    angry: `<g ${S}><path d="M186 202l46 14"/><path d="M326 202l-46 14"/></g>`,
    raised: `<g ${S}><path d="M186 208c14-12 34-10 46 2"/><path d="M280 212c12-14 32-16 46-4"/></g>`,
    worried: `<g ${S}><path d="M186 214c14-10 34-8 46 4"/><path d="M280 218c12-12 32-14 46-4"/></g>`
  };
  return B[type] || '';
}

/* ---------- 嘴 ---------- */
function aniMouth(type, accent) {
  const L = ANI_LINE;
  const M = {
    small: `<path d="M244 300h24" stroke="${L}" stroke-width="10" stroke-linecap="round"/>`,
    flat: `<path d="M238 302h36" stroke="${L}" stroke-width="10" stroke-linecap="round"/>`,
    gentle: `<path d="M238 298c10 10 26 10 36 0" stroke="${L}" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    smile: `<path d="M232 296c12 16 36 16 48 0" stroke="${L}" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    bigSmile: `<path d="M224 290c14 30 50 30 64 0z" fill="${L}"/>
      <path d="M240 306c8 8 24 8 32 0z" fill="#FF9EC4"/>`,
    grin: `<path d="M222 288c16 30 52 30 68 0z" fill="${L}"/>
      <path d="M230 290h52l-6 10h-40z" fill="#fff"/>`,
    open: `<ellipse cx="256" cy="302" rx="26" ry="22" fill="${L}"/>
      <ellipse cx="256" cy="310" rx="14" ry="10" fill="#FF9EC4"/>`,
    tongue: `<path d="M226 288c14 26 46 26 60 0z" fill="${L}"/>
      <path d="M240 302c0 18 8 30 18 30s16-12 16-30z" fill="#FF7FA8" stroke="${L}" stroke-width="7" stroke-linejoin="round"/>`,
    w: `<g stroke="${L}" stroke-width="10" stroke-linecap="round" fill="none">
      <path d="M234 296c6 10 16 10 22 0"/><path d="M256 296c6 10 16 10 22 0"/></g>`,
    smirk: `<path d="M232 298c14 12 34 10 44-6" stroke="${L}" stroke-width="10" stroke-linecap="round" fill="none"/>`,
    beak: `<path d="M236 288l20 34 20-34z" fill="${accent}" stroke="${ANI_LINE}" stroke-width="9" stroke-linejoin="round"/>`,
    beakSmall: `<path d="M242 290l14 24 14-24z" fill="${accent}" stroke="${ANI_LINE}" stroke-width="9" stroke-linejoin="round"/>`
  };
  return M[type] || M.smile;
}

/* ---------- 配饰 ---------- */
function aniAcc(type, spec) {
  const S = `stroke="${ANI_LINE}" stroke-width="10" stroke-linejoin="round"`;
  const A = {
    none: '',
    // 卷起的蓝图（INTJ）
    blueprint: `<g ${S}><rect x="336" y="356" width="104" height="34" rx="16" fill="#8FC9F5"/>
      <path d="M356 356v34M382 356v34M408 356v34" stroke-width="7"/></g>`,
    // 问号泡泡（INTP）
    question: `<g fill="#FFF3D6" ${S}><circle cx="392" cy="126" r="30"/></g>
      <text x="392" y="140" font-size="42" font-weight="900" fill="${ANI_LINE}" text-anchor="middle" font-family="sans-serif">?</text>`,
    // 小斗篷（ENTJ）
    cape: `<path d="M150 372c30-24 70-34 106-34s76 10 106 34v42H150z" fill="#FF8A6B" ${S}/>`,
    // 转笔（ENTP）
    pen: `<g ${S}><rect x="340" y="348" width="96" height="20" rx="9" fill="#FFD84D" transform="rotate(-18 340 348)"/>
      <path d="M340 356l-16 12 4-20z" fill="${ANI_LINE}" transform="rotate(-18 340 348)"/></g>`,
    // 白长须（INFJ）
    beard: `<path d="M188 300c0 62 30 106 68 106s68-44 68-106c0 26-30 40-68 40s-68-14-68-40z"
      fill="#F2F6F0" ${S}/>`,
    // 蝴蝶翅膀（INFP）
    wings: `<g opacity=".92" ${S}>
      <path d="M136 250c-42-40-46-96-16-112 26-14 52 24 60 62z" fill="#A8E8CE"/>
      <path d="M376 250c42-40 46-96 16-112-26-14-52 24-60 62z" fill="#A8E8CE"/>
      <path d="M142 274c-34 22-40 68-16 78 20 8 40-20 48-48z" fill="#C4F0DE"/>
      <path d="M370 274c34 22 40 68 16 78-20 8-40-20-48-48z" fill="#C4F0DE"/></g>`,
    // 围巾（ENFJ）
    scarf: `<g ${S}><path d="M170 366c26 18 54 26 86 26s60-8 86-26v34c-26 18-54 26-86 26s-60-8-86-26z" fill="#FF8A6B"/>
      <path d="M320 392l24 56-30 8-16-52z" fill="#FF8A6B"/></g>`,
    // 龟壳（ISTJ）
    shell: `<g ${S}><path d="M148 400c0-44 48-72 108-72s108 28 108 72z" fill="#8B6F47"/>
      <g fill="none" stroke="${ANI_LINE}" stroke-width="7">
        <path d="M256 328v72M196 344l16 56M316 344l-16 56M164 372h184"/></g></g>`,
    // 毛毯（ISFJ）
    blanket: `<path d="M140 372c34-22 74-32 116-32s82 10 116 32v42H140z" fill="#FFD4DE" ${S}/>
      <g stroke="${ANI_LINE}" stroke-width="6" opacity=".4"><path d="M180 384v30M230 376v38M282 376v38M332 384v30"/></g>`,
    // 领带（ESTJ）
    tie: `<g ${S}><path d="M238 340h36l-8 22h-20z" fill="#C4453C"/>
      <path d="M242 362h28l12 52-26 22-26-22z" fill="#C4453C"/></g>`,
    // 蜜蜂条纹（ESFJ）
    beeStripe: `<g fill="${ANI_LINE}" opacity=".85">
      <path d="M164 368h184c0 8-1 15-2 22H166c-1-7-2-14-2-22z"/>
      <path d="M172 410h168c-2 8-5 15-8 22H180c-3-7-6-14-8-22z"/></g>`,
    // 扳手（ISTP）
    wrench: `<g ${S}><rect x="338" y="352" width="90" height="18" rx="8" fill="#B8BFC9" transform="rotate(-14 338 352)"/>
      <path d="M424 340l18-6 6 18-14 10z" fill="#B8BFC9" transform="rotate(-14 338 352)"/></g>`,
    // 耳后小花（ISFP）
    flower: `<g ${S}><g fill="#FF9EC4"><circle cx="368" cy="180" r="16"/><circle cx="396" cy="180" r="16"/>
      <circle cx="382" cy="158" r="16"/><circle cx="382" cy="202" r="16"/></g>
      <circle cx="382" cy="180" r="10" fill="#FFD84D"/></g>`,
    // 墨镜推头顶（ESTP）
    sunglasses: `<g ${S}><rect x="164" y="150" width="80" height="42" rx="16" fill="#2B2233"/>
      <rect x="268" y="150" width="80" height="42" rx="16" fill="#2B2233"/>
      <path d="M244 168h24" stroke-width="8"/></g>`,
    // 花环（ESFP）
    lei: `<g ${S}><circle cx="196" cy="150" r="18" fill="#FF9EC4"/><circle cx="240" cy="132" r="18" fill="#FFD84D"/>
      <circle cx="288" cy="132" r="18" fill="#7DDCC0"/><circle cx="332" cy="150" r="18" fill="#C4A9F5"/></g>`
  };
  return A[type] ? A[type] : '';
}


/* ============================================================
 *  主装配函数
 * ============================================================ */

/**
 * 生成 MBTI 动物头像
 * @param {string} type MBTI 类型码
 * @param {Object} opt { size, shape:'circle'|'squircle'|'none', pattern:bool }
 */
function animalAvatar(type, opt = {}) {
  const spec = ANIMAL_SPEC[type];
  if (!spec) return '';

  const size = opt.size || 512;
  const shape = opt.shape || 'circle';
  const showPattern = opt.pattern !== false;
  // 描边宽度按 512 基准等比缩放（在 viewBox 内不需调整，SVG 自动缩放）

  const clipId = `clip-${type}-${shape}-${Math.random().toString(36).slice(2, 7)}`;

  // 裁切形状
  let clipPath = '';
  let border = '';
  if (shape === 'circle') {
    clipPath = `<clipPath id="${clipId}"><circle cx="256" cy="256" r="256"/></clipPath>`;
    border = `<circle cx="256" cy="256" r="248" fill="none" stroke="${ANI_LINE}" stroke-width="16"/>`;
  } else if (shape === 'squircle') {
    clipPath = `<clipPath id="${clipId}"><rect x="0" y="0" width="512" height="512" rx="112"/></clipPath>`;
    border = `<rect x="8" y="8" width="496" height="496" rx="106" fill="none" stroke="${ANI_LINE}" stroke-width="16"/>`;
  } else {
    clipPath = `<clipPath id="${clipId}"><rect x="0" y="0" width="512" height="512"/></clipPath>`;
  }

  const S = `stroke="${ANI_LINE}" stroke-width="10" stroke-linejoin="round"`;

  return `<svg viewBox="0 0 512 512" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" class="ani-av" data-type="${type}">
<defs>${clipPath}</defs>
<g clip-path="url(#${clipId})">
  <rect width="512" height="512" fill="${spec.bg}"/>
  ${showPattern ? aniPattern(spec.pattern, spec.main) : ''}

  <!-- 身体（肩部露出下缘）-->
  <path d="M256 336c-72 0-130 44-130 100v76h260v-76c0-56-58-100-130-100z"
        fill="${spec.body}" ${S}/>

  ${spec.acc === 'shell' || spec.acc === 'beeStripe' ? aniAcc(spec.acc, spec) : ''}
  ${spec.acc === 'cape' || spec.acc === 'blanket' ? aniAcc(spec.acc, spec) : ''}

  <!-- 翅膀在头后 -->
  ${spec.acc === 'wings' ? aniAcc('wings', spec) : ''}

  <!-- 耳朵 -->
  ${aniEars(spec.ears, spec.body, spec.shade, spec.accent)}

  <!-- 头 -->
  <ellipse cx="256" cy="236" rx="132" ry="122" fill="${spec.body}" ${S}/>

  <!-- 面部浅色区 -->
  <ellipse cx="256" cy="262" rx="96" ry="82" fill="#fff" opacity=".26"/>

  ${spec.acc === 'beard' ? aniAcc('beard', spec) : ''}
  ${spec.blush ? `<g fill="#FF7FA8" opacity=".42"><ellipse cx="168" cy="286" rx="26" ry="17"/><ellipse cx="344" cy="286" rx="26" ry="17"/></g>` : ''}

  ${aniBrow(spec.brow)}
  ${aniEye(spec.eye)}
  ${aniMouth(spec.mouth, spec.accent)}

  <!-- 前景配饰 -->
  ${['blueprint','question','pen','scarf','tie','wrench','flower','sunglasses','lei'].includes(spec.acc)
    ? aniAcc(spec.acc, spec) : ''}
</g>
${border}
</svg>`;
}

/* ---------- 便捷接口 ---------- */
function animalAvatar512(type, shape = 'circle') {
  return animalAvatar(type, { size: 512, shape, pattern: true });
}
function animalAvatar128(type, shape = 'circle') {
  // 小尺寸关闭背景图案，避免视觉噪点
  return animalAvatar(type, { size: 128, shape, pattern: false });
}
