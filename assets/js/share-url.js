/* ============================================================
 *  分享 URL 回流：结果参数化 + 打开他人结果
 *
 *  职责：
 *  1. 结果页把当前结果编码进地址栏（可复制链接 / 发朋友圈）
 *  2. 打开带参数的链接时，重建结果并渲染 + 显示「测测我自己」
 *  3. 分享文案里的链接自动指向「带结果参数」的专属 URL
 *
 *  参数约定：
 *    t=INFJ-A          MBTI 类型 + 身份
 *    p=82,35,71,58,90  五维精确百分比（EI,SN,TF,JP,AT 的 firstPct）
 *    z=taurus          星座 key
 *    b=1990-05-15-14   出生日期-时辰（时辰可省略）
 *
 *  ⚠️ 本文件依赖其它脚本已加载的全局：TYPES / ZODIAC_DATA /
 *     getZodiacSign / state / renderResult / go / mState / runMultiAnalysis。
 *     因此必须放在 <body> 末尾、multi.js 之后加载。
 * ============================================================ */

const SHARE_P_KEYS = ['EI', 'SN', 'TF', 'JP', 'AT'];

/* 去掉 query/hash 的站点基础 URL（GitHub Pages 与本地 file:// 均可用） */
function baseUrl() {
  return location.href.split('?')[0].split('#')[0];
}

/* 组装结果参数查询串 */
function buildResultQuery(mbti, zodiac, bazi) {
  const p = [];
  if (mbti && mbti.type) {
    let t = mbti.type;
    if (mbti.identity) t += '-' + mbti.identity;
    p.push('t=' + encodeURIComponent(t));
    if (mbti.percent) {
      p.push('p=' + SHARE_P_KEYS.map(k =>
        (mbti.percent[k] && typeof mbti.percent[k].firstPct === 'number')
          ? mbti.percent[k].firstPct : 50).join(','));
    }
  }
  if (zodiac) p.push('z=' + encodeURIComponent(zodiac));
  if (bazi) p.push('b=' + encodeURIComponent(bazi));
  return p.join('&');
}

/* 把当前结果写进地址栏（replaceState 不产生历史记录），返回完整链接 */
function writeResultUrl(mbti, zodiac, bazi) {
  const q = buildResultQuery(mbti, zodiac, bazi);
  const url = baseUrl() + (q ? '?' + q : '');
  try { history.replaceState(null, '', url); } catch (e) { /* file:// 等场景忽略 */ }
  window.__currentShareUrl = url;
  return url;
}

/* 解析地址栏参数为结构化输入 */
function parseShareParams() {
  const sp = new URLSearchParams(location.search);
  const out = { mbti: null, zodiac: null, bazi: null };

  const t = sp.get('t');
  if (t) {
    const parts = t.toUpperCase().split('-');
    const type = parts[0];
    const identity = parts[1] || 'A';
    if (TYPES && TYPES[type]) {
      out.mbti = { type, identity };
      const p = sp.get('p');
      if (p) {
        const vals = p.split(',').map(Number);
        if (vals.length === 5 && vals.every(v => Number.isFinite(v) && v >= 0 && v <= 100)) {
          out.mbti.percent = {};
          SHARE_P_KEYS.forEach((k, i) => {
            out.mbti.percent[k] = { firstPct: vals[i], secondPct: 100 - vals[i] };
          });
        }
      }
    }
  }

  const z = sp.get('z');
  if (z) {
    const key = z.toLowerCase();
    if (ZODIAC_DATA && ZODIAC_DATA.signs.some(s => s.key === key)) out.zodiac = key;
  }

  const b = sp.get('b');
  if (b && /^\d{4}-\d{2}-\d{2}(-\d{1,2})?$/.test(b)) {
    const parts = b.split('-');
    out.bazi = {
      date: parts.slice(0, 3).join('-'),
      hour: parts.length >= 4 ? String(((Number(parts[3]) % 24) + 24) % 24) : ''
    };
  }

  return out;
}

function isSharedView() {
  const sp = new URLSearchParams(location.search);
  return !!(sp.get('t') || sp.get('z') || sp.get('b'));
}

/* 清除回流状态：测测我自己 / 重新测试 / 回到首页时调用 */
function resetSharedView() {
  window.__sharedView = false;
  try { history.replaceState(null, '', baseUrl()); } catch (e) {}
}

/* 无百分比时的估算百分比（仅作兜底；正常分享链接都会带 p 参数） */
function estimatedPercent(type, identity) {
  const S = 75;
  const mk = (isFirst) => ({ firstPct: isFirst ? S : 100 - S, secondPct: isFirst ? 100 - S : S });
  return {
    EI: mk(type[0] === 'E'),
    SN: mk(type[1] === 'S'),
    TF: mk(type[2] === 'T'),
    JP: mk(type[3] === 'J'),
    AT: mk(identity === 'A')
  };
}

/* 打开带参数链接时：重建并渲染结果 */
function applySharedUrlOnLoad() {
  if (!isSharedView()) return;
  const params = parseShareParams();

  // 只有 MBTI（无星座/八字）→ 渲染 MBTI 单独结果页
  if (params.mbti && !params.zodiac && !params.bazi) {
    window.__sharedView = true;
    const m = params.mbti;
    state.result = {
      type: m.type,
      identity: m.identity,
      full: m.type + '-' + m.identity,
      percent: m.percent || estimatedPercent(m.type, m.identity),
      raw: null
    };
    renderResult();
    go('result');
    return;
  }

  // 其余情况 → 三维综合分析结果页
  window.__sharedView = true;
  mState.mbtiType = params.mbti ? params.mbti.type : null;
  mState.mbtiIdentity = params.mbti ? params.mbti.identity : null;
  mState.mbtiPercent = params.mbti ? (params.mbti.percent || null) : null;
  mState.zodiacKey = params.zodiac || null;

  if (params.bazi) {
    mState.birthDate = params.bazi.date;
    mState.birthHour = params.bazi.hour;
    // 未显式传星座时按生日自动推导（对齐表单行为）
    if (!params.zodiac) {
      const seg = params.bazi.date.split('-').map(Number);
      const z = getZodiacSign(seg[1], seg[2]);
      if (z) mState.zodiacKey = z.key;
    }
  }

  runMultiAnalysis();
}

applySharedUrlOnLoad();
