/* Presentation only: read current rules; never change offers, costs or combat. */
(function(root){'use strict';
const X=typeof module!=='undefined'?require('./field-event.js'):root.XJ;
const {SKILLS,ITEMS,GIFTS,RECIPES}=X;
const trainingRank=(run,id)=>run.trainingLv?run.trainingLv(id):run.training?.[id]||0;
function trainingInfo(run,id){if(run.item==='screen'&&['haste','weapon'].includes(id))return null;const d=X.TRAINING.find(d=>d.id===id);if(!d)return null;
 const pct=n=>Math.round(n*100),fixed=n=>Number(n.toFixed(2));
 const data={
 vigor:['固本','提高气血上限，并立即回复气血。',n=>`气血上限 ${100+n*4}`,'立即回复 15 气血，不超过新上限。','承伤余地更足'],
 power:['精进','提高伤害，适用于普攻与伤害神通。',n=>`基础增伤 +${fixed(n*2.5)}%`,'与爆发、悍勇、合围增伤相乘；不增加无伤害神通的效果。','普攻与伤害神通都受益'],
 reach:['摄物','更远拾取经验，也延长普攻索敌。',n=>`拾取 +${n*7} / 普攻索敌 +${n*12}`,'每阶拾取距离 +7、普攻索敌距离 +12；枪刺长度也 +12。持屏仅拾取受益；不延长弹道寿命或神通范围。','少绕路收取经验'],
 haste:['熟手','更快自动攻击，不加快神通或器物技。',n=>`普攻频率 +${pct(n*.08)}%`,'攻击间隔除以（1 + 8% × 阶数）。有近敌时才出手。','强化当前伤害普攻'],
 stride:['轻身','移动更快，方便绕敌与拾取。',n=>`修行移速 +${pct(n*.04)}%`,'与箓气和神通的移动倍率相乘；不免伤、不穿墙。','走位与脱围更从容'],
 manaRegen:['调元','持续多回一些法力，支持诸法运转。',n=>`额外回法 ${fixed(n*.6)}/秒`,'加在当前法力回复上，不提高法力上限，不缩短冷却。','有主动神通时更有用'],
 recovery:['养息','缓慢回复气血，减轻连续小伤。',n=>`常驻回血 ${fixed(n*.15)}/秒`,'仅战斗运行时回复，气血到上限即停；不恢复寿元，不救致死。','适合缓解小伤，不能硬扛敌群']
 };
 if(id==='weapon'){const item={
 bow:['习弓 · 分矢','普攻增加扇射副箭，每支为主箭四成伤害。',n=>`每轮 ${1+n} 箭`,'主箭伤害不变，副箭为本次主箭伤害的 40%；副箭继承普攻贯穿与破护，整轮只耗一次泉势，不额外触发帝观元追加打击。','扩大箭路，适合迎击敌群'],
 sword:['习剑 · 展锋','扩大已有的近身剑扫。',n=>`剑扫半径 ${110+n*20}`,'自动剑扫的触发距离每阶 +20，基础伤害仍为 11；不扩大G器物技。','敌人近身时覆盖更宽'],
 spear:['习枪 · 贯阵','普通突刺可多穿过一个敌人。',n=>`基础可刺 ${2+n} 敌`,'每阶额外命中一敌；可与洞泉声、镂金石的贯穿叠加，不延长枪刺、不改变器物技。','将敌人排成一线更有利'],
 thunderseal:['习令 · 远引','自动落雷能击中更远的敌人。',n=>`基础索敌 ${420+n*45}`,'每阶普攻索敌距离 +45，可叠加摄物；不增加落雷目标数、伤害或器物技范围。','更早接敌，保持距离']
 }[run.item];if(!item)return null;data.weapon=item;}
 const row=data[id];return {...d,title:row[0],purpose:row[1],stat:row[2],detail:row[3],fit:row[4]};
}
function trainingSummary(run,all=false){const rows=X.TRAINING.map(d=>trainingInfo(run,d.id)).filter(d=>d&&(all||trainingRank(run,d.id)>0));return `<details class="training-summary"><summary>修行强化${all?' · 本局规则':' · '+rows.reduce((n,d)=>n+trainingRank(run,d.id),0)+' 阶'}</summary><p>局内修行，不是原著神通；不占同参，也不改变神通重数。</p>${rows.length?rows.map(d=>{const n=trainingRank(run,d.id);return `<p><b>${d.title} · ${n}/${d.max} 阶</b><br>${d.stat(n)}${n===d.max?' · 已满阶':''}<br><span class="muted">${d.detail}</span></p>`;}).join(''):'<p>尚未选择强化；普通升级可选，重开清空。</p>'}</details>`;}
const name=id=>SKILLS.find(s=>s.id===id)?.name||'';
const copy={
 gate:['召出甲兵，替你追击近敌。','有近敌时召兵；兵数已足则等待'],
 light:['禁闭周敌、消解敌弹，并强化在场甲兵。','近敌或甲兵在场时施放'],
 body:['合围时增强攻防，脱围后恢复部分战伤。','至少两名近敌合围；不能恢复全部战伤'],
 edict:['展开令域，让普攻追加打击、召回远处甲兵。','令域内敌人受普攻时追加打击'],
 dusk:['血漠记下部分伤势，离域或收术后返还。','E 域内挪移另耗 8 法力；敌人也会返伤，致死不救'],
 spring:['泉势加持普攻，增加伤害与贯穿。','需伤害普攻；泉势尚有余击时等待'],
 rain:['向敌群降下青雨，持续磨伤并削去护持。','自动落在附近敌群；需敌人在雨中'],
 muddle:['惑乱敌群，打断攻势，使其背离你移动。','短暂惑敌；精英、首领更快清醒'],
 conceal:['藏匿身形，让追敌转向你留下的残息。','近敌逼近时发动；已发出的攻击仍危险'],
 dew:['洗去附近危险法区与迟缓，短时抵御地面伤害。','地面危险或迟缓时发动；不挡飞弹和接触'],
 angler:['投下幻饵，诱敌聚在一起。','不直接伤敌；受击会提前清醒'],
 peril:['展开险地，收束敌群并迟缓其移动。','不直接伤敌；精英、首领较难牵动'],
 gold:['淬炼普攻，增加锐气、贯穿并削去护持。','每五杀淬炼一层，最多六层'],
 armor:['凝出金胄，替你承受伤害。','甲量耗尽或到期消失；并非无敌'],
 thunder:['周身荡雷，越近的敌人受伤、震退越强。','敌人进入 175 距离内才施放'],
 flame:['向近敌持续吐焰，喷焰时移动更快。','敌人进入焰幅才施放'],
 zhiming:['灰焰逐击近敌，短暂封住法术敌人的施法。','优先法术敌人；不清除已有飞弹、法区或召物'],
 dali:['唤起随身南明心火，焚伤近敌、加快移动。','心火期间移动 +12%；不消弹、不免伤'],
 fragrance:['留下白色阴火，持续灼伤一片敌群。','定点灼伤；不冻结、不清除危险法区']};
const weapons={sword:['初试推荐','自动剑光，横扫近敌。'],bow:['远射 · 拉距排线','自动射箭，远处点杀。'],spear:['中距 · 排线突刺','自动突刺，刺中前方两敌。'],thunderseal:['玄雷 · 多点打击','自动落雷，器物技分击近敌。'],screen:['进阶 · 依赖神通输出','无伤害普攻，只停金属飞弹。']};
const gifts={whale:['法力更充足，支持持续施法。','被动 · 上限 160，基础回复 13/秒'],life:['燃寿换法力，短时大幅增伤。','Q 手动 · 耗 1 寿元（不可恢复），回法 80；增伤 85% 持续 6 秒'],sparrow:['平时轻身，受伤后短时加速、增伤。','被动 · 实际伤血才触发悍勇'],sunseal:['击败精英、首领，额外获得法力与经验。','被动 · 普通击杀不触发'],cloud:['驾雾轻身，移动速度提高。','被动 · 移动 +14%；不免伤、不穿墙'],firegift:['让雉离行吐焰更快转向敌人。','被动 · 需雉离行；不增加伤害']};
const delta={gate:l=>`甲兵 ${l+1} → ${l+2} 名；存在更久、伤害提高`,light:l=>`禁闭 ${(1.2+l*.4).toFixed(1)} → ${(1.2+(l+1)*.4).toFixed(1)} 秒；范围、伤害提高`,body:l=>`合围增伤上限 ${15+5*l}% → ${20+5*l}%；抵御、复伤提高`,edict:l=>`追加伤害 ${10+6*l} → ${16+6*l}；令域扩大`,dusk:l=>`记伤比例 ${18+6*l}% → ${24+6*l}%；血漠更大、更久`,spring:l=>`普攻附伤 +${10+8*l} → +${18+8*l}${l===2?'；助击再加两次':''}`,rain:l=>`每次伤害 ${6+3*l} → ${9+3*l}${l===2?'；新增随身缓移、优先落在险地':'；范围、持续提高'}`,muddle:l=>`惑敌 ${(1.4+.4*l).toFixed(1)} → ${(1.8+.4*l).toFixed(1)} 秒；范围扩大`,conceal:l=>`藏匿 ${(1.5+.5*l).toFixed(1)} → ${(2+.5*l).toFixed(1)} 秒`,dew:l=>`地面护行 ${(1.5+.5*l).toFixed(1)} → ${(2+.5*l).toFixed(1)} 秒；净除范围扩大`,angler:l=>`诱引最长 ${(3+.5*l).toFixed(1)} → ${(3.5+.5*l).toFixed(1)} 秒；范围扩大`,peril:l=>l===2?'新增持续收束；范围、初次收束和持续提高':'范围、收束距离和持续时间提高',gold:l=>`普攻锐气 +${3+3*l} → +${6+3*l}；贯穿 +1`,armor:l=>`甲量 ${24+14*l} → ${38+14*l}`,thunder:l=>`雷伤 ${22+14*l}～${44+28*l} → ${36+14*l}～${72+28*l}；雷域扩大`,flame:l=>`每跳伤害 ${5+2*l} → ${7+2*l}；焰幅、范围和持续提高`,zhiming:l=>`每击 ${18+6*l} → ${24+6*l}；断法 ${(.4+.2*l).toFixed(1)} → ${(.6+.2*l).toFixed(1)} 秒`,dali:l=>`每跳伤害 ${9+4*l} → ${13+4*l}；心火范围扩大`,fragrance:l=>`每跳伤害 ${7+3*l} → ${10+3*l}；阴火范围扩大`};
function gradeBadge(s){return s?.grade?`<span class="skill-grade grade-${s.grade.toLowerCase()}" title="本作强度评级 · ${s.gradeNote}">${s.grade}级</span>`:'';}
function benefit(id,lv){return lv?(delta[id]?.(lv)||'提高此法修习等级'):copy[id]?.[0]||'';}
function fit(run,id,gift){const h=run.choiceFit(id,gift);if(!h)return '';return `<span class="fit-note fit-${h.tone}">${id==='spring'?'持屏助击停用且不耗法力；只计果位，强化暂无收益':id==='edict'?'持屏无普攻追加打击；仍可召回甲兵、计入果位':h.text}</span>`;}
function relation(run,id){const r=RECIPES.find(r=>r.ids.includes(id)),lv=run.lv(id);let out='';if(r){const p=run.fruitProgress(r.id),after=run.fruitProgress(r.id,id);out=run.fruits[r.id]?r.name+' · 已成':after.ready?'选后成型 · '+r.name:!lv?r.name+' '+(5-p.missing.length)+'/5 → '+(6-p.missing.length)+'/5'+(!p.mastered?' · 还需同参一法三重':' · 三重已备'):r.name+' · '+(p.missing.length?'同参数量不变':'五法齐备')+(!p.mastered?' · 精修至三重':' · 三重已备');}
const pairs={light:['gate','已有甲兵 · 六合可强化协战'],gate:['light','已有六合 · 可强化召出的甲兵'],angler:['peril','已有险地 · 先诱敌再收束'],peril:['angler','已有幻饵 · 险地优先落在饵处'],rain:['peril','已有险地 · 青雨可磨伤聚群敌人'],gold:['spring','已有泉势 · 共同强化伤害普攻'],spring:['gold','已有锐气 · 共同强化伤害普攻'],edict:['gate','已有甲兵 · 令域召回远兵']};
const p=pairs[id];if(p&&run.lv(p[0])&&!(run.item==='screen'&&['spring','gold'].includes(id)))out+=(out?' · ':'')+p[1];return out;
}
function routes(run){const rows=RECIPES.filter(r=>r.ids.some(id=>run.lv(id))).map(r=>{const p=run.fruitProgress(r.id);return `<div><b>${r.name} ${5-p.missing.length}/5 · ${p.mastered?'一法三重 ✓':'待一法三重'}</b><span>${run.fruits[r.id]?(r.id==='mingyang'?'果位已成 · 六合敕令':'果位已成 · 青雨压阵'):p.missing.length?'缺 '+p.missing.map(name).join('、'):'五法齐备 · 任一同参修至三重成果位'}</span></div>`;});return rows.length?`<section class="route-strip" aria-label="当前同参进度">${rows.join('')}</section>`:'';}
function card(run,id,i,preview,rewards,rewardDesc){const training=trainingInfo(run,id);if(run.choiceKind!=='gift'&&training){const lv=trainingRank(run,id);return `<article class="card decision-card training-card"><small>修行强化 · ${lv} → ${lv+1} 阶 / ${training.max}</small><strong>${training.title}</strong><p class="decision-purpose">${training.purpose}</p><span class="decision-cost">被动 · 不耗法力 · 本局有效</span><p class="decision-gain">${training.stat(lv)} → ${training.stat(lv+1)}</p>${id==='vigor'?'<span class="decision-condition">同时回复 15 气血，上限即止</span>':id==='recovery'?'<span class="decision-condition">不恢复寿元，不救致死</span>':''}<span class="decision-relation">${run.item==='screen'&&id==='reach'?'持屏仅拾取受益':training.fit}</span><details class="decision-details"><summary>数值与机制</summary><p>${training.detail}</p><p>本作局内修行规则，不是原著神通，不计入果位同参。最多 ${training.max} 阶，重开清空。</p></details><button class="choose-card" data-choice="${i}">${i+1} · ${lv?'精修一阶':'修习强化'}</button></article>`;}const gift=run.choiceKind==='gift',s=(gift?GIFTS:SKILLS).find(s=>s.id===id),lv=run.lv(id),passive=['body','gold'].includes(id),info=gift?gifts[id]:copy[id],cost=!gift&&s&&!passive?`自动施放 · ${run.skillCost(id)} 法力 · 与其他神通共用法力`:gift?gifts[id][1]:s?'被动 · 不耗法力':'立即生效';
return `<article class="card decision-card">${s&&!gift?root.XJUIArt?.skill(id,s.dao)||'':''}<small>${gift?'箓气 · 本局择一':s?(s.dao+' · '+(lv?`${lv} → ${lv+1} 重`:'新悟 · 一重')):'基础成长'}</small><strong>${s?.name||rewards[id]}</strong><p class="decision-purpose">${info?.[0]||rewardDesc[id]}</p>${s&&!gift?`<span class="decision-rating">${gradeBadge(s)} · ${s.role} · 评级不代表本局适配</span>`:''}<span class="decision-cost">${cost}</span>${s&&!gift?`<span class="decision-condition">${info[1]}</span>`:''}${fit(run,id,gift)}${lv&&s&&!gift?`<p class="decision-gain">${lv===2?'三重 · ':''}${benefit(id,lv)}</p>`:''}${!gift&&relation(run,id)?`<span class="decision-relation">${relation(run,id)}</span>`:''}<details class="decision-details"><summary>数值与机制</summary><p>${s?.desc||rewardDesc[id]}</p>${s&&!gift?`<p>${preview(id,lv)}</p><p>原作分类：${s.nature||'尚未确认'}；本作评级 ${s.grade}，与修习重数不同。</p>`:''}</details><button class="choose-card" data-choice="${i}">${i+1} · ${gift?'受此箓':lv?'修至'+(lv+1)+'重':s?'修习此法':'选择成长'}</button></article>`;
}
function casting(run){return SKILLS.filter(s=>run.lv(s.id)).map(s=>`<div class="casting-row"><b>${gradeBadge(s)}${s.name} · ${run.lv(s.id)}重</b><span>${root.XJFeedback.state(run,s.id)}</span></div>`).join('')||'<p>尚未修习</p>';}
function loadout(run,learnedId,learnedAt){const all=Object.keys(run.skills),important=[run.primarySkill,run.manualSkill,run.t-learnedAt<5?learnedId:null,'dusk'].filter(id=>id&&run.lv(id));const ids=[...new Set([...important,...all])].slice(0,4);return ids.map(id=>`<button class="chip skill-live ${id===learnedId&&run.t-learnedAt<3?'just-learned':''}" data-open-book="${id}"><b>${gradeBadge(SKILLS.find(s=>s.id===id)).replace(/级<\/span>/,'<\/span>')}${id===run.primarySkill?'主修 · ':id===run.manualSkill?'F · ':''}${name(id)} ${run.lv(id)}重</b><small>${root.XJFeedback.state(run,id)}</small></button>`).join('')+(all.length>4?`<button class="chip" data-open-book="">全部 ${all.length} 法 · Tab</button>`:'');}
function instruction(run){if(run.p.hp/run.maxHP<.3)return '气血告急 · 沿空隙脱围，别停在敌群中';if(run.t<12)return '移动避敌 · 空格瞬移（6秒冷却）· 自动攻击';if(run.finalStarted)return '终阵 · 躲开首领攻势，利用收势反攻';if(run.level===1)return '靠近青色经验珠 · 拾取后参悟';if(run.battlePhase==='喘息拾取')return '喘息 · 普通怪群暂歇，趁机拾取经验';if(run.t>=360&&Math.floor(run.t/65)%2===1&&run.t%65<18)return '收割窗口 · 普通敌群为主，沿击破的缺口回收经验';return {'追击聚群':'引敌聚群 · 边走边收取经验','侧翼夹击':'留意侧翼 · 避开橙色冲锋线','阵线压迫':'绕开橙色法区 · 侧移避紫色飞弹'}[run.battlePhase]||'';}
function growth(run,id,oldFruits){const training=trainingInfo(run,id);if(training)return training.title+' · '+training.stat(trainingRank(run,id))+(id==='vigor'?' · 气血已回复':'');const r=RECIPES.find(r=>run.fruits[r.id]&&!oldFruits[r.id]);if(r)return r.name+'已成 · '+(r.id==='mingyang'?'六合敕令已蓄满 · F 或按钮释放':'青雨压阵 · 雨势大增，离雨仍破护');if(copy[id])return name(id)+' · '+(run.lv(id)===3?'三重 · ':'')+(run.lv(id)>1?benefit(id,run.lv(id)-1):id==='dusk'?'E 仅在血漠内挪移 · 敌人也会返伤':copy[id][0]);if(gifts[id])return (GIFTS.find(g=>g.id===id).name)+' · '+gifts[id][1];return '';
}
function itemState(run){const def=run.itemDef,cost=def.cost??(run.item==='sword'?16:22);if(run.cool.item>0)return '冷却 '+run.cool.item.toFixed(1)+'s';if(run.p.mp<cost)return '缺法力 '+Math.ceil(cost-run.p.mp);if(run.item==='screen')return run.zones.count>=run.zones.max?'法域已满':'可用 · '+cost+' 法力';const range={sword:180,spear:340,thunderseal:430,bow:700}[run.item]||700;return run.nearest(run.p,range)?'可用 · '+cost+' 法力':'等待近处目标';}
function actionClass(run,id){if(run.state!=='running')return '';if(id==='lifeAction'&&run.cool.burst>0)return 'action-active';const ready=id==='dashAction'?!(run.cool.dash>0):id==='fruitAction'?run.hasFruitActive()&&run.fruitActiveEnergy()>=100:id==='itemAction'?itemState(run).startsWith('可用'):id==='manualAction'?run.manualSkill&&!run.skillBlock(run.manualSkill,run.nearest(run.p,500))&&run.p.mp>=run.skillCost(run.manualSkill):id==='blinkAction'?root.XJFeedback.blinkState(run).startsWith('可挪移'):id==='lifeAction'?run.life>0&&!(run.cool.life>0):false;return ready?'action-ready':'';}
function attempt(run,action){if(run.state!=='running')return false;let reason='';if(action==='blink'){reason=root.XJFeedback.blinkState(run);if(!reason.startsWith('可挪移')){run.notice('挪移 · '+reason);return false;}reason='';}if(action==='life'){if(run.life<=0)reason='寿元已尽';else if(run.cool.life>0)reason='冷却 '+run.cool.life.toFixed(1)+'秒';else reason='';}if(action==='item'&&run.cool.item>0)reason='器物冷却 '+run.cool.item.toFixed(1)+'秒';if(reason){run.notice(reason);return false;}return action==='fruit'?run.castFruitActive():action==='blink'?run.blink():action==='life'?run.lifeUse():action==='manual'?run.castManual():run.itemUse();}
function loopPanel(run){const primary=name(run.primarySkill)||'均衡调度',d=run.coreLoop;const recent=d&&run.t-d.lastManaWaitAt<15;return `<div class="loop-context"><b>本局主修 · ${primary}</b><p>${recent?'近期出现蓄法等待：可精修主力、补调元，或保留现有输出再补生存。':'围绕主力补短板：普攻联动、聚怪破护、承伤回收各有用途。'}</p><small>主修优先使用法力 · 展开下方“已学诸法与主修”可更换</small></div>`;}
const api={loopPanel,gradeBadge,trainingInfo,trainingSummary,copy,weapons,gifts,name,benefit,fit,relation,routes,card,casting,loadout,instruction,growth,attempt,itemState,actionClass};root.XJExperience=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
