/* Foundation incubation -> manifested powers. Numeric ranks/thresholds are game rules. */
(function(root){'use strict';
const X=typeof module!=='undefined'?require('./medicine.js'):root.XJ;
const {Run,SKILLS,TRAINING}=X;
const routes=[{id:'mingyang',name:'明阳',ids:['gate','body','edict','dusk','light']},{id:'lushui',name:'渌水',ids:['spring','muddle','conceal','rain','dew']}];
X.Cultivation=Object.freeze({version:'0.28.0',routes:routes.map(r=>Object.freeze({...r,ids:Object.freeze(r.ids)})),requirements:Object.freeze([7,11,15,20,24])});
Run.prototype.pathSkills=function(){const ids=routes.filter(r=>!this.dao||r.id===this.dao).flatMap(r=>r.ids);return ids.map(id=>SKILLS.find(s=>s.id===id));};
Run.prototype.masteredCount=function(){return this.pathSkills().filter(s=>this.lv(s.id)===3).length;};
Run.prototype.breakthroughNeed=function(){return X.Cultivation.requirements[Math.min(4,this.masteredCount())];};
Run.prototype.skillStage=function(id){const n=this.lv(id);return n===3?'神通':n===2?'仙基二重':n===1?'仙基一重':'未修';};
Run.prototype.foundationDescription=function(id){if(id==='gate')return '仙基落门镇压：14法力、9秒冷却，在近敌处短暂镇住小片敌群，一/二重范围75/95、持续0.6/0.8秒；不召兵。三重成就神通后改为召出六名甲兵。';return '蕴养仙基，尚不施展对应神通；前两重依靠器物作战。三重成就神通，才启用'+(SKILLS.find(s=>s.id===id)?.name||'此法')+'的战斗效果。';};
Run.prototype.canCultivate=function(id){return this.pathSkills().some(s=>s.id===id)&&this.lv(id)<3&&(this.lv(id)<2||this.level>=this.breakthroughNeed());};
Run.prototype.valid=function(){const a=this.pathSkills().filter(s=>this.canCultivate(s.id)).map(s=>s.id);if(this.level>=2||!a.length){for(const d of TRAINING)if(this.trainingLv(d.id)<d.max&&!(this.item==='screen'&&['haste','weapon'].includes(d.id)))a.push(d.id);}for(const id of ['heal','mana','ward'])if(a.length<3)a.push(id);return a;};
// Early stages have no falsely attributed full supernatural effects.
const block=Run.prototype.skillBlock;
Run.prototype.skillBlock=function(id,nearest){if(id!=='gate'&&this.lv(id)>0&&this.lv(id)<3)return '仙基蕴养中 · 三重成就神通';return block.call(this,id,nearest);};
const cost=Run.prototype.skillCost;
Run.prototype.skillCost=function(id){return id==='gate'&&this.lv(id)<3?14:cost.call(this,id);};
const primary=Run.prototype.canPrimary;
Run.prototype.canPrimary=function(id){return this.lv(id)===3&&primary.call(this,id);};
const manual=Run.prototype.setManual;
Run.prototype.setManual=function(id){if(id!==null&&this.lv(id)!==3)return false;return manual.call(this,id);};
Run.prototype.opening=function(){if(this.item==='screen'){this.state='ended';this.notice('此版筑基起步需要伤害普攻，重明洞玄屏暂未开放');return false;}this.state='choice';this.choiceKind='opening';this.choiceDao=null;this.choices=this.pathSkills().map(s=>s.id);return true;};
const offer=Run.prototype.offer;
Run.prototype.offer=function(dao=null,previous=[]){const choices=offer.call(this,null,previous);if(!this.masteredCount()&&this.foundationStarter&&this.canCultivate(this.foundationStarter)&&!choices.includes(this.foundationStarter)){const i=choices.findIndex(id=>SKILLS.some(s=>s.id===id));choices[i<0?0:i]=this.foundationStarter;}return choices;};
const open=Run.prototype.openChoice;
Run.prototype.openChoice=function(kind='upgrade',dao=null){open.call(this,kind,null);if(kind==='gift')this.choices=this.choices.filter(id=>id!=='firegift');};
Run.prototype.updateRealm=function(){const n=this.masteredCount(),name=n>=5?'五法圆满':n>=4?'大真人':n>=3?'紫府中期':n>=1?'紫府':'筑基';if(name===this.realm)return;this.realm=name;this.realmHistory??=[];this.realmHistory.push({realm:name,at:this.t,count:n});this.effect('realmRise',this.p.x,this.p.y,65,1.6,{title:name,dao:this.dao,count:n});this.notice(name+' · '+n+' 道神通成就');};
const choose=Run.prototype.choose;
Run.prototype.choose=function(i){const id=this.choices[i],kind=this.choiceKind,isSkill=SKILLS.some(s=>s.id===id);if(kind==='opening'&&(!isSkill||!this.canCultivate(id)))return false;
 const oldDao=this.dao;if(isSkill&&!this.dao)this.dao=routes.find(r=>r.ids.includes(id))?.id||null;
 const ok=choose.call(this,i);if(!ok){this.dao=oldDao;return false;}
 if(kind==='opening')this.foundationStarter=id;this.updateRealm();return true;
};
const end=Run.prototype.end;
Run.prototype.end=function(reason){if(this.state==='ended')return;end.call(this,reason);Object.assign(this.result,{dao:this.dao,realm:this.realm,masteredCount:this.masteredCount(),realmHistory:(this.realmHistory||[]).map(x=>({...x})),version:'0.28.0'});};
if(typeof module!=='undefined')module.exports=X;
})(typeof globalThis!=='undefined'?globalThis:this);
