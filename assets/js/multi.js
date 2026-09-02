/* ============================================================
 *  三维综合分析 · 表单交互与结果渲染
 *
 *  沿用 app.js 的约定：$ / $$ 简写、camelCase 函数、go() 切屏。
 *  三个维度均为选填，任填 1-3 项即可分析。
 * ============================================================ */

/* ---------- 表单状态 ---------- */
const mState = {
  mbtiType: null,      // 'INTJ' 等
  mbtiIdentity: null,  // 'A' | 'T'
  mbtiPercent: null,   // 48 题精确百分比（来自答题页回流），null 表示手动选择
  zodiacKey: null,     // 手动选择的星座
  birthDate: null,     // 'YYYY-MM-DD'
  birthHour: '',       // '' | 0-23
  result: null
};

/* ============================================================
 *  表单构建
 * ============================================================ */

/* ---------- 16 型选择网格 ---------- */
function buildMbtiPicker() {
  const grid = $('#mp-grid');
  if (!grid) return;

  // 按四大群组排序，视觉上分组更清晰
  const order = ['analyst', 'diplomat', 'sentinel', 'explorer'];
  const sorted = Object.keys(TYPES).sort((a, b) => {
    const ga = order.indexOf(TYPES[a].group);
    const gb = order.indexOf(TYPES[b].group);
    return ga !== gb ? ga - gb : a.localeCompare(b);
  });

  grid.innerHTML = sorted.map(code => {
    const T = TYPES[code];
    const G = GROUPS[T.group];
    return `<button class="mp-item" data-code="${code}" style="--mc:${G.light};--mcd:${G.color}">
      <span class="mp-face">${mbtiAvatar(code, 38, false)}</span>
      <span class="mp-code">${code}</span>
      <span class="mp-cn">${T.cn}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.mp-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      // 再次点击同一项 = 取消选择
      if (mState.mbtiType === code) {
        mState.mbtiType = null;
        mState.mbtiIdentity = null;
        mState.mbtiPercent = null;   // 手动操作后不再沿用回流百分比
        $('#mp-identity-wrap').hidden = true;
        $$('#mp-identity .seg-btn').forEach(b => b.classList.remove('on'));
      } else {
        mState.mbtiType = code;
        mState.mbtiPercent = null;   // 手动改选类型 → 走 75% 估算
        $('#mp-identity-wrap').hidden = false;
      }
      grid.querySelectorAll('.mp-item').forEach(b =>
        b.classList.toggle('on', b.dataset.code === mState.mbtiType));
      updateMbtiPreciseNote();
      updateFormStatus();
    });
  });
}

/* ---------- 从 48 题答题结果跳转（精确百分比回流） ----------
   由 app.js 结果页「解锁三维报告」按钮调用：
   把答题得到的精确 percent 带入三维表单，避免 75% 估算降级。 */
function openMultiFromQuiz(mbtiResult) {
  if (typeof resetSharedView === 'function') resetSharedView();
  mState.mbtiType = mbtiResult.type;
  mState.mbtiIdentity = mbtiResult.identity;
  mState.mbtiPercent = mbtiResult.percent || null;
  mState.zodiacKey = null;
  mState.birthDate = null;
  mState.birthHour = '';
  mState.result = null;

  syncMbtiPickerUI();
  updateMbtiPreciseNote();
  updateFormStatus();
  go('form');
}

/* 让 16 型选择网格与身份段回显 mState 里的值 */
function syncMbtiPickerUI() {
  const grid = $('#mp-grid');
  if (grid) {
    grid.querySelectorAll('.mp-item').forEach(b =>
      b.classList.toggle('on', b.dataset.code === mState.mbtiType));
  }
  const idWrap = $('#mp-identity-wrap');
  if (idWrap) idWrap.hidden = !mState.mbtiType;
  $$('#mp-identity .seg-btn').forEach(b =>
    b.classList.toggle('on', b.dataset.v === mState.mbtiIdentity));
}

/* 回显「已带入精确结果」提示 */
function updateMbtiPreciseNote() {
  const note = $('#mbti-precise-note');
  if (!note) return;
  note.hidden = !(mState.mbtiType && mState.mbtiPercent);
}

/* ---------- A/T 身份 ---------- */
function bindIdentity() {
  $$('#mp-identity .seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.v;
      mState.mbtiIdentity = mState.mbtiIdentity === v ? null : v;
      $$('#mp-identity .seg-btn').forEach(b =>
        b.classList.toggle('on', b.dataset.v === mState.mbtiIdentity));
      updateFormStatus();
    });
  });
}

/* ---------- 12 星座网格 ---------- */
function buildZodiacPicker() {
  const grid = $('#zo-grid');
  if (!grid) return;

  grid.innerHTML = ZODIAC_DATA.signs.map(s => {
    const el = ZODIAC_DATA.elements[s.element];
    return `<button class="zo-item" data-key="${s.key}" style="--zc:${el.color}">
      <span class="zo-face">${zodiacAvatar(s.key, 38, false)}</span>
      <span class="zo-cn">${s.cn} ${s.symbol}</span>
      <span class="zo-date">${s.from[0]}/${s.from[1]}-${s.to[0]}/${s.to[1]}</span>
    </button>`;
  }).join('');

  grid.querySelectorAll('.zo-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const k = btn.dataset.key;
      mState.zodiacKey = mState.zodiacKey === k ? null : k;
      grid.querySelectorAll('.zo-item').forEach(b =>
        b.classList.toggle('on', b.dataset.key === mState.zodiacKey));
      updateFormStatus();
    });
  });
}

/* ---------- 时辰下拉 ---------- */
function buildHourSelect() {
  const sel = $('#in-birth-hour');
  if (!sel) return;
  getHourOptions().forEach(o => {
    const op = document.createElement('option');
    op.value = o.value;
    op.textContent = o.label;
    sel.appendChild(op);
  });
  sel.addEventListener('change', () => {
    mState.birthHour = sel.value;
    updateBaziPreview();
    updateFormStatus();
  });
}

/* ---------- 出生日期联动 ---------- */
function bindBirthDate() {
  const inp = $('#in-birth-date');
  if (!inp) return;

  inp.addEventListener('change', () => {
    mState.birthDate = inp.value || null;

    if (mState.birthDate) {
      const [y, m, d] = mState.birthDate.split('-').map(Number);
      const z = getZodiacSign(m, d);
      if (z) {
        // 自动选中对应星座
        mState.zodiacKey = z.key;
        $$('#zo-grid .zo-item').forEach(b =>
          b.classList.toggle('on', b.dataset.key === z.key));
        $('#zodiac-auto').innerHTML =
          `已自动识别为 <b>${z.data.cn} ${z.data.symbol}</b>` +
          (z.nearBoundary ? `<br><span class="warn-txt">⚠️ ${z.boundaryNote}</span>` : '');
      }
      updateBaziPreview();
    } else {
      $('#zodiac-auto').textContent = '';
      $('#bazi-preview').hidden = true;
    }
    updateFormStatus();
  });
}

/* ---------- 八字实时预览 ---------- */
function updateBaziPreview() {
  const box = $('#bazi-preview');
  if (!box) return;

  if (!mState.birthDate) { box.hidden = true; return; }

  const [y, m, d] = mState.birthDate.split('-').map(Number);
  const hour = mState.birthHour === '' ? null : Number(mState.birthHour);
  const bz = calcBazi(y, m, d, hour);

  const cols = [
    { label: '年柱', p: bz.pillars.year },
    { label: '月柱', p: bz.pillars.month },
    { label: '日柱', p: bz.pillars.day }
  ];
  if (bz.pillars.hour) cols.push({ label: '时柱', p: bz.pillars.hour });

  box.hidden = false;
  box.innerHTML = `
    <div class="bp-head">排盘预览 · 生肖${bz.zodiacAnimal}</div>
    <div class="bp-pillars">
      ${cols.map(c => `
        <div class="bp-col${c.label === '日柱' ? ' bp-main' : ''}">
          <span class="bp-label">${c.label}</span>
          <span class="bp-gz">${c.p.cn}</span>
        </div>`).join('')}
      ${!bz.hasHour ? '<div class="bp-col bp-empty"><span class="bp-label">时柱</span><span class="bp-gz">—</span></div>' : ''}
    </div>
    <div class="bp-master">
      <span class="bp-av">${stemAvatar(bz.dayMaster.cn, 42, false)}</span>
      <span>日主 <b>${bz.dayMaster.cn}${bz.dayMaster.elementCn}</b> · ${bz.dayMaster.title}</span>
    </div>
  `;
}

/* ---------- 表单状态与按钮可用性 ---------- */
function updateFormStatus() {
  const filled = [];
  if (mState.mbtiType) filled.push('MBTI');
  if (mState.zodiacKey) filled.push('星座');
  if (mState.birthDate) filled.push('八字');

  const status = $('#form-status');
  const btn = $('#btn-analyze');

  if (filled.length === 0) {
    status.textContent = '还没有填写任何维度';
    status.className = 'form-status';
    btn.disabled = true;
  } else {
    const tip = filled.length === 1
      ? '（单维度无法交叉对比，建议再填一项）'
      : filled.length === 2 ? '（可做两两对比）' : '（可做完整三维交叉）';
    status.innerHTML = `已填写 <b>${filled.length}</b> 项：${filled.join(' · ')} <span class="fs-lite">${tip}</span>`;
    status.className = 'form-status on';
    btn.disabled = false;
  }
}


/* ============================================================
 *  分析执行
 * ============================================================ */

const MULTI_LOAD_TXT = [
  '正在解析你填写的维度…',
  '正在映射到大五人格坐标系…',
  '正在计算三维一致性…',
  '正在识别共识与分歧…',
  '正在生成综合画像…'
];

function runMultiAnalysis() {
  // ---------- 组装输入 ----------
  const input = { mbti: null, zodiac: null, bazi: null };

  if (mState.mbtiType) {
    input.mbti = {
      type: mState.mbtiType,
      identity: mState.mbtiIdentity || 'A'   // 未选身份时默认 A
    };
    // 若有 48 题精确百分比，直接带入，走 mbtiToVector() 而非 75% 估算
    if (mState.mbtiPercent) {
      input.mbti.percent = mState.mbtiPercent;
    }
  }

  if (mState.zodiacKey) {
    const s = ZODIAC_DATA.signs.find(x => x.key === mState.zodiacKey);
    // 若有出生日期，走计算以获得交界提示；否则直接用手选数据
    if (mState.birthDate) {
      const [y, m, d] = mState.birthDate.split('-').map(Number);
      const auto = getZodiacSign(m, d);
      input.zodiac = auto && auto.key === mState.zodiacKey
        ? auto
        : { key: s.key, data: s, nearBoundary: false, boundaryNote: '' };
    } else {
      input.zodiac = { key: s.key, data: s, nearBoundary: false, boundaryNote: '' };
    }
  }

  if (mState.birthDate) {
    const [y, m, d] = mState.birthDate.split('-').map(Number);
    const hour = mState.birthHour === '' ? null : Number(mState.birthHour);
    input.bazi = calcBazi(y, m, d, hour);
  }

  mState.result = { syn: synthesize(input), input };

  // ---------- 加载动画 ----------
  go('loading');
  let p = 0, ti = 0;
  $('#load-title').textContent = MULTI_LOAD_TXT[0];
  $('#load-fill').style.width = '0%';

  const timer = setInterval(() => {
    p += 2.6;
    $('#load-fill').style.width = Math.min(p, 100) + '%';
    const nt = Math.min(Math.floor(p / 20), MULTI_LOAD_TXT.length - 1);
    if (nt !== ti) { ti = nt; $('#load-title').textContent = MULTI_LOAD_TXT[ti]; }
    if (p >= 100) {
      clearInterval(timer);
      setTimeout(() => { renderMultiResult(); go('multi'); }, 340);
    }
  }, 40);
}


/* ============================================================
 *  结果渲染
 * ============================================================ */

/* ============================================================
 *  分享区块
 *  成就徽章展示 + 多套风格化文案候选 + 图片生成
 * ============================================================ */
let shareCands = [];      // 当前文案候选
let shareTheme = null;    // 当前配色主题

function buildShareSection(syn, prof, input) {
  const vars = buildVars(syn, prof, input);
  const badges = calcBadges(vars);
  // 只出「共鸣式」一条：不再让用户在 6 套里挑，直接给一句戳心的，
  // 不满意点「换一句」在共鸣式模板里轮换。
  shareCands = generateCopyCandidates(syn, prof, input, { style: 'resonance' });

  const badgeHtml = badges.length ? `
    <div class="ach-wrap">
      <div class="ach-title">🏆 已解锁 ${badges.length} 个成就</div>
      <div class="ach-list">
        ${badges.map(b => `
          <div class="ach" style="--ac:${b.color}">
            <span class="ach-ic">${b.icon}</span>
            <span class="ach-txt"><b>${b.label}</b><i>${b.sub}</i></span>
          </div>`).join('')}
      </div>
    </div>` : '';

  return `<div class="share-sec">
    <h3>发出去，看看谁跟你一样 🎉</h3>
    <p>三维分析报告卡 · 自动生成专属文案</p>

    ${badgeHtml}

    <div class="copy-block">
      <div id="copy-list">${renderCopyCards(shareCands)}</div>
    </div>

    <div class="share-btns">
      <button class="btn-share" id="btn-sum-img">🖼️ 生成分享图</button>
    </div>
  </div>`;
}

/* 单条共鸣式文案卡（无需用户选择，一键复制 + 换一句） */
function renderCopyCards(cands) {
  const c = cands[0];
  if (!c) return '';
  return `
    <div class="cs-card">
      <div class="cs-tag">💭 说中你的那句话</div>
      <div class="cs-text">${c.text.replace(/\n/g, '<br>')}</div>
      <div class="cs-acts">
        <button class="btn-share" id="btn-copy-main">📋 复制文案</button>
        <button class="btn-ghost" id="btn-copy-refresh">🔄 换一句</button>
      </div>
    </div>`;
}

/* 绑定单条文案交互 */
function bindCopyCards() {
  const main = $('#btn-copy-main');
  if (main) main.onclick = () => {
    const c = shareCands[0];
    if (!c) return;
    navigator.clipboard.writeText(c.text)
      .then(() => toast('文案已复制，去粘贴吧 ✨'))
      .catch(() => toast('复制失败，请手动选择文字'));
  };
}

/* 维度对应的 SVG 卡通头像 */
function dimAvatar(d, input) {
  const SIZE = 96;
  try {
    if (d.key === 'mbti' && input.mbti) return mbtiAvatar(input.mbti.type, SIZE, false);
    if (d.key === 'zodiac' && input.zodiac) return zodiacAvatar(input.zodiac.key, SIZE, false);
    if (d.key === 'bazi' && input.bazi) return stemAvatar(input.bazi.dayMaster.cn, SIZE, false);
  } catch (e) { /* 降级 */ }
  return d.face || '🧩';
}

/* 依据徽章 */
function evBadge(level) {
  const L = SOURCES_DATA._meta.evidenceLevels[level];
  if (!L) return '';
  return `<span class="ev-badge ev-${level}" title="${L.desc}">${L.label}</span>`;
}

/* 出处引用列表 */
function srcList(ids) {
  return ids.map(id => {
    const s = SOURCES_DATA.sources[id];
    if (!s) return '';
    const who = s.authors ? s.authors.split(',')[0].trim() : '';
    const where = s.journal || s.publisher || '';
    return `<li class="src-item">
      ${evBadge(s.level)}
      <span class="src-txt"><b>${s.title}</b>${who ? ' · ' + who : ''}${s.year ? ' (' + s.year + ')' : ''}${where ? '，' + where : ''}</span>
    </li>`;
  }).join('');
}

function renderMultiResult() {
  const { syn, input } = mState.result;
  if (!syn) return;

  const wrap = $('#multi-wrap');
  const isSingle = syn.count === 1;

  // 性格总结（由三维融合向量生成）
  const prof = buildProfile(syn);

  /* ---------- 顶部：综合画像卡 ---------- */
  const domTags = syn.dominant.map(d =>
    `<span class="dom-tag" style="--dc:${d.axis.color}">${d.axis.icon} ${d.label}</span>`).join('');

  const heroHtml = `
    <div class="my-hero">
      <div class="my-faces">
        ${syn.dims.map(d => `<span class="my-face" title="${d.label}">${dimAvatar(d, input)}</span>`).join('')}
      </div>
      <h1 class="my-title">你的综合性格画像</h1>
      <p class="my-sub">基于 ${syn.dims.map(d => d.label).join(' + ')} ${syn.count} 个维度</p>
      <div class="my-doms">${domTags}</div>
      ${isSingle ? '' : `
        <div class="my-score" style="--sc:${syn.level.color}">
          <div class="ms-ring">
            <svg viewBox="0 0 120 120">
              <circle class="ms-bg" cx="60" cy="60" r="52"/>
              <circle class="ms-fg" cx="60" cy="60" r="52"
                stroke-dasharray="${(syn.overall / 100 * 326.7).toFixed(1)} 326.7"/>
            </svg>
            <div class="ms-num"><b>${syn.overall}</b><i>%</i></div>
          </div>
          <div class="ms-info">
            <div class="ms-level">${syn.level.label}</div>
            <div class="ms-desc">${syn.level.desc}</div>
            <div class="ms-warn">启发式计算，非科学测量</div>
          </div>
        </div>`}
    </div>`;

  /* ---------- 维度卡片 ---------- */
  const dimCards = syn.dims.map(d => {
    const isMbti = d.key === 'mbti';
    return `
    <div class="dc ${isMbti ? 'dc-primary' : 'dc-second'}">
      <div class="dc-head">
        <span class="dc-face">${dimAvatar(d, input)}</span>
        <div class="dc-titles">
          <span class="dc-label">${d.label}</span>
          <h3 class="dc-name">${d.title}</h3>
          <span class="dc-sub">${d.subtitle}</span>
        </div>
        ${evBadge(d.evidence)}
      </div>
      ${renderDimBody(d, input)}
    </div>`;
  }).join('');

  /* ---------- 特质雷达对比 ---------- */
  const axisHtml = syn.axisRows.map(r => `
    <div class="ax-row">
      <div class="ax-top">
        <span class="ax-name">${r.axis.icon} ${r.axis.cn}</span>
        <span class="ax-avg" style="color:${r.axis.color}">${r.avg}</span>
      </div>
      <div class="ax-scale">
        <span class="ax-end">${r.axis.low}</span>
        <div class="ax-track">
          ${r.values.map(v => `
            <span class="ax-dot ax-${v.key}" style="left:${v.val}%" title="${v.label}: ${v.val}">
              <i>${v.label[0]}</i>
            </span>`).join('')}
          <span class="ax-mid"></span>
        </div>
        <span class="ax-end">${r.axis.high}</span>
      </div>
      <div class="ax-vals">
        ${r.values.map(v => `<span class="ax-v">${v.label} <b>${v.val}</b></span>`).join('')}
      </div>
    </div>`).join('');

  /* ---------- 交叉分析 ---------- */
  let crossHtml = '';
  if (!isSingle) {
    crossHtml = `
    <div class="sec">
      <div class="sec-h"><span class="ic">🔀</span>交叉对比</div>

      <div class="pair-grid">
        ${syn.pairs.map(p => {
          const lv = TRAITS_DATA.consistency.levels.find(l => p.score >= l.min);
          return `<div class="pair-card">
            <div class="pc-names">${p.a} <span>↔</span> ${p.b}</div>
            <div class="pc-bar"><i style="width:${p.score}%;background:${lv.color}"></i></div>
            <div class="pc-score" style="color:${lv.color}"><b>${p.score}%</b> ${lv.label}</div>
          </div>`;
        }).join('')}
      </div>

      ${syn.consensus.length ? `
        <div class="cross-block cb-agree">
          <h4>✨ 三方共识（${syn.consensus.length} 项）</h4>
          <ul>${syn.consensus.map(c => `
            <li><b>${c.axis.cn} → ${c.label}</b>（均值 ${c.avg}）<br><span>${c.desc}</span></li>`).join('')}
          </ul>
        </div>` : ''}

      ${syn.conflicts.length ? `
        <div class="cross-block cb-conflict">
          <h4>⚡ 分歧特质（${syn.conflicts.length} 项）</h4>
          <ul>${syn.conflicts.map(c => `
            <li><b>${c.axis.cn}</b>（相差 ${c.gap} 分）<br><span>${c.desc}</span></li>`).join('')}
          </ul>
          <p class="cb-note">分歧属正常现象：三套体系的来源、方法与假设完全不同，本就不应期待相互印证。</p>
        </div>` : `
        <div class="cross-block cb-agree">
          <h4>✓ 无明显分歧</h4>
          <p style="font-size:13.5px;line-height:1.8;margin:0">各维度在五条特质轴上均未出现超过 ${TRAITS_DATA.consistency.conflictThreshold} 分的差距。</p>
        </div>`}

      <div class="syn-text">${buildSynthesisText(syn)}</div>
    </div>`;
  } else {
    crossHtml = `
    <div class="sec">
      <div class="sec-h"><span class="ic">💡</span>想看交叉对比？</div>
      <p class="sec-p">${buildSynthesisText(syn)}</p>
      <button class="btn-ghost" id="btn-add-dim" style="margin-top:14px">➕ 补充其他维度</button>
    </div>`;
  }

  /* ---------- 方法论说明 ---------- */
  const methodHtml = `
    <div class="sec sec-method">
      <div class="sec-h"><span class="ic">🔬</span>方法与依据</div>

      <div class="method-flow">
        <div class="mf-step"><b>1</b> 三个维度各自映射到大五人格五轴</div>
        <div class="mf-step"><b>2</b> 向量以 50 为中心平移后计算余弦相似度</div>
        <div class="mf-step"><b>3</b> 相似度换算为一致性百分比，差值 ≥${TRAITS_DATA.consistency.conflictThreshold} 标为分歧</div>
      </div>

      <div class="method-warn">
        <b>⚠️ 请这样理解「一致性」</b>
        <p>它衡量的是<b>三套性格描述在文字层面的吻合程度</b>，而非三种方法测量同一人格的收敛效度。
        MBTI→大五 的映射有实测相关系数支持；星座与八字→大五 的映射是我们对其传统描述文本的语义归纳，<b>无实证依据</b>。
        高一致性只说明三套说法碰巧描述相近，不代表结论更可靠。</p>
      </div>

      <details class="src-details">
        <summary>查看全部引用文献（${Object.keys(SOURCES_DATA.sources).length} 条）</summary>
        <div class="src-groups">
          ${['empirical', 'contested', 'heuristic', 'tradition', 'refuted'].map(lv => {
            const ids = Object.keys(SOURCES_DATA.sources).filter(id => SOURCES_DATA.sources[id].level === lv);
            if (!ids.length) return '';
            const L = SOURCES_DATA._meta.evidenceLevels[lv];
            return `<div class="src-group">
              <h5 style="--gc:${L.badgeColor}">${L.label} · ${ids.length} 条</h5>
              <p class="src-gdesc">${L.desc}</p>
              <ul class="src-ul">${srcList(ids)}</ul>
            </div>`;
          }).join('')}
        </div>
      </details>
    </div>`;

  /* ---------- 免责声明 ----------
     改为默认折叠：内容一条没删，但不再阻断情绪。
     摘要行始终可见（保持学术诚实的可见性），
     详细论证收进 <details>，想深究的人点开即可。 */
  const disclaimerHtml = `
    <div class="big-disclaimer bd-fold">
      <details class="bd-details">
        <summary class="bd-summary">
          <span class="bd-sum-ic">⚠️</span>
          <span class="bd-sum-txt">
            <b>重要声明</b>
            <i>MBTI 有实证但存争议 · 星座与八字属传统文化，不具预测效力 · 点击查看完整依据</i>
          </span>
        </summary>
      <div class="bd-head" style="margin-top:16px">详细说明</div>
      <ul>
        <li><b>MBTI</b>：有实证研究基础，但学界对其重测信度存在明确争议——间隔 5 周后约 50% 受测者的类型会发生变化（Pittenger, 2005）。四维度实际呈连续正态分布，而非「非此即彼」的双峰分布（Bess & Harvey, 2002）。</li>
        <li><b>星座</b>：属传统文化内容。发表于《自然》的双盲实验（Carlson, 1985）、2000+ 名时辰双生子追踪（Dean & Kelly, 2003）与 15000+ 样本检验（Hartmann et al., 2006）均未发现出生日期与人格的关联。感到「很准」主要由巴纳姆效应解释（Forer, 1949）。</li>
        <li><b>生辰八字</b>：源自宋明以来的中国传统命理学，是重要的文化遗产，但其性格推断未经实证检验，不具预测效力。本项目的排盘计算（干支历法换算）是可验证的数学，但由此得出的性格解读属传统说法。</li>
        <li><b>综合分析</b>：一致性百分比是本项目的启发式设计，非已发表的实证发现。</li>
      </ul>
      <p class="bd-foot">本工具仅供自我探索与娱乐参考，<b>不可用于</b>招聘筛选、心理诊断、重大人生决策或任何评价他人的场合。如需专业的人格评估，请咨询有资质的心理学专业人士。</p>
      </details>
    </div>`;

  /* ---------- 性格总结（核心区块，放在最前）---------- */
  const summaryHtml = `
    <div class="ps">
      <div class="ps-badge">✦ 三维综合性格总结 ✦</div>

      <div class="ps-arc">
        <div class="ps-arc-face">${archetypeAvatar(prof.archetype.name, 96, false)}</div>
        <div class="ps-arc-txt">
          <span class="ps-arc-label">你的人格原型</span>
          <h2 class="ps-arc-name">${prof.archetype.name}</h2>
          <p class="ps-arc-title">${prof.archetype.title}</p>
        </div>
      </div>

      <p class="ps-arc-desc">${prof.archetype.desc}</p>

      ${prof.archetype.contrastLine ? `
      <div class="ps-contrast-line">「${prof.archetype.contrastLine}」</div>` : ''}

      <div class="ps-one">${prof.oneLiner}</div>

      <div class="ps-block">
        <h4><span class="pb-ic">📖</span>整体来看</h4>
        <p>${prof.narrative}</p>
      </div>

      <div class="ps-two">
        <div class="ps-block ps-half">
          <h4><span class="pb-ic">💼</span>做事风格</h4>
          <ul>${prof.workStyle.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
        <div class="ps-block ps-half">
          <h4><span class="pb-ic">💬</span>人际风格</h4>
          <ul>${prof.socialStyle.map(t => `<li>${t}</li>`).join('')}</ul>
        </div>
      </div>

      <div class="ps-two">
        <div class="ps-block pb-good">
          <h4><span class="pb-ic">💪</span>你的优势</h4>
          <ul>${prof.strengths.map(s =>
            `<li><b style="color:${s.axis.color}">${s.axis.cn}</b>${s.text}</li>`).join('')}</ul>
        </div>
        <div class="ps-block pb-adv">
          <h4><span class="pb-ic">🌱</span>可以试试</h4>
          <ul>${prof.advices.map(a =>
            `<li><b style="color:${a.axis.color}">${a.axis.cn}</b>${a.text}</li>`).join('')}</ul>
        </div>
      </div>

      ${prof.tensions.length ? `
        <div class="ps-block pb-tension">
          <h4><span class="pb-ic">⚡</span>你身上的张力</h4>
          <ul>${prof.tensions.map(t => `<li>${t.text}</li>`).join('')}</ul>
        </div>` : ''}

      <div class="ps-insight">
        <span class="pi-ic">🔍</span>
        <div>
          <b>关于这份总结的可信度</b>
          <p>${prof.insight}</p>
        </div>
      </div>

      <div class="ps-src">
        ${evBadge('heuristic')}
        <span>总结由三个维度融合后的大五人格向量生成。各维度定义参考 Costa &amp; McCrae (1992) NEO-PI-R，融合方式为本项目设计，非独立的人格测量。</span>
      </div>
    </div>`;

  /* ---------- 组装 ---------- */
  /* ---------- 组装 ----------
     区块顺序经过转化漏斗优化：

     旧顺序的问题：分享区排第 9 位，且深色大免责声明（434 字）
     紧贴其前。用户刚看完「我是稀有人格」的情绪高点，
     立刻读到「MBTI 重测信度只有 50%」「占星已被实证否证」，
     情绪散掉之后才看到分享按钮。

     新顺序：画像 → 总结 → 分享（趁高点）→ 详情 → 严谨性（可折叠）
     严谨性内容一条没删，只是从「路障」变成「可查阅的背书」。 */
  wrap.innerHTML = (window.__sharedView ? `
    <div class="shared-banner">
      <div class="sb-txt">
        <b>这是 TA 的性格报告</b>
        <span>${syn.dims.map(d => d.label).join(' + ')} · 你也来测测看</span>
      </div>
      <button class="btn-share sb-btn" id="btn-me-too">🧩 测测我自己</button>
    </div>` : '')
    + heroHtml
    + summaryHtml
    + buildShareSection(syn, prof, input)   // ← 上移到情绪高点
    + `<div class="sec"><div class="sec-h"><span class="ic">🧩</span>三个维度分别怎么说</div></div>`
    + `<div class="dc-grid">${dimCards}</div>`
    + `<div class="sec"><div class="sec-h"><span class="ic">📊</span>五维特质对比${isSingle ? '' : '<span class="sec-tip">同一轴上三点越接近＝越一致</span>'}</div>${axisHtml}</div>`
    + crossHtml
    + methodHtml
    + disclaimerHtml
    + `<div class="result-foot">
        <button class="btn-ghost" id="btn-multi-edit">✏️ 修改填写</button>
        <button class="btn-ghost" id="btn-multi-home">🏠 回到首页</button>
      </div>`
    + `<div class="modal" id="sum-modal">
        <div class="modal-inner">
          <img id="sum-modal-img" alt="性格分析卡">
          <p class="modal-tip">长按图片保存到相册<br>或点击下方按钮下载</p>
          <div class="modal-acts">
            <button class="modal-close" id="btn-sum-dl">⬇️ 下载图片</button>
            <button class="modal-close alt2" id="btn-sum-retheme">🎨 换个配色</button>
            <button class="modal-close alt2" id="btn-sum-close">关闭</button>
          </div>
        </div>
      </div>`;

  bindMultiResult();
  writeMultiUrl();
  window.scrollTo({ top: 0 });
}

/* 把当前三维结果编码进地址栏（供分享链接使用） */
function writeMultiUrl() {
  const { input } = mState.result;
  if (typeof writeResultUrl !== 'function') return;

  const mbtiObj = input.mbti
    ? { type: input.mbti.type, identity: input.mbti.identity, percent: input.mbti.percent || null }
    : null;
  const zodiacKey = input.zodiac ? input.zodiac.key : null;
  const baziParam = mState.birthDate
    ? mState.birthDate + (mState.birthHour !== '' && mState.birthHour !== null && mState.birthHour !== undefined ? '-' + mState.birthHour : '')
    : null;

  writeResultUrl(mbtiObj, zodiacKey, baziParam);
}

/* ---------- 各维度详情区块 ---------- */
function renderDimBody(d, input) {
  if (d.key === 'mbti') {
    const T = TYPES[input.mbti.type];
    return `
      <div class="dc-body">
        <p class="dc-desc">${T.desc}</p>
        <div class="dc-tags">
          ${T.strengths.slice(0, 4).map(s => `<span class="tag tag-good">${s}</span>`).join('')}
        </div>
        ${d.estimated ? `<p class="dc-note">💡 你是手动选择的类型，向量按典型强度（75%）估算。<button class="link-btn" id="btn-do-quiz-inline">做 48 题测试可得精确百分比 →</button></p>` : ''}
      </div>`;
  }

  if (d.key === 'zodiac') {
    const z = input.zodiac.data;
    const el = ZODIAC_DATA.elements[z.element];
    return `
      <div class="dc-body">
        <div class="zo-meta">
          <span class="zm-chip" style="--zc:${el.color}">${el.cn}</span>
          <span class="zm-chip">${z.qualityCn}</span>
          <span class="zm-chip">守护星 ${z.ruler}</span>
        </div>
        <p class="dc-desc">${z.desc}</p>
        <div class="dc-tags">
          ${z.keywords.map(k => `<span class="tag" style="--tc:${el.color}33">${k}</span>`).join('')}
        </div>
        ${input.zodiac.nearBoundary ? `<p class="dc-note warn-txt">⚠️ ${input.zodiac.boundaryNote}</p>` : ''}
      </div>`;
  }

  if (d.key === 'bazi') {
    const b = input.bazi;
    const cols = [
      { l: '年柱', p: b.pillars.year },
      { l: '月柱', p: b.pillars.month },
      { l: '日柱', p: b.pillars.day }
    ];
    if (b.pillars.hour) cols.push({ l: '时柱', p: b.pillars.hour });

    return `
      <div class="dc-body">
        <div class="bz-pillars">
          ${cols.map(c => `
            <div class="bzp${c.l === '日柱' ? ' bzp-main' : ''}">
              <span class="bzp-l">${c.l}</span>
              <span class="bzp-gz">${c.p.cn}</span>
              <span class="bzp-el">${c.p.elementCn}</span>
            </div>`).join('')}
          ${!b.hasHour ? '<div class="bzp bzp-empty"><span class="bzp-l">时柱</span><span class="bzp-gz">—</span><span class="bzp-el">未填</span></div>' : ''}
        </div>

        <p class="dc-desc">${b.dayMaster.desc}</p>

        <div class="wx-block">
          <div class="wx-title">五行分布${b.hasHour ? '（四柱八字）' : '（三柱六字）'}</div>
          <div class="wx-bars">
            ${b.elements.map(e => `
              <div class="wx-row">
                <span class="wx-name">${e.data.face} ${e.data.cn}</span>
                <div class="wx-track"><i style="width:${Math.max(e.pct, 3)}%;background:${e.data.color}"></i></div>
                <span class="wx-cnt">${e.count}</span>
                <span class="wx-lv" style="color:${e.color}">${e.level}</span>
              </div>`).join('')}
          </div>
          <p class="wx-note">
            ${b.strongest.count >= 4 ? `${b.strongest.data.cn}偏旺：${b.strongest.data.excess}。` : ''}
            ${b.weakest.count === 0 ? `${b.weakest.data.cn}缺失：${b.weakest.data.lack}。` : ''}
          </p>
        </div>

        <div class="dc-notes">
          ${b.lichunAdjusted ? `<p class="dc-note">📌 你的生日在立春前，按命理惯例年柱算作 ${b.adjustedYear} 年。</p>` : ''}
          ${b.notes.map(n => `<p class="dc-note">📐 ${n}</p>`).join('')}
        </div>
      </div>`;
  }
  return '';
}

/* ---------- 结果页事件 ---------- */
function bindMultiResult() {
  const edit = $('#btn-multi-edit');
  if (edit) edit.onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('form'); };

  const home = $('#btn-multi-home');
  if (home) home.onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('home'); };

  const add = $('#btn-add-dim');
  if (add) add.onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('form'); };

  const meToo = $('#btn-me-too');
  if (meToo) meToo.onclick = () => {
    if (typeof resetSharedView === 'function') resetSharedView();
    state.idx = 0;
    state.answers.fill(null);
    render();
    go('quiz');
  };

  const quiz = $('#btn-do-quiz-inline');
  if (quiz) quiz.onclick = () => {
    if (typeof resetSharedView === 'function') resetSharedView();
    state.idx = 0;
    state.answers.fill(null);
    render();
    go('quiz');
  };

  /* ---------- 分享 ---------- */
  const { syn, input } = mState.result;
  const prof = buildProfile(syn);

  bindCopyCards();

  // 换一句（仍在共鸣式模板里轮换，不出其它风格）
  const refresh = $('#btn-copy-refresh');
  if (refresh) refresh.onclick = () => {
    shareCands = regenerateCopyCandidates(syn, prof, input, { style: 'resonance' });
    $('#copy-list').innerHTML = renderCopyCards(shareCands);
    bindCopyCards();
    toast('换了一句 ✨');
  };

  // 生成分享图
  async function drawCard(theme) {
    toast('正在生成分享卡…');
    try {
      const r = await buildShareCardV2(syn, prof, input, { theme });
      shareTheme = r.theme;
      $('#sum-modal-img').src = r.dataUrl;
      $('#sum-modal').classList.add('on');
    } catch (e) {
      console.error(e);
      toast('生成失败了，再试一次？');
    }
  }

  const imgBtn = $('#btn-sum-img');
  if (imgBtn) imgBtn.onclick = () => drawCard(null);

  // 换配色重新生成
  const reTheme = $('#btn-sum-retheme');
  if (reTheme) reTheme.onclick = async e => {
    e.stopPropagation();
    const list = SHARE_COPY_DATA.themes.list;
    const others = list.filter(t => !shareTheme || t.id !== shareTheme.id);
    const next = others[Math.floor(Math.random() * others.length)];
    await drawCard(next);
    toast('已换成「' + next.name + '」配色');
  };

  const mClose = $('#btn-sum-close');
  if (mClose) mClose.onclick = () => $('#sum-modal').classList.remove('on');

  const modal = $('#sum-modal');
  if (modal) modal.onclick = e => {
    if (e.target && e.target.id === 'sum-modal') modal.classList.remove('on');
  };

  const dl = $('#btn-sum-dl');
  if (dl) dl.onclick = e => {
    e.stopPropagation();
    const a = document.createElement('a');
    a.href = $('#sum-modal-img').src;
    a.download = `三维人格-${prof.archetype.name}.png`;
    a.click();
    toast('已保存 📥');
  };
}


/* ============================================================
 *  初始化
 * ============================================================ */
function initMulti() {
  buildMbtiPicker();
  bindIdentity();
  buildZodiacPicker();
  buildHourSelect();
  bindBirthDate();
  updateFormStatus();

  $('#btn-multi').onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('form'); };
  $('#btn-form-back').onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('home'); };
  $('#btn-analyze').onclick = runMultiAnalysis;

  $('#btn-goto-quiz').onclick = () => {
    if (typeof resetSharedView === 'function') resetSharedView();
    state.idx = 0;
    state.answers.fill(null);
    render();
    go('quiz');
  };
}

initMulti();
