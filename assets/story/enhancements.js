/* Final visual QA: clipping, truthful objective labels and an explicit whole-system map. */
(() => {
'use strict';
const S=ORB_STORY;
S.renderers.whole=(v,p,l)=>{
 const groups=[[],[],[]],g='#226249',muted='#96ad9c';
 const node=(phase,x,y,w,title,sub,url)=>groups[phase].push(`<a href="${url}">${S.box(x,y,w,66,title,sub,phase===p)}</a>`);
 node(0,26,22,238,'单目相机','图像 + 时间戳','entry.html');
 node(0,300,22,238,'IMU','比力 + 角速度 + 时间','imu.html');
 node(0,574,22,238,'标定 / 配置','K、畸变、Tbc、噪声','foundations.html');
 node(0,190,137,460,'System::TrackMonocular','IMU入队，再交图像给Tracking','system.html');
 node(0,190,241,460,'形成当前Frame与帧间信息','ORB特征；适用的IMU预积分','src_orb.html');
 node(1,28,443,332,'两视图视觉初始化','2D–2D → 相对运动 → 初始点','init.html');
 node(1,482,443,332,'利用地图进行跟踪 / 恢复','预测 → 关联 → 优化 → 状态判断','tracking.html');
 node(1,190,550,460,'本帧结果与关键帧判定 / 创建','满足各自前提；不是每帧创建关键帧','tracking.html');
 node(1,30,658,307,'调用者取得当前Tcw和状态','该结果不等待全局地图维护完成','system.html');
 node(2,473,658,341,'选中的KeyFrame → LM队列','异步交给LocalMapping','local_mapping.html');
 node(2,473,770,341,'LocalMapping后台','建点 / 融合 / 裁剪 / 局部BA','local_mapping.html');
 node(2,30,770,307,'共享Map / Atlas','点、关键帧与观测关系','data_structures.html');
 node(2,473,882,341,'处理后KeyFrame → LC队列','检索、几何支持；按条件回环/合图','loop_closing.html');
 node(2,30,989,307,'Viewer与文件接口','地图可视化 / 轨迹或Atlas保存','data_structures.html');
 let b='';const edge=(a,c,phase,dash='')=>b+=S.arrow(a,c,p===phase?g:muted,dash);
 [[145,88],[419,88],[693,88]].forEach(a=>{b+=S.line(a,[a[0],111],muted,1.5)+S.line([a[0],111],[419,111],muted,1.5);});
 edge([419,111],[419,137],0);edge([419,203],[419,241],0);edge([419,307],[419,340],1);
 b+=`<path d="M419 340L527 379L419 418L311 379Z" fill="#eef4e9" stroke="#8ba895"/>`+S.t(419,384,'已有视觉地图？',15,g,'middle');
 b+=S.line([311,379],[194,379],muted,1.5);edge([194,379],[194,443],1);
 b+=S.line([527,379],[648,379],muted,1.5);edge([648,379],[648,443],1);
 b+=S.t(249,367,'否',14)+S.t(571,367,'是',14);
 b+=S.line([194,509],[194,532],muted)+S.line([194,532],[419,532],muted)+S.line([648,509],[648,532],muted)+S.line([648,532],[419,532],muted);edge([419,532],[419,550],1);
 b+=S.line([419,616],[419,635],muted)+S.line([184,635],[644,635],muted);edge([184,635],[184,658],1);edge([644,635],[644,658],2,'5 4');
 edge([644,724],[644,770],2,'5 4');edge([644,836],[644,882],2,'5 4');
 edge([473,804],[337,804],2,'5 4');b+=S.t(404,790,'更新',12,g,'middle');
 b+=S.line([644,948],[644,964],muted,2,'5 4')+S.line([644,964],[366,964],muted,2,'5 4')+S.line([366,964],[366,827],muted,2,'5 4');edge([366,827],[337,827],2,'5 4');
 edge([184,836],[184,989],2,'5 4');
 b+=S.line([30,804],[12,804],muted,2,'5 4')+S.line([12,804],[12,428],muted,2,'5 4')+S.line([12,428],[648,428],muted,2,'5 4');edge([648,428],[648,443],2,'5 4');
 b+=S.t(43,752,'地图持续被维护；并非结果文件',12)+S.t(485,861,'IMU初始化也在LM中按条件进行',12)+S.t(356,1010,'实线：本地依赖；虚线：交接 / 共享状态',12)+S.t(356,1040,'节点可点击；图不是完整错误分支或实测耗时。',11);
 b+=groups.flat().join('');return {html:S.svg(b,840,1088,'采集、标定、初始化分支、跟踪、异步建图、地图反馈与输出'),text:l.steps[p][1],metrics:{phase:p}};
};
for(const kind of ['room','projection','pnp']){
 const original=S.renderers[kind];
 S.renderers[kind]=(v,p,l)=>{
  const r=original(v,p,l),host=document.createElement('div');host.innerHTML=r.html;
  const image=host.querySelectorAll('.st-panel > svg')[1];
  if(image){const clip=document.createElementNS('http://www.w3.org/2000/svg','svg');
   for(const [k,val] of Object.entries({x:20,y:30,width:320,height:240,viewBox:'20 30 320 240',overflow:'hidden'}))clip.setAttribute(k,String(val));
   for(const child of [...image.children]){if(child.tagName==='title')continue;if(child.tagName==='rect'&&child.getAttribute('x')==='20'&&child.getAttribute('width')==='320')continue;const y=Number(child.getAttribute('y'));if(child.tagName==='text'&&(y<30||y>270))continue;clip.appendChild(child);}
   image.appendChild(clip);r.html=host.innerHTML;
  }
  if(kind==='pnp'&&v.robust==='yes'){const rr=S.poseResidual(v.x??0,v.yaw??0,v.outlier==='yes');const robust=rr.reduce((sum,x)=>sum+(Math.abs(x)<=4?x*x:8*Math.abs(x)-16),0);r.text+=' 本教学分量Huber目标='+S.f(robust,2)+'（δ=4px；不同于原始平方和）。';r.metrics.robustCost=robust;}
  return r;
 };
}
const renderSolve=S.renderers.solve;
S.renderers.solve=(v,p,l)=>{const r=renderSolve(v,p,l),host=document.createElement('div');host.innerHTML=r.html;const svg=host.querySelector('svg');svg.insertAdjacentHTML('beforeend',S.t(20,21,'残差平方 r²（px²）',11)+S.t(250,294,'相机位置 Cx',11)+S.t(169,274,'0.5',11));r.html=host.innerHTML;return r;};
const mount=S.mount;
S.mount=()=>{if(S.chapters.start){const l=S.chapters.start.lessons[2];l.kind='whole';l.scene='从采集到输出：明确初始化分支、后台队列和地图反馈';}mount();const toc=document.querySelector('.toc');if('IntersectionObserver' in window&&toc){const observer=new IntersectionObserver(entries=>{for(const e of entries){if(!e.isIntersecting)continue;toc.querySelectorAll('a').forEach(a=>a.classList.toggle('current',a.hash==='#'+e.target.id));}},{rootMargin:'-100px 0px -55% 0px'});document.querySelectorAll('.st-lesson').forEach(el=>observer.observe(el));}};
})();
