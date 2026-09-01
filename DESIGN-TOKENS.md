# DESIGN-TOKENS.md · 卡通贴纸风设计系统 v2

> 本文档为**增量补充**，不推翻 `assets/css/style.css` 现有 `:root`。
> 所有条目标注 🆕**新增** / 🔁**替换硬编码** / ✅**保留现状**。
> 目标：提升答题完成率与结果分享率，同时保持贴纸风一致性。

---

## 0. 现状实测（读 style.css 1290 行的统计结果）

| 维度 | 实测值 | 结论 |
|---|---|---|
| `font-size` 离散值 | **30 种**（9.5 / 10 / 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14 / 14.5 / 15 / 16 / 16.5 / 17 / 18 / 19 / 20 / 21 / 22 / 24 / 25 / 26 / 28 / 30 / 32 / 34 / 42 / 60 / 62） | 无阶梯，`12.5px` 出现 22 次是随手值 |
| `gap` 离散值 | **14 种**（2/6/7/8/9/10/11/12/13/14/16/17/18/22），`gap:9px` 出现 14 次 | 无间距系统 |
| `margin-top` 离散值 | **22 种**（2~38px 几乎连续） | 无节奏 |
| `padding` | 30+ 种组合，几乎无复用 | 无系统 |
| 动效时长 | **19 种**（.12s ~ .9s），`.12s` 出现 14 次 | 无时长令牌 |
| 缓动曲线 | 4 种 cubic-bezier，`(.2,1,.3,1)` 与 `(.2,1.15,.3,1)` 混用无规则 | 无语义 |
| `z-index` | `-1 / 0 / 1 / 2 / 3 / 99 / 200` | 魔数，99 与 200 之间无规划 |
| `border-width` | **2.5px 出现 39 次**、2px 21 次、3px 18 次、3.5px 7 次、1.5px 6 次 | 描边是贴纸风命脉却无令牌 |
| `border-radius` 硬编码 | `999px` 35 次、`32px` 3 次、另有 5/6/8/9/10/12/14/18px | `--r-*` 只覆盖了 3 档 |
| 硬编码色值 | `#463C50` 12 次、`#7A7085` 4 次、`#5A4E63` 4 次 + 20 余种 tint | 文本色与浅色底色全部逃逸出令牌 |
| 硬阴影 | `2px 2px 0` 大量硬编码、hover 态 `8px/9px` 硬编码 | `--shadow-*` 只覆盖 3/4/6px |

**结论**：诊断成立。真正的缺口比「间距+字号+动效」三项更宽 —— **描边、圆角、文本色阶、硬阴影 hover 态**同样在逃逸。本文档一并补齐。

---

## 1. 设计系统定位

### 候选对比

| 方案 | 参照系统 | 匹配度 | 可借鉴的具体手法 | 与本项目的关系 |
|---|---|---|---|---|
| **A** | **Spotify**（Wrapped 版式基因） | ★★★★★ | ① 年度总结「分段揭晓」叙事：不一次性倒完，每段一个视觉高潮<br>② 巨型数字作社交货币（占比/一致性单独占一屏）<br>③ 满版纯色块出血，打破卡片流节奏<br>④ 数据可视化即海报，天生为截图设计<br>⑤ 严谨口径用极小字沉到底部，不与主叙事争视觉 | **补「值得晒」基因**。Wrapped 本身是扁平大色块 + 超大字重，无渐变无玻璃拟态，叠 3px 描边 + 硬阴影零冲突 |
| **B** | **Miro** | ★★★★☆ | ① 便利贴/贴纸词汇表：轻微旋转、错落堆叠、手绘感<br>② 马卡龙色块 + 厚描边组件库<br>③ 拖拽感的弹性动效曲线 | **最贴近现有视觉 DNA**，但它的「趣味」是协作工具的趣味，缺少炫耀驱动。加不了新东西 |
| **C** | **Nike** | ★★★☆☆ | ① 成就/徽章文化：解锁瞬间的仪式感<br>② 巨型数字 + 强对比<br>③ 里程碑激励文案节奏 | **只在徽章层可借鉴**。整体黑底+竞技气质与马卡龙可爱调性冲突，不能做主参照 |

### ✅ 明确推荐：**A. Spotify（Wrapped 版式基因）**

**为什么它比 B、C 更适合：**

1. **它精准命中本次改造的核心矛盾。** 项目的痛点不是「不好看」（贴纸风已统一、用户喜欢），而是「看完不想发出去」。Spotify Wrapped 是消费级软件史上分享率最高的数据人格产物，它的全部设计决策都为一件事服务：**让人主动截图**。这正是 P0 传播闭环 + P1 情绪断层要解的题。

2. **它的手法能直接映射到本项目的 4 个 P0/P1。**

   | 本项目问题 | Wrapped 对应手法 |
   |---|---|
   | P1 情绪断层（分享区排第 9） | 分段揭晓 → 把分享区做成**最后一个高潮**而非附录 |
   | P1 答题激励缺失（48 题线性） | 逐屏推进 + 每段一个「揭晓」 → 里程碑组件 |
   | P2 徽章暴露过晚 | 巨型数字/标签前置 → 徽章卡上移到 hero 之后 |
   | P1 618 字严谨内容压场 | 口径说明沉到底部极小字 → 可折叠严谨性区块 |

3. **它与贴纸风是加法而非减法。** Miro 给的是「更多贴纸」——本项目已经有 55 个 SVG 头像 + 16 型动物头像，贴纸词汇不缺。Nike 给的是「竞技强度」——会撕裂马卡龙调性。只有 Spotify 给的是**版式与叙事结构**，这一层现在是空的，填进去不动一处现有颜色和描边。

4. **气质上不冲突。** Wrapped 是扁平色块 + 超大字重 + 零模糊阴影，与「厚描边 + 硬阴影 + 无模糊」的贴纸风底层逻辑一致（都是拒绝拟真景深）。把 Wrapped 的满版色块套上 3.5px 描边和 `12px 12px 0` 硬阴影，出来的东西仍然是贴纸，只是**更敢占版面**。

**从 B、C 各取一层（不作主参照，只作局部补充）：**
- 从 Miro 取：新组件的**旋转错落规则**（±2~2.5deg 交替，见 §5.2 徽章卡）
- 从 Nike 取：**解锁动画的回弹强度**（`--ease-bounce` 过冲 56%，见 §3.3）

---

## 2. 间距系统 🆕

4px 基准阶梯。保留 `2px` 与 `6px` 两个半步 —— 实测现有代码在 6/7/9px 区间有 20+ 处使用，贴纸风的小徽章内距确实需要这一档，强行取整到 8px 会让 `.ev-badge` `.hc-chip` 一类胶囊变胖。

```css
:root{
  /* ---------- 间距阶梯（4px 基准 + 2/6 半步） ---------- */
  --space-0:0;
  --space-05:2px;   /* 微错位：图标与文字基线补偿、堆叠头像负边距的正向补偿 */
  --space-1:4px;    /* 紧贴：图标与文字、徽章内上下 */
  --space-15:6px;   /* 半步：小胶囊内距、密集 tag 间隙 */
  --space-2:8px;    /* 紧凑：行内元素组、小卡内距 */
  --space-3:12px;   /* 默认小间距：列表项间、按钮组间隙 */
  --space-4:16px;   /* 默认间距：卡内 padding、区块内元素间距 */
  --space-5:20px;   /* 舒适：卡内横向 padding、次级区块间距 */
  --space-6:24px;   /* 卡片 padding 主力：.sec/.fs-card 横向 */
  --space-7:28px;   /* 主卡 padding：.share-sec/.q-card 纵向 */
  --space-8:32px;   /* 区块间隔：结果页 .sec 之间 */
  --space-10:40px;  /* 情绪断点：分享区上方的呼吸空白 */
  --space-12:48px;  /* 大分隔：首页上下 padding */
  --space-16:64px;  /* 页脚留白 */

  /* ---------- 页面容器 ---------- */
  --gutter:20px;    /* 🔁 替换 .screen{padding:0 20px} */
  --w-home:560px;   /* 🔁 .home-wrap max-width */
  --w-quiz:600px;   /* 🔁 .quiz-head/.quiz-body max-width */
  --w-result:620px; /* 🔁 .result-wrap max-width */
  --w-form:660px;   /* 🔁 .form-wrap max-width */
}
```

### 🔁 硬编码映射表

| 现有值 | 出现次数 | 映射到 | 变化 | 备注 |
|---|---|---|---|---|
| `2px` `3px` | 多处 | `--space-05` / `--space-1` | 3→4 | `margin-top:2px/3px` 类微调 |
| `5px` `6px` `7px` | 15+ | `--space-15`(6px) | ±1 | 视觉无感差异 |
| `8px` `9px` | 25+ | `--space-2`(8px) | 9→8 | **`gap:9px` 14 处统一为 8px** |
| `10px` `11px` `12px` `13px` | 20+ | `--space-3`(12px) | ±2 | |
| `14px` `15px` `16px` `17px` | 30+ | `--space-4`(16px) | ±2 | `margin-top:15px/16px` 14 处统一 |
| `18px` `20px` | 15+ | `--space-5`(20px) | 18→20 | `margin-top:18px` 8 处（.sec 间距） |
| `22px` `24px` | 10+ | `--space-6`(24px) | 22→24 | |
| `26px` `28px` `30px` | 8 | `--space-7`(28px) | ±2 | |
| `32px` `34px` `38px` | 6 | `--space-8`(32px) | 34→32 | `.btn-main{margin-top:34px}` |
| `40px` `44px` `48px` `56px` | 5 | `--space-10` / `--space-12` | | 首页 `padding:48px 0 56px` |

**落地策略**：不要一次全局替换（1290 行、300+ 处，回归风险高）。按屏渐进：**答题页 → 结果页 → 首页 → 表单页**，每屏改完目视比对一次。新组件（§5）必须 100% 用令牌。

---

## 3. 排版系统 🆕

### 3.1 字号阶梯

中文密集型产品在 12–16px 区间需要比拉丁文更细的分档（CJK 字面率高，13px 与 14px 的可读性差异真实存在）。因此这一段刻意保持 1px 步进，16px 以上才放大比率到 ~1.15。

```css
:root{
  /* ---------- 字号阶梯 ---------- */
  --fs-3xs:10px;   /* 极小标注：星座日期、四柱五行标签 */
  --fs-2xs:11px;   /* 微标签：ev-badge 依据徽章、稀有度角标 */
  --fs-xs:12px;    /* 辅助说明：meta、维度脚注、免责正文 */
  --fs-sm:13px;    /* 次级正文：列表项、卡片描述 */
  --fs-base:14px;  /* 正文基准：sec-p 段落、总结叙述 */
  --fs-md:15px;    /* 强调正文：输入框、hero-sub、里程碑鼓励语 */
  --fs-lg:17px;    /* 小标题：sec-h、dc-name */
  --fs-xl:19px;    /* 区块标题：分享区 h3、hc-cn */
  --fs-2xl:22px;   /* 卡片主标题 */
  --fs-3xl:26px;   /* 页级标题：表单页 h2、分享区高潮标题 */
  --fs-4xl:32px;   /* 大数字：一致性百分比、里程碑分数、原型名 */
  --fs-5xl:42px;   /* Hero：首页主标 clamp 上界 */
  --fs-6xl:60px;   /* 类型代码 INFJ */

  /* ---------- 行高 ---------- */
  --lh-tight:1.15;   /* 大标题（≥26px） */
  --lh-snug:1.4;     /* 中标题、徽章多行文字 */
  --lh-normal:1.6;   /* 短句、列表项 */
  --lh-relaxed:1.75; /* 次级正文、免责内容 */
  --lh-loose:1.9;    /* 长段落正文（sec-p / ps-block p） */

  /* ---------- 字重 ---------- */
  --fw-normal:500;   /* 正文（中文 400 太飘，本项目底线是 500） */
  --fw-medium:600;   /* 辅助文字 */
  --fw-bold:700;     /* 强调 */
  --fw-heavy:800;    /* 标签、小标题 */
  --fw-black:900;    /* 标题、数字、按钮 */

  /* ---------- 字距 ---------- */
  --ls-tight:-0.03em;  /* 大标题收紧（≥26px） */
  --ls-snug:-0.01em;   /* 中标题微收 */
  --ls-none:0;
  --ls-wide:0.04em;    /* 按钮文字 */
  --ls-wider:0.12em;   /* 全大写小标签：ps-arc-label、dc-label */

  /* ---------- 数字 ---------- */
  --fnum:'PingFang SC',...; /* 沿用 --font */
  /* 所有会变动的数字（百分比/计数/进度）必须加 font-variant-numeric:tabular-nums
     否则 count-up 动画会因字宽跳动而抖动 */
}
```

### 🔁 字号映射表

| 现有值 | 次数 | → | 变化 | 影响面 |
|---|---|---|---|---|
| 9.5px | 2 | `--fs-3xs` 10px | +0.5 | `.zo-date` `.ax-end`@400 |
| 10px | 6 | `--fs-3xs` 10px | 0 | ✅ |
| 10.5px | 10 | `--fs-2xs` 11px | +0.5 | `.ev-badge` `.dc-label` 等 |
| 11px | 12 | `--fs-2xs` 11px | 0 | ✅ |
| 11.5px | 9 | `--fs-xs` 12px | +0.5 | `.disclaimer` `.dc-note` |
| 12px | 18 | `--fs-xs` 12px | 0 | ✅ |
| **12.5px** | **22** | `--fs-sm` 13px | +0.5 | **最大改动面**，`.fs-tip` `.ec-desc` `.method-warn p` 等；小屏可读性提升 |
| 13px | 15 | `--fs-sm` 13px | 0 | ✅ |
| 13.5px | 10 | `--fs-base` 14px | +0.5 | `.dc-desc` `.ps-block li` |
| 14px | 7 | `--fs-base` 14px | 0 | ✅ |
| 14.5px | 6 | `--fs-md` 15px | +0.5 | `.sec-p` `.hc-title` |
| 15px | 6 | `--fs-md` 15px | 0 | ✅ |
| 16px / 16.5px / 17px | 13 | `--fs-lg` 17px | +0~1 | `.sec-h` `.quote-card` |
| 18px / 19px | 7 | `--fs-xl` 19px | +0~1 | |
| 20px / 21px / 22px | 8 | `--fs-2xl` 22px | +0~2 | `.share-sec h3` `.load-title` |
| 24px / 25px / 26px | 5 | `--fs-3xl` 26px | +0~2 | |
| 28px / 30px / 32px / 34px | 6 | `--fs-4xl` 32px | -2~+4 | `.ms-num b` 28→32（一致性数字变大，正向） |
| 42px | 2 | `--fs-5xl` 42px | 0 | ✅ |
| 60px / 62px | 2 | `--fs-6xl` 60px | -2 | `.hc-face`(62) 是 emoji 时代遗留，现为 SVG 容器可忽略 |

**净效果**：30 档 → **13 档**。整体轻微上浮 0.5–1px，对移动端中文可读性是改善，不是回退。

---

### 3.2 动效时长令牌 🆕

```css
:root{
  --dur-instant:90ms;  /* 状态切换：颜色/透明度，无位移 */
  --dur-fast:130ms;    /* 🔁 替换 .12s/.13s/.14s（14+3+2=19 处）按压与 hover 位移 */
  --dur-base:200ms;    /* 🔁 替换 .18s/.2s（9 处）默认过渡、tooltip */
  --dur-slow:350ms;    /* 🔁 替换 .3s/.35s 进度条推进、颜色渐变 */
  --dur-enter:450ms;   /* 🔁 替换 .42s/.45s 卡片入场（cardIn） */
  --dur-reveal:550ms;  /* 🔁 替换 .5s/.55s 页面级入场（pop） */
  --dur-bar:900ms;     /* 🔁 替换 .8s/.9s 数据条/环形图生长 */
  --dur-milestone:1800ms; /* 🆕 里程碑弹层自动消失驻留时长 */

  /* 循环动画（保留现值，语义化） */
  --dur-bobble:2600ms;  /* ✅ .pf 头像浮动 */
  --dur-orbit:3400ms;   /* ✅ 加载页环绕 */
  --dur-breathe:2400ms; /* 🆕 主 CTA 呼吸 */
}
```

### 3.3 缓动曲线 🆕 —— 贴纸风的「弹」在这里

贴纸是有厚度的物理对象，所有位移都必须过冲。这是与"扁平 UI"的分野。

```css
:root{
  /* 入场回弹：过冲 20%，主力曲线 */
  --ease-pop:cubic-bezier(.2,1.2,.3,1);        /* ✅ 现有，语义化 */
  /* 入场回弹（柔和）：过冲 15%，卡片级 */
  --ease-pop-soft:cubic-bezier(.2,1.15,.3,1);  /* ✅ 现有 */
  /* 减速无回弹：数据条生长、环形图，不能过冲（会显得数据不准） */
  --ease-out:cubic-bezier(.2,1,.3,1);          /* ✅ 现有 */
  /* 按压：快进慢出，模拟贴纸被按下 */
  --ease-press:cubic-bezier(.3,.8,.5,1);       /* 🆕 */
  /* 强回弹：过冲 56%，仅用于「解锁」瞬间（徽章、里程碑），一次性、稀缺使用 */
  --ease-bounce:cubic-bezier(.34,1.56,.64,1);  /* 🆕 */
  /* 匀速：加载进度条 */
  --ease-linear:linear;                         /* ✅ */
}
```

**使用纪律**：
- `--ease-bounce` 全站**只允许出现在 3 个地方**：里程碑弹层入场、徽章解锁 stagger、分享图生成完成弹窗。滥用会让整站显得廉价。
- `--ease-out` 用于所有「表达数据」的动画（`.dim-bar i` / `.ms-fg` / `.wx-track i` / `.pc-bar i`）—— 数据条回弹会让人感觉数字在跳动、不可信。现有代码这里用的就是 `(.2,1,.3,1)`，✅ 判断正确，只需令牌化。
- 全部动画包在 `@media (prefers-reduced-motion:no-preference)` 内；reduce 模式下保留最终态、时长归零。

```css
@media (prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.01ms !important;
  }
}
```

---

## 4. 结构令牌

### 4.1 描边宽度 🆕（贴纸风命脉，此前完全无令牌）

```css
:root{
  --bw-hair:1.5px;   /* 🔁 6 处：虚线分隔、kbd、小徽章内描边 */
  --bw-thin:2px;     /* 🔁 21 处：小胶囊 chip、mini 卡、track 描边 */
  --bw-base:2.5px;   /* 🔁 39 处 —— 实际主力，中等组件默认 */
  --bw-thick:3px;    /* 🔁 18 处：标准卡片、按钮 */
  --bw-heavy:3.5px;  /* 🔁 7 处：Hero 级容器（hero-card/my-hero/ps/share-sec） */
}
```

**层级规则**（描边宽度即视觉权重，本项目最重要的层级手段）：
| 描边 | 用于 | 语义 |
|---|---|---|
| 1.5px | 虚线分隔、辅助标注 | 结构线，不是对象 |
| 2px | chip / mini 卡 / 进度轨 | 小对象 |
| 2.5px | 一般卡片、输入框、次级按钮 | 标准对象 |
| 3px | 内容卡、主按钮、题目卡 | 主要对象 |
| 3.5px | Hero 容器、徽章卡、分享区 | **舞台级，全站限 5 处以内** |

### 4.2 圆角 🆕

```css
:root{
  --r-2xs:8px;    /* 🔁 .pb-ic 图标方章 */
  --r-xs:10px;    /* 🔁 .mf-step / .bp-col */
  --r-sm:14px;    /* ✅ 现有 */
  --r-md:20px;    /* ✅ 现有 */
  --r-lg:28px;    /* ✅ 现有 */
  --r-xl:32px;    /* 🔁 3 处硬编码：.hero-card / .my-hero / .ps */
  --r-pill:999px; /* 🔁 35 处硬编码 —— 出现频率最高的单一数值 */
  --r-circle:50%; /* 🔁 头像、圆点 */
}
```

### 4.3 硬阴影 🆕（含此前缺失的 hover / press 态）

```css
:root{
  --shadow-press:1px 1px 0 var(--line);   /* 🔁 按下态 */
  --shadow-xs:1.5px 1.5px 0 var(--line);  /* 🔁 .ax-dot */
  --shadow-2xs:2px 2px 0 var(--line);     /* 🔁 20+ 处硬编码 */
  --shadow-sm:3px 3px 0 var(--line);      /* ✅ 现有 */
  --shadow:4px 4px 0 var(--line);         /* ✅ 现有 */
  --shadow-lg:6px 6px 0 var(--line);      /* ✅ 现有 */
  --shadow-xl:8px 8px 0 var(--line);      /* 🔁 hover 态硬编码（btn-main / btn-share） */
  --shadow-2xl:12px 12px 0 var(--line);   /* 🆕 舞台级：徽章卡、分享区高潮、里程碑弹层 */

  /* 位移配对（硬阴影风格里，阴影变化必须与位移配对，否则光源会漂移） */
  --lift-sm:translate(-1px,-1px);
  --lift:translate(-2px,-2px);
  --lift-lg:translate(-3px,-3px);
  --press:translate(2px,2px);
  --press-lg:translate(3px,3px);

  /* 唯一允许的模糊阴影：仅用于脱离纸面的浮层（modal / toast），
     纸面上的一切对象禁止模糊阴影 */
  --shadow-float:0 8px 24px rgba(43,34,51,.25);
  --shadow-overlay:0 20px 50px rgba(0,0,0,.4);
}
```

**硬阴影配对规则**（下游必须遵守）：
```
静止 --shadow      → hover  --lift    + --shadow-xl
静止 --shadow      → active --press   + --shadow-press
静止 --shadow-2xs  → hover  --lift-sm + --shadow-sm
静止 --shadow-lg   → hover  --lift-lg + --shadow-2xl
```
阴影偏移量 = 静止值 + 位移量的绝对值 × 2。违反此式会让贴纸看起来在「浮空」而非「被抬起」。

### 4.4 z-index 语义化 🆕

```css
:root{
  --z-under:-1;      /* 🔁 .hero-title em::after 荧光笔底纹 */
  --z-bg:0;          /* 🔁 .bg-deco */
  --z-base:1;        /* 🔁 13 处 .screen / 卡内正文层 */
  --z-raised:10;     /* 🔁 现 z-index:2/3 → .ax-dot 三点叠放用 10/11/12 */
  --z-sticky:50;     /* 🆕 答题页吸顶进度条、结果页吸底分享条 */
  --z-milestone:80;  /* 🆕 里程碑弹层 */
  --z-modal:100;     /* 🔁 现 z-index:99 分享图模态 */
  --z-toast:200;     /* ✅ 现有 */
}
```

### 4.5 文本色阶 🆕（此前 12 处 `#463C50` 直接硬编码）

```css
:root{
  --ink:#2B2233;    /* ✅ 标题、强调 · 白底对比 13.9:1 */
  --ink-2:#6B6076;  /* ✅ 辅助文字 · 白底 5.6:1 → AA 通过 */
  --ink-3:#463C50;  /* 🔁 12 处 · 正文主色 · 白底 9.8:1 */
  --ink-4:#5A4E63;  /* 🔁 4 处 · 次级正文 · 白底 7.4:1 */
  --ink-5:#7A7085;  /* 🔁 4 处 · 极弱标注 · 白底 4.6:1（勉强 AA） */
  --line:#2B2233;   /* ✅ 描边 */
}
```
> ⚠️ **`--ink-5` 仅允许用于 ≥12px 文字**。现有 `.zo-date{font-size:9.5px;color:#7A7085}` 与 `.bzp-l{font-size:10px}` 在 4.6:1 + 极小字号下实测吃力，建议改用 `--ink-4`。

### 4.6 语义色与色底 🆕

```css
:root{
  /* 量表语义（🔁 现有硬编码） */
  --ok:#28A87E;         --ok-line:#1F9B72;    /* .sl-agree / .dot.agree */
  --no:#D96A8A;         --no-line:#D0567B;    /* .sl-dis / .dot.dis */
  --neutral-line:#9A93A3;                     /* .dot.neutral */
  --warn:#C9622F;                             /* .warn-txt */

  /* CTA 深色变体 🆕 —— 无障碍必须 */
  --coral-deep:#E85D3D;  /* 白字底色专用，见 §4.7 */

  /* 四大群组主色（README 已定义，此前只存在于 JS） 🆕 */
  --g-analyst:#9B7BEA;   /* 分析家 */
  --g-diplomat:#3FB98C;  /* 外交家 */
  --g-sentinel:#3F94D6;  /* 守护者 */
  --g-explorer:#F2A63B;  /* 探险家 */

  /* 浅色底 tint（🔁 收敛 20+ 处硬编码） */
  --tint-mint:#DDF5EB;    --tint-mint-2:#F2FBF7;
  --tint-yellow:#FFF3D6;  --tint-amber:#FFE9C9;
  --tint-orange:#FFF4E8;  --tint-cream:#FFFBF0;
  --tint-lilac:#F0E7FF;   --tint-lilac-2:#F4F0FA;
  --tint-pink:#FFF4F7;
  --tint-gray:#F4F0F8;
  --track:#EDE8F2;        /* 🔁 收敛 #EDE8F2/#EFEAF4/#F1EDF5 三个近似值为一个 */
  --paper-2:#FBFAFD;      /* 🔁 .sec-method 降权底色 */

  /* 反白文字 */
  --on-ink:#FFF6E5;       /* 🔁 深底上的正文（quote-card/syn-text） */
}
```

### 4.7 ⚠️ 无障碍实测：发现两处真实失败

以下全部为**脚本实算**的 WCAG 2.1 相对亮度对比度，非目测估计：

| 组合 | 实算对比度 | 标准 | 结论 |
|---|---|---|---|
| `--ink` on `--paper` | **14.76:1** | 4.5 | ✅ |
| `--ink-2` on `#fff` | **5.90:1** | 4.5 | ✅ |
| `--ink-3` on `#fff` | **10.38:1** | 4.5 | ✅ |
| `--ink-4` on `#fff` | **7.76:1** | 4.5 | ✅ |
| `--ink-5` on `#fff` | **4.68:1** | 4.5 | ⚠️ 勉强通过，禁用于 <12px |
| `--ink-5` on `--paper-2` | **4.50:1** | 4.5 | ⚠️ 正好压线 |
| `--ink` on `--yellow` | **11.01:1** | 4.5 | ✅ |
| `--ink` on `--mint` | **9.33:1** | 4.5 | ✅ |
| `--on-ink` on `--ink` | **14.18:1** | 4.5 | ✅ |
| **`#fff` on `--coral`** | **2.31:1** | 3.0（大号粗体） | ❌ **失败** |
| **`--coral` on `#fff`** | **2.31:1** | 4.5（正文） | ❌ **失败** |

**失败点 1：`.btn-main`** —— 首页唯一主 CTA（19px/900 白字 + `--coral` 底）。这是**转化漏斗最顶端的按钮**，2.31:1 在强光下的手机屏几乎糊成一片，直接损害答题完成率。同一问题存在于 `.share-sec` 内白字与 `#btn-analyze`。

**失败点 2：`.ec-go`** —— 首页双入口卡的「开始 →」链接文字（13.5px/900，`--coral` on 白）。同为 2.31:1，且它是**双入口的行动指示**，与 P0 主路径直接相关。

#### 修法（已实算验证）

我原本准备的 `--coral-deep:#E85D3D` 经实算只有 **3.46:1**，仅够「大号粗体」门槛，正文仍不达标；而要让白字达到完整 AA 4.5，珊瑚色必须压暗到 `#B05F4A`（4.58:1）—— 那已经是浊棕色，会破坏马卡龙调性。**所以反转配色方向才是正解：**

```css
/* ✅ 失败点 1 推荐修法：保留原色，改深墨字 —— 实算 6.60:1，完整 AA 通过 */
.btn-main{background:var(--coral);color:var(--ink)}
```
这个修法同时**更贴纸**：厚描边风格里，深墨文字本就比白字更符合贴纸/丝网印刷的物理逻辑（现有 `.hc-cn` `.dom-tag` `.tag` 等胶囊全部是深字浅底，白字反而是全站的异类）。气势不减 —— `--fs-xl` + `--fw-black` + `--shadow-lg` 已经提供了足够的视觉重量，对比度靠色差而非亮度差来实现。

```css
/* ✅ 失败点 2 推荐修法：文字改深墨，珊瑚降级为纯装饰箭头 */
.ec-go{color:var(--ink-3)}              /* 10.38:1 */
.ec-go .arrow{color:var(--coral-deep)}  /* 箭头非文字信息载体，可保留暖色 */
```

#### `--coral` 的使用边界（写入令牌纪律）

| 允许 | 禁止 |
|---|---|
| ✅ 作**底色**，配 `--ink` 深字（6.60:1） | ❌ 作底色配白字（2.31:1） |
| ✅ 作纯装饰：箭头、图标、下划线、色带、`.hero-title em` 荧光笔 | ❌ 作**承载信息的文字色**（2.31:1） |
| ✅ `--coral-deep`(#E85D3D) 用于 ≥19px 粗体白字场景（3.46:1，达大号 AA） | ❌ `--coral-deep` 用于正文文字色（仍不足 4.5） |

> 全部数值可复算：WCAG 2.1 相对亮度公式 + `(L_lighter+0.05)/(L_darker+0.05)`。

### 4.8 尺寸令牌 🆕

```css
:root{
  --tap-min:44px;      /* 触控最小尺寸（WCAG 2.5.5）。现 .dot 最小 15px，
                          需靠 ::before 扩大热区至 44px —— 答题页 48 次点击，
                          误触即流失 */
  --av-2xs:26px;       /* 社会证明条堆叠头像 */
  --av-xs:38px;        /* 🔁 .mp-face / .zo-face */
  --av-sm:52px;        /* 🔁 .dc-face */
  --av-md:62px;        /* 🔁 .my-face / .pf */
  --av-lg:82px;        /* 🔁 .ps-arc-face */
  --av-xl:118px;       /* 🔁 .hc-face */
  --bar-h:14px;        /* 🔁 进度条/加载条高度 */
  --bar-h-lg:20px;     /* 🔁 .dim-bar */
}
```

### 4.9 断点（文档化，媒体查询内不可用 var）

| 名称 | 宽度 | 现有使用 | 行为 |
|---|---|---|---|
| `xs` | ≤400px | ✅ | 2 列网格、组件紧缩 |
| `sm` | ≤520px | ✅ | `.two-col` 单列 |
| `md` | ≤560px | ✅ | 3 列网格、单列入口 |
| `lg` | ≤768px | ✅ | `.my-score` 竖排 |

保持现状，不新增断点。新组件必须在这 4 档内验证。

---

## 5. 组件规范

### 5.0 情绪节奏的视觉策略（回应 P1 情绪断层）

**核心判断**：618 字严谨内容的问题不是「字多」，而是**它穿了全站最重的视觉外衣**。`.big-disclaimer` 是深色满版 + `3.5px` 描边 + `--shadow-lg`，这套组合在本设计系统里是**最高视觉权重**（对比 `.hero-card` 同为 3.5px + shadow-lg）。等于把最不希望用户驻留的内容做得和主人格卡一样抢眼，然后指望用户越过它去点分享。

三条视觉解法：

**① 严谨性内容：靠「撤走阴影」降权，而不是缩字或藏起来**

硬阴影风格里，阴影 = 离开纸面 = 重要。所以最优雅的降权是**保留完整内容与清晰排版，但撤掉硬阴影、把描边虚化**。视觉上它"贴回纸面"，成为背景层的一部分；内容一字不少，不心虚。

```
现状 .big-disclaimer：深底 #2B2233 + 3.5px 实线 + shadow-lg 6px  → 权重 5/5
改造 .rigor：       浅底 --paper-2 + 2.5px 半透明线 + 无阴影      → 权重 1/5
```

同时做**语义翻转**：把「免责声明」重新框定为「🔬 依据分级 · 可信度声明」。项目本身有 5 级证据分类 + 21 篇文献，这是**资质而非道歉**。用现有 `.ev-badge` 彩色胶囊把 5 个等级可视化出来（折叠状态下也可见），一眼传达"这个测试很严谨"，无需读 618 字。**严谨性从阅读负担变成信任信号。**

**② 分享区成为高潮：靠「打破容器」，而不是加大字号**

结果页 10 个区块全部是 `max-width:620px` 居中卡片流，节奏完全均匀 —— 均匀 = 无高潮。分享区要成为高潮，最有效的手段是**打破这个容器约束**（Spotify Wrapped 的满版出血手法）：

- 左右负边距出血到屏幕边缘，`border-radius` 只保留上下 → 视觉上"换了一个场景"
- 描边升到 `--bw-heavy`、阴影升到 `--shadow-2xl` → 本页唯一的舞台级权重
- 上方留 `--space-10`(40px) 空白 → 空白是最强的"注意"信号
- 前置分享图**缩略预览**（rotate -3deg 贴纸感）→ 让用户先"看见成品"再决定点击，这是转化率的关键，比任何文案都有效
- 主 CTA 加 `--dur-breathe` 呼吸微动（scale 1→1.035）

**③ 徽章的「解锁爽感」：靠 stagger + 过冲 + 扩散环三件套**

爽感不来自徽章本身好看，来自**逐个揭晓的时间差**。9 个徽章同时出现 = 一张列表；间隔 110ms 逐个弹入 = 9 次小奖赏。三个要素：
1. **stagger 延迟** 110ms 递增 —— 制造"还有还有"的期待
2. **过冲回弹** `--ease-bounce`（56% 过冲）+ 从 `scale(.4) rotate(-25deg)` 起手 —— 贴纸"啪"地拍上去的物理感
3. **扩散环** `::after` 从 `0 0 0 0 var(--yellow)` 扩到 `0 0 0 14px transparent` —— 解锁瞬间的能量释放

再叠一层：**灰态未解锁徽章**（只展示最接近的 2–3 个，`opacity:.28` + 虚线描边 + 🔒）。已解锁的更有价值，未解锁的给出再测动机。

---

### 5.1 里程碑激励组件 `.ms-pop` 🆕

> 解 P1 答题激励缺失。48 题在 Q12 / Q24 / Q36 触发三次。

**A. 常驻：分段进度条**（改造现有 `.progress-track`）

```css
.progress-track{
  height:var(--bar-h);                       /* 14px */
  background:#fff;
  border:var(--bw-base) solid var(--line);   /* 2.5px */
  border-radius:var(--r-pill);
  overflow:hidden;
  position:relative;
}
/* 🆕 三道分段刻度：把 48 题切成 4 段，"还剩多少"从连续量变成可数的段 */
.progress-track::after{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:repeating-linear-gradient(90deg,
    transparent 0 calc(25% - 1.25px),
    rgba(43,34,51,.28) calc(25% - 1.25px) calc(25% + 1.25px),
    transparent calc(25% + 1.25px) 25%);
}
/* 🆕 已跨越的段位点亮 */
.seg-dot{
  position:absolute;top:50%;translate:-50% -50%;
  width:var(--space-2);height:var(--space-2);   /* 8px */
  border:var(--bw-thin) solid var(--line);
  border-radius:var(--r-circle);
  background:#fff;transition:background var(--dur-base),transform var(--dur-fast) var(--ease-bounce);
}
.seg-dot.done{background:var(--mint);transform:translate(-50%,-50%) scale(1.25)}
```

**B. 弹层规格**

| 属性 | 值 |
|---|---|
| 遮罩 | `background:rgba(43,34,51,.42)`；`backdrop-filter:blur(3px)`；`z-index:var(--z-milestone)`(80) |
| 卡片背景 | `linear-gradient(150deg,var(--tint-yellow),#fff 62%)` |
| 描边 | `var(--bw-heavy) solid var(--line)` = 3.5px |
| 圆角 | `var(--r-xl)` = 32px |
| 内距 | `var(--space-7) var(--space-6) var(--space-6)` = 28px 24px 24px |
| 阴影 | `var(--shadow-2xl)` = 12px 12px 0 |
| 宽度 | `min(300px, calc(100vw - var(--space-10)))` |
| 贴纸倾斜 | `rotate(-1.5deg)` |
| 入场 | `440ms var(--ease-bounce)`：`scale(.7) rotate(-8deg) opacity(0)` → `scale(1) rotate(-1.5deg) opacity(1)` |
| 退场 | `--dur-base`(200ms) `--ease-press`，`scale(.94) opacity(0)` |
| 驻留 | `var(--dur-milestone)`(1800ms) 后自动消失；任意点击立即关闭 |

**C. 内部结构（自上而下）**

```
┌─────────────────────────────┐
│  ①斜贴角标（top:-14px）      │  bg:var(--yellow) / --fs-2xs(11px) / --fw-black
│     「¼ 达成」               │  padding:var(--space-15) var(--space-5) / rotate(-4deg)
│                             │  border:var(--bw-base) / --r-pill / --shadow-2xs
├─────────────────────────────┤
│  ②大分数  12 / 48           │  --fs-4xl(32px) / --fw-black / --ls-tight
│                             │  tabular-nums；"12" 用 --ink，"/ 48" 用 --ink-5 且 --fs-xl
├─────────────────────────────┤
│  ③鼓励语（一行，≤14字）      │  --fs-md(15px) / --fw-heavy / --lh-snug
├─────────────────────────────┤
│  ④48 点阵进度               │  6列×8行，dot 4px，gap 3px
│  ●●●●●●●●●●●● ○○○○○○○○○○○○  │  已答:var(--mint)+1px描边 / 未答:var(--track)
├─────────────────────────────┤
│  ⑤四维 mini 预览            │  4 条 6px 高轨道，宽 52px，--r-pill
│  E▮▮▮▯ N▮▮▯▯ ...            │  只给倾向色块，不给数字/不给结论
└─────────────────────────────┘
```

**D. 三次里程碑的差异化**（不能三次一样，第二次必须升级）

| 节点 | 角标 | 鼓励语方向 | 视觉升级 |
|---|---|---|---|
| Q12（¼） | `¼ 达成` bg `--yellow` | 「开局稳，继续」 | 基础版 |
| **Q24（半程）** | `½ 半程！` bg `--coral-deep` 白字 | 「过半了，最难的部分结束」 | **加 confetti**：6 个 8×8px 色块（pink/yellow/mint/sky/lilac/coral），各 `border:1.5px solid var(--line)`，从卡片中心 `rotate(0) scale(0)` 飞出到随机 `translate(±90px,±70px) rotate(±320deg)`，`700ms var(--ease-out)` + 尾段 `opacity→0`。纯 CSS，零依赖 |
| Q36（¾） | `¾ 冲刺` bg `--mint` | 「还剩 12 题」 | 大分数放大到 `--fs-5xl`(42px) |

**E. 无障碍**：`role="status" aria-live="polite"`；不抢焦点（用户键盘答题时不能打断，现有 `.kbd-tip` 说明支持键盘）；reduce-motion 下取消 confetti 与回弹，仅淡入。

---

### 5.2 成就徽章卡 `.badge-hero` 🆕

> 解 P2 徽章暴露过晚。位置：`.hero-card`（或 `.my-hero`）**之后**、`.quote-card` 之前。

**A. 容器**

| 属性 | 值 |
|---|---|
| 上边距 | `var(--space-5)`(20px) |
| 背景 | `linear-gradient(150deg,var(--tint-yellow),var(--tint-amber) 58%,var(--tint-yellow))` |
| 波点叠层 | `::before` + `radial-gradient(rgba(255,255,255,.55) 1.6px,transparent 1.6px)` / `background-size:20px 20px`（复用 `.hero-card::before` 手法） |
| 描边 | `var(--bw-heavy)`(3.5px) `solid var(--line)` |
| 圆角 | `var(--r-xl)`(32px) |
| 内距 | `var(--space-7) var(--space-5) var(--space-6)` = 28px 20px 24px |
| 阴影 | `var(--shadow-lg)`(6px 6px 0) |

**B. 顶部斜贴标题**（沿用 `.ps-badge` 手法，但改为强调计数）

```css
.badge-hero-tag{
  position:absolute;top:-15px;left:50%;translate:-50% 0;
  background:var(--ink);color:var(--yellow);
  border:var(--bw-base) solid var(--line);
  border-radius:var(--r-pill);
  padding:var(--space-15) var(--space-5);      /* 6px 20px */
  font-size:var(--fs-xs);font-weight:var(--fw-black);  /* 12px/900 */
  letter-spacing:var(--ls-wide);white-space:nowrap;
  transform:rotate(-1.2deg);
}
/* 文案：「🏆 已解锁 3 / 9 项成就」—— 计数本身是社交货币 */
```

**C. 单枚徽章 `.bdg`**

| 属性 | 值 |
|---|---|
| 布局 | 父容器 `display:flex;flex-wrap:wrap;justify-content:center;gap:var(--space-3)`(12px) |
| 尺寸 | `width:96px`，高度自适应；小屏(≤400px) `width:calc(50% - var(--space-15))` |
| 背景 | `#fff` |
| 描边 | `var(--bw-thick) solid var(--line)`(3px) |
| **顶条** | `border-top:5px solid var(--ac)` —— 奖牌感（**替换**现有 `.ach{border-left:6px}` 的左侧色带，顶部更像勋章绶带） |
| 圆角 | `var(--r-md)`(20px) |
| 内距 | `var(--space-4) var(--space-2) var(--space-3)` = 16px 8px 12px |
| 阴影 | `var(--shadow)`(4px 4px 0) |
| 贴纸倾斜 | `:nth-child(odd){--tilt:-2.5deg}` / `:nth-child(even){--tilt:2deg}` |
| 图标 | `32px`，`line-height:1` |
| 主标 | `var(--fs-2xs)`(11px) / `var(--fw-black)` / `margin-top:var(--space-2)` / `--lh-snug` |
| 副标 | `var(--fs-3xs)`(10px) / `var(--fw-medium)` / `color:var(--ink-4)`（不用 `--ink-5`，10px 下对比不足） |
| hover | `--lift-sm` + `--shadow-sm`，`var(--dur-fast) var(--ease-press)` |

**D. 稀有度分级配色**（对齐现有 9 条徽章规则）

| 徽章 | `--ac` | 卡片底 | 额外强化 |
|---|---|---|---|
| 💎 极稀有人格 (<2%) | `var(--lilac)` | `#F6F0FF` | 描边升 `--bw-heavy`、阴影升 `--shadow-lg`、图标 36px |
| ✨ 稀有人格 (<4%) | `var(--pink)` | `#fff` | — |
| 🎯 三观高度统一 / 🎭 多面人格 | `var(--sky)` | `#fff` | — |
| 🔥 特质拉满 / 🧊 极致特质 | `var(--coral)` / `var(--mint)` | `#fff` | — |
| 🏅 完整版报告 | `var(--yellow)` | `#fff` | — |
| ⚖️ 罕见均衡型 | `var(--g-diplomat)` | `#fff` | — |

**E. 解锁动画（爽感核心）**

```css
@keyframes badgeUnlock{
  0%  {opacity:0;transform:scale(.4) rotate(-25deg)}
  60% {opacity:1;transform:scale(1.15) rotate(3deg)}
  100%{opacity:1;transform:scale(1) rotate(var(--tilt))}
}
@keyframes badgeRing{
  0%  {box-shadow:0 0 0 0 var(--ac)}
  100%{box-shadow:0 0 0 14px transparent}
}
.bdg{
  animation:badgeUnlock 520ms var(--ease-bounce) both;
  animation-delay:calc(var(--i) * 110ms);   /* --i 由 JS 按索引注入 */
}
.bdg::after{
  content:'';position:absolute;inset:-2px;border-radius:inherit;pointer-events:none;
  animation:badgeRing 600ms var(--ease-out) both;
  animation-delay:calc(var(--i) * 110ms + 180ms);
}
```
> 触发时机：`IntersectionObserver` 首次进入视口才播（`threshold:.35`），且**只播一次**。页面加载即播会被用户滚过而浪费。

**F. 灰态未解锁**（`.bdg--locked`，只渲染最接近的 2–3 个）

```css
.bdg--locked{
  opacity:.28;border-style:dashed;box-shadow:none;
  animation:none;                    /* 不参与解锁动画 */
  border-top-color:var(--ink-5);
}
.bdg--locked .bdg-ic::before{content:'🔒'}
/* 副标改为解锁条件，如「三维全填即解锁」→ 制造再测动机 */
```

**G. 与现有 `.ach` 的关系**：`.ach`（第 9 位区块内的竖排列表）**保留但降级**为分享区内的补充清单；`.badge-hero` 是前置的主展示。两者数据源同为 `calcBadges()`，需把该调用从 `buildShareSection`（multi.js:285）中提出，提前到结果渲染主流程 —— 这是原型构建师的改动点。

---

### 5.3 分享区高潮版式 `.share-sec--hero` 🆕

> 解 P1 情绪断层 + P0 传播闭环的视觉承载。

**A. 出血容器**（打破 620px 卡片流 —— 高潮的关键）

```css
.share-sec--hero{
  margin-top:var(--space-10);                    /* 40px 呼吸断隔 */
  margin-inline:calc(var(--gutter) * -1);        /* 左右出血到屏幕边缘 */
  background:
    radial-gradient(rgba(255,255,255,.5) 1.6px,transparent 1.6px) 0 0/20px 20px,
    linear-gradient(135deg,var(--yellow) 0%,var(--coral) 48%,var(--pink) 100%);
  border-block:var(--bw-heavy) solid var(--line);  /* 只留上下描边 */
  border-inline:none;
  border-radius:var(--r-xl) var(--r-xl) 0 0 / var(--r-xl);
  padding:var(--space-8) var(--space-6) var(--space-7);  /* 32px 24px 28px */
  box-shadow:var(--shadow-2xl);
  text-align:center;
}
/* 宽屏(≥660px)恢复卡片形态，避免出血过宽显得散 */
@media(min-width:660px){
  .share-sec--hero{
    margin-inline:0;border:var(--bw-heavy) solid var(--line);
    border-radius:var(--r-xl);
  }
}
```

**B. 内部结构与规格**

| 元素 | 规格 |
|---|---|
| ① 斜贴小标签 | 「最后一步」/ `bg:#fff` / `--fs-2xs`(11px) / `--fw-black` / `rotate(-2deg)` / `border:var(--bw-thin)` / `--shadow-2xs` |
| ② 主标题 | `--fs-3xl`(26px) / `--fw-black` / `--ls-tight` / `--lh-tight` / `color:var(--ink)`（**不用白字**，见 §4.7） |
| ③ 副标 | `--fs-sm`(13px) / `--fw-bold` / `color:#5A4A55` / `--lh-relaxed` / `max-width:300px;margin-inline:auto` |
| ④ **分享图缩略预览** 🆕 | `width:140px` / `aspect-ratio:1080/2020` / `object-fit:cover;object-position:top` / `border:var(--bw-thick) solid var(--line)` / `border-radius:var(--r-sm)` / `box-shadow:var(--shadow)` / `rotate(-3deg)` / `margin:var(--space-5) auto var(--space-6)` / 点击直接放大 —— **转化关键：先看见成品再决定** |
| ⑤ 主 CTA | `padding:var(--space-5) var(--space-10)`(20px 40px) / `--fs-lg`(17px) / `--fw-black` / `bg:var(--ink)` / `color:#fff`（**14.18:1 实算通过**，深底白字是安全的；危险的是浅珊瑚底白字，见 §4.7） / `border:var(--bw-thick)` / `--r-pill` / `--shadow-lg` / hover `--lift-lg`+`--shadow-2xl` |
| ⑥ 次 CTA | 同尺寸 `bg:#fff;color:var(--ink)` / `--shadow` |
| ⑦ 按钮组 | `display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap`；小屏(≤400px) `flex-direction:column`，各 `width:100%` |

**C. 主 CTA 呼吸微动**（唯一允许的常驻动画，克制）

```css
@media (prefers-reduced-motion:no-preference){
  @keyframes ctaBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
  .share-sec--hero .btn-share.primary{
    animation:ctaBreathe var(--dur-breathe) ease-in-out infinite;
  }
  /* hover/active 时暂停，避免与位移叠加打架 */
  .share-sec--hero .btn-share.primary:hover,
  .share-sec--hero .btn-share.primary:active{animation-play-state:paused}
}
```

**D. 结果页吸底分享条 `.share-dock` 🆕**（直接解 P1「分享区在第 9 位滚不到」）

| 属性 | 值 |
|---|---|
| 定位 | `position:fixed;left:0;right:0;bottom:0;z-index:var(--z-sticky)`(50) |
| 高度 | `56px` + `padding-bottom:env(safe-area-inset-bottom)` |
| 背景 | `#fff` |
| 描边 | `border-top:var(--bw-thick) solid var(--line)` |
| 阴影 | `0 -4px 0 rgba(43,34,51,.08)`（向上硬阴影，唯一例外方向） |
| 内容 | 左：32px 分享图缩略（`--r-2xs`+`--bw-thin`）+ 结果名 `--fs-sm`；右：`--fs-sm`/`--fw-black` 胶囊按钮 `bg:var(--ink)` `padding:var(--space-2) var(--space-5)` |
| 出现 | 滚过 `.hero-card` 底边后滑入：`translateY(100%)`→`0`，`var(--dur-slow) var(--ease-pop-soft)` |
| 隐藏 | `.share-sec--hero` 进入视口时滑出（避免与主分享区重复） |
| 补偿 | `.result-wrap{padding-bottom:calc(var(--space-16) + 56px)}` |

**E. 分享图上的回链区（供 `share-card-v2.js` 落地，画布内坐标，1080×2020）**

| 元素 | 规格 |
|---|---|
| 二维码 | `132×132px`，位于 `x:1080-84-132=864, y:2020-84-132=1804`（沿用 84px 安全边距）；白底 + `8px` 内衬 + `6px solid #2B2233` 描边 + `12px` 圆角 |
| 回链文字 | 二维码左侧，`--fs` 等价 `24px/600`，两行：站点域名 + 「扫码测你的」 |
| 与现有品牌区关系 | 品牌区占 80–100%（y:1616–2020），二维码放在该区右下，不侵占 `◈ TRI·PERSONA` 字标（保持在左侧） |

---

### 5.4 可折叠严谨性区块 `.rigor` 🆕

> 收纳 618 字（方法与依据 184 + 免责 434），并把严谨性从负担翻转为信任信号。

**A. 容器（关键：撤掉硬阴影 = 贴回纸面 = 降权）**

```css
.rigor{
  margin-top:var(--space-6);                              /* 24px */
  background:var(--paper-2);                              /* #FBFAFD 近纸白 */
  border:var(--bw-base) solid rgba(43,34,51,.22);         /* 2.5px 但半透明 —— 虚化 */
  border-radius:var(--r-md);                              /* 20px */
  box-shadow:none;                                        /* ★ 唯一无硬阴影的容器 */
  overflow:hidden;
}
```
> 对比：`.big-disclaimer` 现状是深底 `#2B2233` + `3.5px` + `--shadow-lg`（权重 5/5）→ 改造后权重 1/5。**内容一字不删，只换外衣。**

**B. `<summary>` 折叠头（沿用现有 `.src-details` 的原生 details 方案）**

```css
.rigor summary{
  display:flex;align-items:center;gap:var(--space-2);
  padding:var(--space-4);                     /* 16px */
  font-size:var(--fs-sm);                     /* 13px */
  font-weight:var(--fw-heavy);                /* 800 */
  color:var(--ink-2);                         /* 不用 --ink，主动降一档 */
  cursor:pointer;list-style:none;
}
.rigor summary::-webkit-details-marker{display:none}
.rigor summary .ic{                            /* 方章图标 */
  width:22px;height:22px;flex:none;display:grid;place-items:center;
  background:var(--track);                     /* ★ 不用亮黄，避免抢眼 */
  border:var(--bw-thin) solid rgba(43,34,51,.3);
  border-radius:var(--r-2xs);
  transform:rotate(-4deg);font-size:var(--fs-xs);
}
.rigor summary .arrow{margin-left:auto;transition:rotate var(--dur-base)}
.rigor[open] summary .arrow{rotate:90deg}
.rigor[open] summary{border-bottom:var(--bw-thin) dashed rgba(43,34,51,.16)}
```

**C. 语义翻转：折叠态就展示 5 级依据徽章**

标题文案定位为 **「🔬 依据分级与可信度声明」**（不是「免责声明」）。`summary` 下方**折叠时也可见**一行 `.ev-badge` 胶囊，复用现有 5 个类：

```html
<div class="rigor-grades">
  <span class="ev-badge ev-empirical">实证支持</span>
  <span class="ev-badge ev-contested">存争议</span>
  <span class="ev-badge ev-heuristic">启发式</span>
  <span class="ev-badge ev-tradition">传统说法</span>
  <span class="ev-badge ev-refuted">已被否证</span>
</div>
```
```css
.rigor-grades{
  display:flex;flex-wrap:wrap;gap:var(--space-15);       /* 6px */
  padding:0 var(--space-4) var(--space-4);
}
.rigor-grades .ev-badge{opacity:.9}
```
> 效果：不读一个字，用户 0.5 秒内接收到「这测试把证据分了 5 级，很严谨」。**618 字的价值被压缩成一行彩色胶囊，且不占情绪。**
> 再补一行 `--fs-2xs` / `--ink-5` 的资质数字：「21 篇文献 · 5 级证据分类」—— 与 §5.5 社会证明同源。

**D. 展开内容（比正文小一档、浅一档）**

```css
.rigor-body{padding:var(--space-4);font-size:var(--fs-xs);line-height:var(--lh-relaxed);color:var(--ink-2)}
.rigor-body h5{font-size:var(--fs-sm);font-weight:var(--fw-black);color:var(--ink-3);margin-bottom:var(--space-2)}
.rigor-body li{padding:var(--space-2) 0 var(--space-2) var(--space-3);position:relative}
.rigor-body li::before{
  content:'';position:absolute;left:0;top:calc(var(--space-2) + .55em);
  width:5px;height:5px;border-radius:var(--r-circle);background:var(--ink-5);
}
/* 需要突出的风险条目：左侧竖线标记，不用深底 */
.rigor-warn{
  background:var(--tint-orange);
  border-left:4px solid var(--warn);
  border-radius:0 var(--r-xs) var(--r-xs) 0;
  padding:var(--space-3) var(--space-4);margin:var(--space-3) 0;
  box-shadow:none;
}
```

**E. `.big-disclaimer` 深色版的处置**

不删除，**改为仅在「关于本站」独立页/弹层使用**。结果页主流程内一律用 `.rigor`。深色满版是本设计系统的最高权重，应留给主人格卡与金句（`.quote-card` / `.ps-one` 已在用），不该分配给免责。

**F. 位置建议（供原型构建师）**：`.rigor` 放在 `.share-sec--hero` **之后**，作为结果页收尾。绝不放在「看完结论 → 想分享」之间。

**G. ⚠️ 与已落地代码的衔接（写作期间代码发生变更，已核实）**

写本文档期间 `multi.js` / `style.css` 被并行修改（style.css 1290 → 1325 行）。已核实原型构建师**已经完成两项**：

| 已落地 | 位置 | 状态 |
|---|---|---|
| 分享区上移到情绪高点 | `multi.js:650-658`，顺序已改为 画像 → 总结 → **分享** → 详情 → 方法 → 严谨性 | ✅ P1 情绪断层的**顺序**问题已解 |
| 免责声明改 `<details>` 折叠 | `multi.js:551` `.big-disclaimer.bd-fold` + `style.css:1297-1325` | ✅ 折叠已实现，摘要行常驻 |

**因此本节 §5.4 的定位需要收窄** —— 折叠与顺序已不必再做，但**我的核心论点仍未被覆盖**：

> 现落地版本仍是 `.big-disclaimer`（深底 `#2B2233` + `--bw-heavy` 3.5px + `--shadow-lg`）= **全站最高视觉权重 5/5**，只是内容被折叠了。折叠解决了「长度」，没解决「**权重**」。它此刻仍与 `.hero-card` 同级抢眼，且是结果页唯一的深色满版块，视觉上像一块「警告牌」压在页尾。

**剩余待做（我的增量建议，非重复劳动）**：
1. **降权**：`.bd-fold` 追加 `box-shadow:none` + 底色改 `--paper-2` + 描边改 `rgba(43,34,51,.22)` → 权重 5/5 降到 1/5（§5.4-A）。深色满版应留给 `.quote-card` / `.ps-one` 这类情绪高点。
2. **语义翻转**：`summary` 文案由「⚠️ 免责声明」改为「🔬 依据分级与可信度声明」，图标 `⚠️`→`🔬`（`⚠️` 是风险信号，会强化"这测试不可信"的暗示；`🔬` 传达严谨）。
3. **补依据徽章行**：折叠态下常驻 5 个 `.ev-badge` 胶囊 + 「21 篇文献 · 5 级证据分类」（§5.4-C）—— 这是把 618 字压缩成信任信号的关键一步，当前版本尚无。
4. 已实测其新配色无障碍**合规**（`#C4BACE` on `#2B2233` = 8.16:1，`--yellow` on `#2B2233` = 11.01:1），若按建议 1 改浅底，需同步把这两个色换成 `--ink-2` / `--ink-3`。

> 若改浅底后仍希望保留一处深色收尾，建议**深色只用于 `summary` 一行**（保持诚实性的视觉存在感），展开区用浅底 —— 折中方案。

---

### 5.5 社会证明条 `.proof-bar` 🆕（首页）

> 解 P2 无社会证明。位置：`.btn-main` 下方，升级现有 `.home-stats`。

**⚠️ 先定原则：不许编造人数。**

这个项目的核心价值观是「refuted / tradition 如实标注」「占星已被实证否证也照写」。在这样的产品上贴一个「已有 128,432 人测过」的假数字，是自毁根基 —— GitHub Pages 纯静态无后端，数字必然是伪造的，一旦被识破，损害远大于收益。

**推荐方案 A（主）：用真实产品事实做社会证明**

项目自身的硬数据比假人数更有说服力，且顺带传达专业度：

```
48 题七级量表  ·  21 篇文献支撑  ·  245 项自动化测试
```

**方案 B（辅，可选）**：若坚持要真人数，接 CountAPI / Cloudflare Worker 计数器，文案严格写「累计访问 N 次」而非「N 人测过」。上线前必须确认口径可核验。

**A. 事实条规格**

```css
.proof-bar{
  display:inline-flex;align-items:center;gap:var(--space-4);   /* 16px */
  margin-top:var(--space-6);                                   /* 24px */
  background:#fff;
  border:var(--bw-base) solid var(--line);                     /* 2.5px */
  border-radius:var(--r-pill);
  padding:var(--space-3) var(--space-5);                       /* 12px 20px */
  box-shadow:var(--shadow-2xs);
  transform:rotate(-.8deg);                                    /* 贴纸微斜 */
}
.pb-item{display:flex;flex-direction:column;align-items:center;line-height:1}
.pb-num{
  font-size:var(--fs-lg);font-weight:var(--fw-black);          /* 17px/900 */
  font-variant-numeric:tabular-nums;                            /* ★ count-up 防抖 */
  letter-spacing:var(--ls-snug);
}
.pb-lbl{font-size:var(--fs-3xs);font-weight:var(--fw-bold);color:var(--ink-4);margin-top:var(--space-1)}
.pb-sep{width:2px;height:26px;background:var(--line);opacity:.15;border-radius:2px}
```
数字 count-up：`var(--dur-bar)`(900ms) `var(--ease-out)`，`IntersectionObserver` 首屏触发，只播一次。

**B. 头像堆叠**（可信度装饰，复用 `avatars.js`，不承载数字断言）

```css
.pb-faces{display:flex;flex:none}
.pb-faces .av-wrap{
  width:var(--av-2xs);height:var(--av-2xs);                    /* 26px */
  border-radius:var(--r-circle);overflow:hidden;
  border:var(--bw-thin) solid var(--line);
  background:#fff;
  margin-left:calc(var(--space-2) * -1);                       /* -8px 堆叠（注意：-var() 不是合法 CSS，必须用 calc） */
  box-shadow:1px 1px 0 var(--line);
}
.pb-faces .av-wrap:first-child{margin-left:0}
.pb-faces .av-wrap:nth-child(odd){transform:rotate(-4deg)}
.pb-faces .av-wrap:nth-child(even){transform:rotate(3deg)}
```

**C. 热门类型条 `.hot-types` 🆕**（真实社会证明 + 顺带教育）

数据源：CAPT 美国抽样人口占比（README 已声明，真实可核验）。

```css
.hot-types{
  display:flex;gap:var(--space-3);                             /* 12px */
  margin-top:var(--space-5);
  overflow-x:auto;scroll-snap-type:x proximity;
  padding-inline:var(--gutter);
  margin-inline:calc(var(--gutter) * -1);                       /* 出血滚动，暗示"还有更多" */
  scrollbar-width:none;
}
.hot-types::-webkit-scrollbar{display:none}
.ht{
  flex:none;width:68px;scroll-snap-align:start;
  display:flex;flex-direction:column;align-items:center;gap:var(--space-1);
  background:#fff;
  border:var(--bw-thin) solid var(--line);                     /* 2px */
  border-radius:var(--r-xs);                                   /* 10px */
  padding:var(--space-2) var(--space-1);
  box-shadow:var(--shadow-2xs);
  cursor:pointer;transition:transform var(--dur-fast) var(--ease-press),box-shadow var(--dur-fast);
}
.ht:nth-child(odd){transform:rotate(-1.8deg)}
.ht:nth-child(even){transform:rotate(1.5deg)}
.ht:hover{transform:var(--lift-sm) rotate(0);box-shadow:var(--shadow-sm)}
.ht-face{width:32px;height:32px;border-radius:var(--r-circle);overflow:hidden;border:1.5px solid var(--line)}
.ht-code{font-size:var(--fs-2xs);font-weight:var(--fw-black);letter-spacing:var(--ls-snug)}
.ht-pct{font-size:var(--fs-3xs);font-weight:var(--fw-bold);color:var(--ink-4);font-variant-numeric:tabular-nums}
```
标题：`「16 型人口占比（CAPT 抽样）」`，`--fs-2xs` / `--ink-4`。展示 8 个，按占比降序，点击可跳到该类型的三维入口（顺带解 P0 的次级路径）。

---

## 6. 交付给下游的落地清单

### 6.1 优先级排序（按对完成率/分享率的影响）

| 优先 | 组件/改动 | 对应诊断 | 我的交付状态 |
|---|---|---|---|
| ~~P0~~ | ~~分享区上移到情绪高点~~ | P1 | ✅ **已由原型构建师落地**（`multi.js:650`） |
| ~~P1~~ | ~~免责声明折叠~~ | P1 | ✅ **已落地**（`multi.js:551`）；但**权重未降**，见 §5.4-G |
| **P0** | `.share-dock` 吸底分享条 | P1 分享区仍需滚动才可见 | §5.3-D 规格完成 |
| **P0** | `.share-sec--hero` 出血高潮版式 + 缩略预览 | P1 情绪高潮强度 | §5.3-A/B 规格完成 |
| **P0** | 分享图二维码/回链坐标 | P0 图片传播无回流 | §5.3-E 画布坐标完成 |
| **P0** | `.badge-hero` 徽章前置 | P2 徽章埋在分享区内 | §5.2 规格完成 |
| **P1** | `.big-disclaimer` **降权**（撤阴影+浅底+语义翻转+依据徽章行） | P1 618 字仍是最高视觉权重 | §5.4-A/C/G 规格完成 |
| **P1** | `.ms-pop` 里程碑 + 分段进度条 | P1 答题激励缺失 | §5.1 规格完成 |
| **P1** | CTA 对比度修复（`.btn-main` / `.ec-go` 改深墨字） | 新发现（无障碍，实算 2.31:1） | §4.7 修法完成 |
| **P2** | `.proof-bar` + `.hot-types` | P2 无社会证明 | §5.5 规格完成（含"不许造假"约束） |

> ⚠️ **并发提醒**：本文档基于 `style.css` 1290 行版本统计；当前已 1325 行且仍在变动。§0 与 §3.1 的硬编码计数可能已有小幅偏移，但结论（30 档字号 / 无间距系统 / 无动效令牌）不受影响 —— 新增的 29 行同样是硬编码（如 `.bd-sum-txt b{font-size:14.5px}`、`.bd-details summary{padding:20px 22px}`、`transition:background .2s`），**印证了令牌缺口正在持续扩大**，越早引入令牌越省事。

### 6.2 令牌落地顺序（避免一次性大改造回归）

1. **只加不改**：把本文档 §2–§4 全部令牌追加到 `:root`（新增变量，零风险，现有样式不受影响）
2. **新组件 100% 用令牌**：§5 的 6 个新组件从第一行就用变量，不留硬编码
3. **按屏渐进替换**：答题页 → 结果页 → 首页 → 表单页；每屏改完在 375 / 400 / 520 / 560 / 768 五档目视比对
4. **最后收敛**：全局搜 `font-size:1` `gap:` `padding:` 清理残余

### 6.3 保持贴纸风一致性的硬性约束（下游必须遵守）

- ✅ 每个新容器必须有**厚描边**（≥`--bw-thin` 2px）+ **硬阴影**（`Npx Npx 0`，零模糊）
- ✅ 硬阴影方向统一 **右下**（唯一例外：`.share-dock` 向上，因其吸底）
- ✅ 阴影与位移必须配对（§4.3 配对规则），否则光源漂移
- ✅ 装饰性容器加 `±1~4deg` 贴纸微斜；**承载正文的容器不斜**（影响可读性）
- ❌ 禁止模糊阴影用于纸面元素（仅 modal / toast / `.bg-deco .blob` 例外）
- ❌ 禁止在纸面对象上用玻璃拟态 / 长投影 / 内阴影
- ❌ `--bw-heavy`(3.5px) + `--shadow-2xl` 组合全站限 **3 处**（`.badge-hero` / `.share-sec--hero` / `.ms-pop`）—— 舞台级权重稀缺才有效
- ❌ `--ease-bounce` 全站限 **3 处**（里程碑入场 / 徽章解锁 / 分享图生成完成）

### 6.4 与其他角色的接口

**给原型构建师（需要 JS/HTML 侧配合的点）**：
- `calcBadges()` 调用需从 `multi.js:285 buildShareSection` 提出，前置到结果渲染主流程 → `.badge-hero` 才有数据
- `.bdg` 需 JS 注入 `style="--i:0|1|2..."` 与 `--ac` → stagger 与配色生效
- `.ms-pop` 需 `app.js` 在 Q12/24/36 触发，并传入四维当前倾向（只给色块，不给数字）
- `.share-dock` 需 `IntersectionObserver` 监听 `.hero-card` 与 `.share-sec--hero`
- `.hot-types` 的占比数据取 `types.js` 现有 CAPT 字段，无需新数据
- `og:image` 缺失（已核实 `index.html` 有 `og:type/title/description`，**无 `og:image`**）→ 需生成 1200×630 默认封面，沿用 §5.3-E 的品牌区手法
- `.proof-bar` 数字**必须**用真实产品事实（48/21/245），不接受伪造人数

**未在我职责内、但发现需提醒的**：`share-copy.json` 6 条 CTA 结尾「👉」后无链接占位符 —— 建议加 `{url}` 变量，与 §5.3-E 的回链共用同一站点常量。

---

## 7. 完整令牌汇总（可直接粘贴追加到 `:root`）

```css
:root{
  /* ===== 间距 ===== */
  --space-0:0; --space-05:2px; --space-1:4px; --space-15:6px; --space-2:8px;
  --space-3:12px; --space-4:16px; --space-5:20px; --space-6:24px; --space-7:28px;
  --space-8:32px; --space-10:40px; --space-12:48px; --space-16:64px;
  --gutter:20px;
  --w-home:560px; --w-quiz:600px; --w-result:620px; --w-form:660px;

  /* ===== 字号 ===== */
  --fs-3xs:10px; --fs-2xs:11px; --fs-xs:12px; --fs-sm:13px; --fs-base:14px;
  --fs-md:15px; --fs-lg:17px; --fs-xl:19px; --fs-2xl:22px; --fs-3xl:26px;
  --fs-4xl:32px; --fs-5xl:42px; --fs-6xl:60px;

  /* ===== 行高 / 字重 / 字距 ===== */
  --lh-tight:1.15; --lh-snug:1.4; --lh-normal:1.6; --lh-relaxed:1.75; --lh-loose:1.9;
  --fw-normal:500; --fw-medium:600; --fw-bold:700; --fw-heavy:800; --fw-black:900;
  --ls-tight:-0.03em; --ls-snug:-0.01em; --ls-none:0; --ls-wide:0.04em; --ls-wider:0.12em;

  /* ===== 动效时长 ===== */
  --dur-instant:90ms; --dur-fast:130ms; --dur-base:200ms; --dur-slow:350ms;
  --dur-enter:450ms; --dur-reveal:550ms; --dur-bar:900ms; --dur-milestone:1800ms;
  --dur-bobble:2600ms; --dur-orbit:3400ms; --dur-breathe:2400ms;

  /* ===== 缓动 ===== */
  --ease-pop:cubic-bezier(.2,1.2,.3,1);
  --ease-pop-soft:cubic-bezier(.2,1.15,.3,1);
  --ease-out:cubic-bezier(.2,1,.3,1);
  --ease-press:cubic-bezier(.3,.8,.5,1);
  --ease-bounce:cubic-bezier(.34,1.56,.64,1);
  --ease-linear:linear;

  /* ===== 描边 ===== */
  --bw-hair:1.5px; --bw-thin:2px; --bw-base:2.5px; --bw-thick:3px; --bw-heavy:3.5px;

  /* ===== 圆角 ===== */
  --r-2xs:8px; --r-xs:10px; --r-xl:32px; --r-pill:999px; --r-circle:50%;
  /* --r-sm:14px --r-md:20px --r-lg:28px 已存在 */

  /* ===== 硬阴影 ===== */
  --shadow-press:1px 1px 0 var(--line);
  --shadow-xs:1.5px 1.5px 0 var(--line);
  --shadow-2xs:2px 2px 0 var(--line);
  --shadow-xl:8px 8px 0 var(--line);
  --shadow-2xl:12px 12px 0 var(--line);
  /* --shadow-sm:3px --shadow:4px --shadow-lg:6px 已存在 */
  --shadow-float:0 8px 24px rgba(43,34,51,.25);
  --shadow-overlay:0 20px 50px rgba(0,0,0,.4);

  /* ===== 位移 ===== */
  --lift-sm:translate(-1px,-1px); --lift:translate(-2px,-2px); --lift-lg:translate(-3px,-3px);
  --press:translate(2px,2px); --press-lg:translate(3px,3px);

  /* ===== z-index ===== */
  --z-under:-1; --z-bg:0; --z-base:1; --z-raised:10;
  --z-sticky:50; --z-milestone:80; --z-modal:100; --z-toast:200;

  /* ===== 文本色阶 ===== */
  --ink-3:#463C50; --ink-4:#5A4E63; --ink-5:#7A7085;
  /* --ink --ink-2 --line 已存在 */

  /* ===== 语义色 ===== */
  --ok:#28A87E; --ok-line:#1F9B72;
  --no:#D96A8A; --no-line:#D0567B;
  --neutral-line:#9A93A3; --warn:#C9622F;
  --coral-deep:#E85D3D;   /* 仅限 ≥19px 粗体白字（3.46:1）；正文文字色不可用，见 §4.7 */
  --g-analyst:#9B7BEA; --g-diplomat:#3FB98C; --g-sentinel:#3F94D6; --g-explorer:#F2A63B;

  /* ===== 浅色底 ===== */
  --tint-mint:#DDF5EB; --tint-mint-2:#F2FBF7;
  --tint-yellow:#FFF3D6; --tint-amber:#FFE9C9;
  --tint-orange:#FFF4E8; --tint-cream:#FFFBF0;
  --tint-lilac:#F0E7FF; --tint-lilac-2:#F4F0FA;
  --tint-pink:#FFF4F7; --tint-gray:#F4F0F8;
  --track:#EDE8F2; --paper-2:#FBFAFD; --on-ink:#FFF6E5;

  /* ===== 尺寸 ===== */
  --tap-min:44px;
  --av-2xs:26px; --av-xs:38px; --av-sm:52px; --av-md:62px; --av-lg:82px; --av-xl:118px;
  --bar-h:14px; --bar-h-lg:20px;
}
```

---

*设计系统参照：Spotify（Wrapped 版式基因）为主，Miro（贴纸词汇）、Nike（解锁回弹）为局部补充。*
*所有规格基于 `assets/css/style.css` 1290 行实测统计，非凭空设计。*
