/* ============================================================
 *  双人契合度 · 表单交互与结果渲染
 *
 *  沿用 app.js 的 $ / $$ 简写、go() 切屏。
 *  两人各填：星座（必填）+ MBTI（选填）+ 生日（选填，算八字）。
 *  引擎在 compatibility.js（coupleMatch / findBestMatch）。
 * ============================================================ */

const pairState = {
  a: { zodiacKey: null, mbtiType: null, mbtiIdentity: null, birthDate: null },
  b: { zodiacKey: null, mbtiType: null, mbtiIdentity: null, birthDate: null },
  result: null
};

/* ---------- 构建一套星座选择器 ---------- */
function buildPairZodiac(gridId, person) {
  const grid = $(gridId);
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
      person.zodiacKey = person.zodiacKey === k ? null : k;
      grid.querySelectorAll('.zo-item').forEach(b => b.classList.toggle('on', b.dataset.key === person.zodiacKey));
      updatePairStatus();
    });
  });
}

/* ---------- 构建一套 MBTI 选择器 ---------- */
function buildPairMbti(gridId, person) {
  const grid = $(gridId);
  if (!grid) return;
  const order = ['analyst', 'diplomat', 'sentinel', 'explorer'];
  const sorted = Object.keys(TYPES).sort((a, b) => {
    const ga = order.indexOf(TYPES[a].group), gb = order.indexOf(TYPES[b].group);
    return ga !== gb ? ga - gb : a.localeCompare(b);
  });
  grid.innerHTML = sorted.map(code => {
    const T = TYPES[code], G = GROUPS[T.group];
    return `<button class="mp-item" data-code="${code}" style="--mc:${G.light};--mcd:${G.color}">
      <span class="mp-face">${mbtiAvatar(code, 38, false)}</span>
      <span class="mp-code">${code}</span>
      <span class="mp-cn">${T.cn}</span>
    </button>`;
  }).join('');
  grid.querySelectorAll('.mp-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.dataset.code;
      person.mbtiType = person.mbtiType === code ? null : code;
      grid.querySelectorAll('.mp-item').forEach(b => b.classList.toggle('on', b.dataset.code === person.mbtiType));
      updatePairStatus();
    });
  });
}

/* ---------- 生日联动：自动算星座 + 八字 ---------- */
function bindPairBirth(inputId, person, gridId) {
  const inp = $(inputId);
  if (!inp) return;
  inp.addEventListener('change', () => {
    person.birthDate = inp.value || null;
    if (person.birthDate) {
      const [y, m, d] = person.birthDate.split('-').map(Number);
      const z = getZodiacSign(m, d);
      if (z) {
        person.zodiacKey = z.key;
        const g = $(gridId);
        if (g) g.querySelectorAll('.zo-item').forEach(b => b.classList.toggle('on', b.dataset.key === z.key));
      }
    }
    updatePairStatus();
  });
}

/* ---------- 按钮可用性：两人星座都选了才可分析 ---------- */
function updatePairStatus() {
  const st = $('#pair-status');
  const btn = $('#btn-pair-analyze');
  const ready = pairState.a.zodiacKey && pairState.b.zodiacKey;
  if (ready) {
    st.textContent = `已选：${pairState.a.zodiacKey ? '你 ✓' : '你 ✗'} · ${pairState.b.zodiacKey ? 'TA ✓' : 'TA ✗'}`;
    st.className = 'form-status on';
    btn.disabled = false;
  } else {
    st.textContent = '先选两个人的星座（MBTI 和生日选填）';
    st.className = 'form-status';
    btn.disabled = true;
  }
}

/* ---------- 把表单状态组装成 synthesize 输入 ---------- */
function buildPairInput(p) {
  const input = { mbti: null, zodiac: null, bazi: null };
  if (p.mbtiType) {
    input.mbti = { type: p.mbtiType, identity: p.mbtiIdentity || 'A' };
  }
  if (p.zodiacKey) {
    const s = ZODIAC_DATA.signs.find(x => x.key === p.zodiacKey);
    if (s) input.zodiac = { key: s.key, data: s, nearBoundary: false, boundaryNote: '' };
  }
  if (p.birthDate) {
    const [y, m, d] = p.birthDate.split('-').map(Number);
    input.bazi = calcBazi(y, m, d, null);
  }
  return input;
}

/* ---------- 执行匹配 ---------- */
function runPairAnalysis() {
  const inputA = buildPairInput(pairState.a);
  const inputB = buildPairInput(pairState.b);
  const match = coupleMatch(inputA, inputB);
  if (!match) { toast('请先选两个人的星座'); return; }
  pairState.result = { match, inputA, inputB };
  renderPairResult();
  go('pair-result');
}

/* ---------- 结果渲染 ---------- */
function renderPairResult() {
  const { match, inputA, inputB } = pairState.result;
  if (!match) return;
  const wrap = $('#pair-result-wrap');

  // 自己（A）的单人画像
  const selfSyn = synthesize(inputA);
  const selfProf = selfSyn ? buildProfile(selfSyn) : null;

  // 理想型
  const best = findBestMatch(inputA);

  const aZ = pairState.a.zodiacKey ? ZODIAC_DATA.signs.find(s => s.key === pairState.a.zodiacKey) : null;
  const bZ = pairState.b.zodiacKey ? ZODIAC_DATA.signs.find(s => s.key === pairState.b.zodiacKey) : null;

  /* 契合度大卡 */
  const heroHtml = `
    <div class="pair-hero" style="--pc:${match.level.color}">
      <div class="ph-faces">
        <span class="ph-face">${aZ ? zodiacAvatar(aZ.key, 64, false) : '❓'}</span>
        <span class="ph-heart">💞</span>
        <span class="ph-face">${bZ ? zodiacAvatar(bZ.key, 64, false) : '❓'}</span>
      </div>
      <div class="ph-caption">${aZ ? aZ.cn : '?'} × ${bZ ? bZ.cn : '?'}</div>
      <div class="ph-ring" style="--sc:${match.level.color}">
        <svg viewBox="0 0 140 140">
          <circle class="pr-bg" cx="70" cy="70" r="60"/>
          <circle class="pr-fg" cx="70" cy="70" r="60"
            stroke-dasharray="${(match.score / 100 * 376.99).toFixed(1)} 376.99"/>
        </svg>
        <div class="pr-num"><b>${match.score}</b><i>%</i></div>
      </div>
      <div class="ph-level">${match.level.face} ${match.level.label}</div>
      <p class="ph-desc">${match.level.desc}</p>
    </div>`;

  /* 相处建议 */
  const adviceHtml = `
    <div class="sec">
      <div class="sec-h"><span class="ic">💬</span>相处建议</div>
      <div class="pair-advice">
        ${match.advice.map((a, i) => `
          <div class="pa-item">
            <span class="pa-idx">${i + 1}</span>
            <p class="pa-text">${a.text}</p>
          </div>`).join('')}
      </div>
    </div>`;

  /* 自己的人格 */
  const selfHtml = selfProf ? `
    <div class="sec">
      <div class="sec-h"><span class="ic">🧩</span>你的人格画像</div>
      <div class="pair-self">
        <div class="ps-arc-face">${archetypeAvatar(selfProf.archetype.name, 72, false)}</div>
        <div class="ps-arc-txt">
          <span class="ps-arc-label">你的人格原型</span>
          <h3 class="ps-arc-name">${selfProf.archetype.name}</h3>
          <p class="ps-arc-title">${selfProf.archetype.title}</p>
        </div>
      </div>
      <p class="sec-p">${selfProf.archetype.desc}</p>
      ${selfProf.archetype.contrastLine ? `<div class="ps-contrast-line">「${selfProf.archetype.contrastLine}」</div>` : ''}
    </div>` : '';

  /* 理想型 */
  const bestHtml = best.length ? `
    <div class="sec">
      <div class="sec-h"><span class="ic">💘</span>你的理想型长这样</div>
      <p class="sec-p">${COMPAT_DATA.bestMatch.desc}</p>
      <div class="pair-best">
        ${best.map(b => `
          <div class="pb-item">
            <span class="pb-face">${mbtiAvatar(b.type, 44, false)}</span>
            <div class="pb-info">
              <b>${b.type} · ${b.signCn}</b>
              <i>契合度 ${b.score}%</i>
            </div>
          </div>`).join('')}
      </div>
    </div>` : '';

  const disclaimer = `
    <div class="big-disclaimer bd-fold">
      <details class="bd-details">
        <summary class="bd-summary">
          <span class="bd-sum-ic">⚠️</span>
          <span class="bd-sum-txt"><b>重要声明</b><i>契合度为启发式计算，不构成科学配对结论 · 点击查看完整依据</i></span>
        </summary>
        <div class="bd-head" style="margin-top:16px">详细说明</div>
        <p style="font-size:13px;line-height:1.9;color:var(--ink-2);margin:0">${COMPAT_DATA._meta.disclaimer}</p>
      </details>
    </div>`;

  wrap.innerHTML = heroHtml + adviceHtml + selfHtml + bestHtml + disclaimer
    + `<div class="result-foot">
        <button class="btn-ghost" id="btn-pair-again">🔄 重新填写</button>
        <button class="btn-ghost" id="btn-pair-home">🏠 回到首页</button>
      </div>`;

  const again = $('#btn-pair-again');
  if (again) again.onclick = () => go('pair');
  const home = $('#btn-pair-home');
  if (home) home.onclick = () => { if (typeof resetSharedView === 'function') resetSharedView(); go('home'); };
  window.scrollTo({ top: 0 });
}

/* ---------- 初始化 ---------- */
function initPair() {
  buildPairZodiac('#zo-grid-a', pairState.a);
  buildPairZodiac('#zo-grid-b', pairState.b);
  buildPairMbti('#mp-grid-a', pairState.a);
  buildPairMbti('#mp-grid-b', pairState.b);
  bindPairBirth('#in-birth-a', pairState.a, '#zo-grid-a');
  bindPairBirth('#in-birth-b', pairState.b, '#zo-grid-b');
  updatePairStatus();

  $('#btn-pair').onclick = () => go('pair');
  $('#btn-pair-back').onclick = () => go('home');
  $('#btn-pair-analyze').onclick = runPairAnalysis;
}

initPair();
