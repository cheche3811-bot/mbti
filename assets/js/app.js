/* ============================================================
 *  MBTI 测试 · 主逻辑
 * ============================================================ */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const state = {
  idx: 0,
  answers: new Array(QUESTIONS.length).fill(null),
  result: null
};

const DIM_TAG_TEXT = {
  EI: { txt: '能量', color: '#FFD84D' },
  SN: { txt: '认知', color: '#7DDCC0' },
  TF: { txt: '决策', color: '#8FC9F5' },
  JP: { txt: '节奏', color: '#C4A9F5' },
  AT: { txt: '自我', color: '#FF9EC4' }
};

/* ---------- 屏幕切换 ---------- */
function go(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#screen-' + id).classList.add('active');
  window.scrollTo({ top: 0 });
}

/* ---------- 构建量表按钮 ---------- */
function buildScale() {
  const wrap = $('#scale');
  wrap.innerHTML = '';
  SCALE.forEach((s, i) => {
    const d = document.createElement('button');
    const cls = s.v > 0 ? 'agree' : s.v < 0 ? 'dis' : 'neutral';
    d.className = 'dot ' + cls;
    d.style.width = s.size + 'px';
 d.style.height = s.size + 'px';
    d.dataset.v = s.v;
    d.dataset.label = s.label;
    d.setAttribute('aria-label', s.label);
    d.addEventListener('click', () => answer(s.v));
    wrap.appendChild(d);
  });
}

/* ---------- 渲染当前题 ---------- */
function render() {
  const q = QUESTIONS[state.idx];
  const card = $('#q-card');

  card.classList.remove('flip');
  void card.offsetWidth;
  card.classList.add('flip');

  $('#q-index').textContent = 'Q' + (state.idx + 1);
  $('#q-text').textContent = q.t;
  $('#q-now').textContent = state.idx + 1;
  $('#prog-fill').style.width = ((state.idx) / QUESTIONS.length * 100 + 2) + '%';
  $('#btn-prev').disabled = state.idx === 0;

  const tag = DIM_TAG_TEXT[q.dim];
  $('#dim-tag').textContent = tag.txt;
  $('#dim-tag').style.background = tag.color;

  // 回显已选
  const cur = state.answers[state.idx];
  $$('#scale .dot').forEach(d => {
    d.classList.toggle('on', cur !== null && +d.dataset.v === cur);
  });
}

/* ---------- 作答 ---------- */
let locking = false;
function answer(v) {
  if (locking) return;
  state.answers[state.idx] = v;

  $$('#scale .dot').forEach(d => d.classList.toggle('on', +d.dataset.v === v));

  locking = true;
  setTimeout(() => {
    locking = false;
    if (state.idx < QUESTIONS.length - 1) {
      state.idx++;
      render();
    } else {
      $('#prog-fill').style.width = '100%';
    finish();
    }
  }, 230);
}

/* ---------- 计算 & 加载动画 ---------- */
const LOAD_TXT = [
  '正在分析你的能量来源…',
  '正在解读你的认知偏好…',
  '正在推演你的决策方式…',
  '正在匹配 16 型人格库…',
  '正在生成你的专属人格卡…'
];

function finish() {
  state.result = calculate(state.answers);
  go('loading');

  let p = 0, ti = 0;
  $('#load-title').textContent = LOAD_TXT[0];

  const timer = setInterval(() => {
    p += 2.2;
    $('#load-fill').style.width = Math.min(p, 100) + '%';

    const nt = Math.min(Math.floor(p / 20), LOAD_TXT.length - 1);
    if (nt !== ti) { ti = nt; $('#load-title').textContent = LOAD_TXT[ti]; }

    if (p >= 100) {
      clearInterval(timer);
      setTimeout(() => { renderResult(); go('result'); }, 380);
    }
  }, 42);
}

/* ---------- 结果页渲染 ---------- */
function renderResult() {
  const r = state.result;
  const T = TYPES[r.type];
  const G = GROUPS[T.group];
  const ID = IDENTITY[r.identity];

  const rare = parseFloat(T.pct) < 4;

  const dimHtml = ['EI', 'SN', 'TF', 'JP', 'AT'].map(d => {
    const p = r.percent[d];
    const L = DIM_LABEL[d];
  const isFirst = p.firstPct >= 50;
    const shown = isFirst ? p.firstPct : p.secondPct;
    const name = isFirst ? L.first : L.second;
    const letter = isFirst ? p.first : p.second;
    const colors = { EI: '#FFD84D', SN: '#7DDCC0', TF: '#8FC9F5', JP: '#C4A9F5', AT: '#FF9EC4' };
    const vague = shown <= 58; // 倾向不明显
    return `
      <div class="dim-row">
        <div class="dim-top">
  <span class="dl">${name}<b>（${letter}）</b>${vague ? '<span class="dvague">倾向不明显</span>' : ''}<span class="dtip">${L.tip}</span></span>
      <span class="dv">${shown}%</span>
      </div>
        <div class="dim-bar"><i data-w="${shown}" style="background:${colors[d]}"></i></div>
        <div class="dim-foot"><span>${L.first} ${p.firstPct}%</span><span>${p.secondPct}% ${L.second}</span></div>
      </div>`;
  }).join('');

  const matchHtml = T.match.map(m => `
    <div class="match-card">
   <div class="mf">${typeof mbtiAvatar === "function" ? mbtiAvatar(m, 56, false) : TYPES[m].face}</div>
      <div class="mc">${m}</div>
      <div class="mn">${TYPES[m].cn}</div>
    </div>`).join('');

  $('#result-wrap').innerHTML = `
    <div class="hero-card" style="--gc:${G.light}">
      ${rare ? `<div class="hc-rare">稀有 · 仅 ${T.pct}</div>` : ''}
      <div class="hc-face">${typeof mbtiAvatar === "function" ? mbtiAvatar(r.type, 108, false) : T.face}</div>
      <div class="hc-code" style="color:${G.color}">${r.full}</div>
      <div class="hc-cn">${T.cn}</div>
      <div class="hc-title">${T.title}</div>
      <div class="hc-meta">
        <span class="hc-chip">${G.emoji} ${G.name}</span>
      <span class="hc-chip">👥 人群占比 ${T.pct}</span>
     <span class="hc-chip">${r.identity === 'A' ? '💎' : '🌊'} ${ID.name}</span>
      </div>
    </div>

    <div class="quote-card"><span>${T.slogan}</span></div>

    <div class="sec">
      <div class="sec-h"><span class="ic">📖</span>这就是你</div>
      <p class="sec-p">${T.desc}</p>
    </div>

    <div class="sec">
      <div class="sec-h"><span class="ic">📊</span>五维度倾向</div>
  ${dimHtml}
      <p class="sec-p" style="margin-top:16px;padding-top:16px;border-top:2px dashed rgba(43,34,51,.15)">
        <b>${ID.name}（${r.identity}）：</b>${ID.desc}
  </p>
    </div>

    <div class="two-col">
      <div class="col-card col-good">
        <h4>💪 你的天赋</h4>
        <ul>${T.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
      <div class="col-card col-bad">
        <h4>🌱 成长空间</h4>
        <ul>${T.weakness.map(s => `<li>${s}</li>`).join('')}</ul>
      </div>
  </div>

    <div class="sec">
      <div class="sec-h"><span class="ic">🧩</span>认知功能栈</div>
      <div class="tags">
        ${T.funcs.map((f, i) => {
          const tone = ['#FFD84D', '#7DDCC0', '#8FC9F5', '#F1EDF5'][i];
      const rank = ['主导', '辅助', '第三', '劣势'][i];
        return `<span class="tag" style="--tc:${tone}">${rank} · ${f}</span>`;
        }).join('')}
 </div>
    </div>

    <div class="sec">
      <div class="sec-h"><span class="ic">💼</span>适合你的方向</div>
    <div class="tags">
     ${T.jobs.map(j => `<span class="tag" style="--tc:#E8F6FF">${j}</span>`).join('')}
      </div>
      <p class="sec-p" style="margin-top:14px;font-size:13px;color:#6B6076">
  同类型的人：${T.famous.join(' · ')}
      </p>
  </div>

    <div class="sec">
      <div class="sec-h"><span class="ic">💗</span>关系里的你</div>
      <p class="sec-p">${T.love}</p>
   <div class="match-row" style="margin-top:18px">${matchHtml}</div>
      <p class="sec-p" style="margin-top:12px;font-size:12.5px;color:#6B6076">
        以上为认知功能互补型，仅供参考，真实关系远比类型复杂。
      </p>
 </div>

    <div class="share-sec">
      <h3>把你的人格卡带走 🎉</h3>
      <p>生成一张专属长图，发朋友圈看看<br>朋友们都是什么型</p>
      <div class="share-btns">
        <button class="btn-share" id="btn-img">🖼️ 生成分享图</button>
        <button class="btn-share alt" id="btn-copy">🔗 复制文案</button>
      </div>
    </div>

    <div class="result-foot">
      <button class="btn-ghost" id="btn-again">🔄 重新测一次</button>
 <button class="btn-ghost" id="btn-home">🏠 回到首页</button>
    </div>

    <p class="disclaimer">
      本测试基于荣格心理类型理论与 MBTI 四维度模型设计，采用七级李克特量表计分。<br>
      结果反映的是你当下的行为偏好倾向，不是能力评价，也非临床诊断工具。
    </p>

    <div class="modal" id="modal">
      <div class="modal-inner">
        <img id="modal-img" alt="人格分享卡">
        <p class="modal-tip">长按图片保存到相册<br>或点击下方按钮下载</p>
        <button class="modal-close" id="btn-dl">⬇️ 下载图片</button>
        <button class="modal-close" id="btn-mclose" style="background:rgba(255,255,255,.2);color:#fff;margin-left:8px">关闭</button>
      </div>
    </div>
  `;

  // 维度条动画
  requestAnimationFrame(() => {
    setTimeout(() => {
      $$('.dim-bar i').forEach(el => { el.style.width = el.dataset.w + '%'; });
    }, 120);
  });

  bindResult();
}

/* ---------- 结果页事件 ---------- */
function bindResult() {
  const r = state.result;
  const T = TYPES[r.type];

  $('#btn-again').onclick = () => {
    state.idx = 0;
    state.answers.fill(null);
    render();
    go('quiz');
  };
  $('#btn-home').onclick = () => go('home');

  $('#btn-copy').onclick = () => {
    const txt = `我的 MBTI 人格是 ${r.full}「${T.cn}」— ${T.title}\n\n${T.slogan}\n\n全球仅 ${T.pct} 的人是这一型。你是哪一型？来测测看 👉`;
    navigator.clipboard.writeText(txt)
      .then(() => toast('文案已复制，去粘贴吧 ✨'))
      .catch(() => toast('复制失败，请手动选择文字'));
  };

  $('#btn-img').onclick = async () => {
    toast('正在绘制你的人格卡…');
    try {
      const url = await buildShareImage(r, T, GROUPS[T.group], IDENTITY[r.identity]);
      $('#modal-img').src = url;
      $('#modal').classList.add('on');
    } catch (e) {
      console.error(e);
      toast('生成失败了，再试一次？');
    }
  };

  $('#btn-mclose').onclick = () => $('#modal').classList.remove('on');
  $('#modal').onclick = e => { if (e.target.id === 'modal') $('#modal').classList.remove('on'); };

  $('#btn-dl').onclick = () => {
    const a = document.createElement('a');
    a.href = $('#modal-img').src;
    a.download = `MBTI-${r.full}-人格卡.png`;
    a.click();
  toast('已保存 📥');
};
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  let el = $('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add('on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('on'), 2200);
}

/* ---------- 初始化 ---------- */
buildScale();

$('#btn-start').onclick = () => {
  state.idx = 0;
  state.answers.fill(null);
  render();
  go('quiz');
};

$('#btn-prev').onclick = () => {
  if (state.idx > 0) { state.idx--; render(); }
};

/* 键盘 1-7 快速作答 */
document.addEventListener('keydown', e => {
  if (!$('#screen-quiz').classList.contains('active')) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 7) answer(SCALE[n - 1].v);
  if (e.key === 'ArrowLeft' && state.idx > 0) { state.idx--; render(); }
});
