const fs = require('fs');
const path = require('path');
const B = path.join(__dirname, '..') + '/';
const src = fs.readFileSync(B + 'assets/js/animals.js', 'utf8');
const api = new Function(src + `; return {animalAvatar, animalAvatar512, animalAvatar128, ANIMAL_SPEC};`)();

const S = api.ANIMAL_SPEC;
const GROUPS = {
  analyst:  { name: '分析家 NT', color: '#8B7BD8', desc: '紫罗兰色系 · 理性思辨' },
  diplomat: { name: '外交家 NF', color: '#5FBF95', desc: '薄荷绿色系 · 理想共情' },
  sentinel: { name: '守护者 SJ', color: '#5B9BD5', desc: '天空蓝色系 · 秩序可靠' },
  explorer: { name: '探险家 SP', color: '#E8A44D', desc: '蜜橘色系 · 行动灵活' }
};
const CN = {INTJ:'建筑师',INTP:'逻辑学家',ENTJ:'指挥官',ENTP:'辩论家',
INFJ:'提倡者',INFP:'调停者',ENFJ:'主人公',ENFP:'竞选者',
ISTJ:'物流师',ISFJ:'守卫者',ESTJ:'总经理',ESFJ:'执政官',
ISTP:'鉴赏家',ISFP:'探险家',ESTP:'企业家',ESFP:'表演者'};

let h = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MBTI 16 型动物头像设计稿</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;
     background:#FFFBF4;color:#2B2233;padding:36px 24px 80px}
.wrap{max-width:1180px;margin:0 auto}
h1{font-size:34px;font-weight:900;letter-spacing:-1px}
.sub{color:#6B6076;font-size:14px;font-weight:600;margin-top:8px;line-height:1.7}
h2{font-size:22px;font-weight:900;margin:44px 0 6px;padding-left:14px;border-left:6px solid var(--gc)}
.gd{font-size:12.5px;color:#6B6076;font-weight:600;padding-left:20px;margin-bottom:20px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
@media(max-width:960px){.grid{grid-template-columns:repeat(2,1fr)}}
.card{background:#fff;border:3px solid #2B2233;border-radius:24px;overflow:hidden;
      box-shadow:5px 5px 0 #2B2233}
.card .av{display:block;width:100%;height:auto;background:#FAFAFA}
.info{padding:14px 15px 16px}
.code{font-size:19px;font-weight:900;letter-spacing:-.3px}
.cn{font-size:12px;color:#6B6076;font-weight:700;margin-top:1px}
.ani{font-size:14px;font-weight:800;margin-top:8px}
.tr{font-size:11.5px;line-height:1.65;color:#5A4E63;font-weight:500;margin-top:8px;
    padding-top:8px;border-top:1.5px dashed rgba(43,34,51,.16)}
.sw{display:flex;gap:5px;margin-top:10px}
.sw i{width:22px;height:22px;border-radius:6px;border:2px solid #2B2233;display:block}
.sec{background:#fff;border:3px solid #2B2233;border-radius:24px;padding:26px;
     margin:44px 0;box-shadow:5px 5px 0 #2B2233}
.sec h3{font-size:18px;font-weight:900;margin-bottom:16px}
.specs{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:22px}
.spx{text-align:center}
.spx .lbl{font-size:12px;font-weight:800;margin-bottom:10px;color:#6B6076}
.spx svg{border:2px dashed rgba(43,34,51,.25);border-radius:12px;background:#FAFAFA}
.row128{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin-top:6px}
table{width:100%;border-collapse:collapse;font-size:12.5px}
th,td{padding:9px 8px;text-align:left;border-bottom:1.5px solid rgba(43,34,51,.13)}
th{font-weight:900;background:#FFF3D6;font-size:11.5px}
td b{font-weight:800}
.mono{font-family:ui-monospace,Menlo,monospace;font-size:11px}
</style></head><body><div class="wrap">
<h1>MBTI 16 型动物拟物化头像</h1>
<p class="sub">扁平化卡通 · 圆润线条 · 512×512 正方形构图 · 大头像居中<br>
统一描边 #2B2233（非纯黑）· 四大群组色系区分 · 圆形与方形圆角两版裁切</p>`;

// 四组展示
Object.entries(GROUPS).forEach(([gk, g]) => {
  h += `<h2 style="--gc:${g.color}">${g.name}</h2><p class="gd">${g.desc}</p><div class="grid">`;
  Object.keys(S).filter(k => S[k].group === gk).forEach(k => {
    const sp = S[k];
    h += `<div class="card">
      ${api.animalAvatar(k, {size:'100%', shape:'none', pattern:true})}
      <div class="info">
        <div class="code">${k}</div>
        <div class="cn">${CN[k]}</div>
        <div class="ani">${sp.emoji} ${sp.animal}</div>
        <div class="sw">
          <i style="background:${sp.bg}" title="背景 ${sp.bg}"></i>
          <i style="background:${sp.main}" title="主色 ${sp.main}"></i>
          <i style="background:${sp.body}" title="身体 ${sp.body}"></i>
          <i style="background:${sp.shade}" title="阴影 ${sp.shade}"></i>
          <i style="background:${sp.accent}" title="强调 ${sp.accent}"></i>
        </div>
        <div class="tr">${sp.trait}</div>
      </div></div>`;
  });
  h += '</div>';
});

// 规格演示
h += `<div class="sec"><h3>输出规格演示（以 INFP 做梦小蝴蝶为例）</h3><div class="specs">
  <div class="spx"><div class="lbl">512 × 512 圆形</div>${api.animalAvatar('INFP',{size:200,shape:'circle'})}</div>
  <div class="spx"><div class="lbl">512 × 512 方形圆角</div>${api.animalAvatar('INFP',{size:200,shape:'squircle'})}</div>
  <div class="spx"><div class="lbl">128 × 128 圆形（无背景图案）</div>${api.animalAvatar128('INFP','circle')}</div>
  <div class="spx"><div class="lbl">128 × 128 方形圆角</div>${api.animalAvatar128('INFP','squircle')}</div>
</div></div>`;

// 128 小尺寸全览（验证小图辨识度）
h += `<div class="sec"><h3>128×128 小尺寸全览 — 验证缩小后是否仍可辨识</h3><div class="row128">`;
Object.keys(S).forEach(k => h += api.animalAvatar128(k, 'circle'));
h += `</div><div class="row128" style="margin-top:16px">`;
Object.keys(S).forEach(k => h += api.animalAvatar128(k, 'squircle'));
h += `</div></div>`;

// 设定表
h += `<div class="sec"><h3>完整形象设定表</h3>
<table><thead><tr><th>类型</th><th>形象</th><th>主色</th><th>关键视觉元素</th><th>性格关联</th></tr></thead><tbody>`;
Object.keys(S).forEach(k => {
  const sp = S[k];
  const els = [];
  const earMap={tuft:'羽冠',cat:'猫耳',fox:'狐耳',dogUp:'立耳',dogFloppy:'垂耳',wolf:'狼耳',
    koala:'圆绒耳',deer:'鹿角',antenna:'触角',leaf:'藤蔓冠',fin:'背鳍',none:'—'};
  const eyeMap={oneClosed:'单眼微闭',glasses:'圆眼镜',sharp:'锐利眼',wink:'眨眼',closed:'闭眼笑',
    teary:'水汪眼',happy:'月牙眼',star:'星星眼',calm:'平静眼',gentle:'温和眼',lashes:'长睫毛',bright:'高光眼'};
  const accMap={blueprint:'卷起蓝图',question:'问号气泡',cape:'小斗篷',pen:'转笔',beard:'白长须',
    wings:'半透明翅膀',scarf:'围巾',shell:'格纹龟壳',blanket:'毛毯',tie:'领带',beeStripe:'蜂纹',
    wrench:'扳手',flower:'耳后花',sunglasses:'墨镜',lei:'花环',none:'—'};
  const patMap={stars:'星图',gears:'齿轮',rays:'放射线',bubbles:'对话气泡',rings:'年轮',petals:'花瓣',
    glow:'光晕',confetti:'彩色碎点',grid:'方格',hearts:'小心心',lines:'直线条',hexagon:'蜂巢六边形',
    parts:'零件',paint:'水彩斑',bolt:'闪电',notes:'音符'};
  els.push(earMap[sp.ears]||sp.ears, eyeMap[sp.eye]||sp.eye, accMap[sp.acc]||sp.acc,
           '背景'+(patMap[sp.pattern]||sp.pattern));
  if (sp.blush) els.push('腮红');
  h += `<tr><td><b>${k}</b><br><span style="color:#6B6076">${CN[k]}</span></td>
    <td>${sp.emoji} <b>${sp.animal}</b></td>
    <td><span class="mono">${sp.main}</span></td>
    <td>${els.join(' · ')}</td>
    <td style="font-size:11.5px;line-height:1.6">${sp.trait}</td></tr>`;
});
h += `</tbody></table></div></div></body></html>`;

fs.writeFileSync(B + 'animal-preview.html', h);
console.log('✅ 已生成 animal-preview.html');
console.log('   16 型 × 4 规格 = 64 个头像实例');
