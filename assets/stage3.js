
(() => {
 const root=document.querySelector('[data-stage3]');
 if(!root) return;
 const q=n=>root.querySelector('[name='+n+']');
 const steps=[...root.querySelectorAll('.exec-step')];
 const summary=root.querySelector('.route-summary');
 const stateEls={
   state:root.querySelector('[data-state=state]'),
   imu:root.querySelector('[data-state=imu]'),
   route:root.querySelector('[data-state=route]'),
   kf:root.querySelector('[data-state=kf]')
 };
 let cursor=0, route=[];
 function cfg(){
   return {
     state:q('state').value,
     imu:q('imu').checked,
     velocity:q('velocity').checked,
     mapUpdated:q('mapUpdated').checked,
     inliers:+q('inliers').value,
     ref:+q('ref').value,
     dt:+q('dt').value
   };
 }
 function build(){
   const c=cfg();
   route=['system','grab'];
   let poseRoute='init';
   let needKF=false;
   if(c.state==='NOT_INITIALIZED'){
     route.push('preimu','mono_init');
     poseRoute='MonocularInitialization';
   }else{
     route.push('preimu','track');
     if((!c.velocity && !c.imu) ){ route.push('ref'); poseRoute='TrackReferenceKeyFrame'; }
     else { route.push('motion'); poseRoute=c.imu?'PredictStateIMU via TrackWithMotionModel':'TrackWithMotionModel'; }
     route.push('local');
     if(!c.imu){
       needKF=c.dt>=0.25;
     }else{
       const th=c.inliers>350?0.75:0.90;
       const c2=(c.inliers<c.ref*th)&&c.inliers>15;
       const c3=c.dt>=0.5;
       const c4=(c.inliers<75&&c.inliers>15);
       needKF=c2||c3||c4;
     }
     route.push('needkf');
     if(needKF) route.push('createkf');
   }
   steps.forEach(s=>s.classList.remove('active','done','skipped'));
   steps.forEach(s=>{ if(!route.includes(s.dataset.step)) s.classList.add('skipped'); });
   cursor=0;
   stateEls.state.textContent=c.state;
   stateEls.imu.textContent=c.imu?'initialized':'not initialized';
   stateEls.route.textContent=poseRoute;
   stateEls.kf.textContent=needKF?'YES':'NO';
   summary.textContent='执行路线：\n'+route.map((x,i)=>(i+1)+'. '+x).join('\n');
   paint();
 }
 function paint(){
   route.forEach((id,i)=>{
     const el=steps.find(s=>s.dataset.step===id);
     if(!el) return;
     el.classList.remove('active','done');
     if(i<cursor) el.classList.add('done');
     else if(i===cursor) el.classList.add('active');
   });
 }
 root.querySelector('[data-next]').addEventListener('click',()=>{ if(cursor<route.length-1){cursor++;paint();} });
 root.querySelector('[data-prev]').addEventListener('click',()=>{ if(cursor>0){cursor--;paint();} });
 root.querySelector('[data-reset]').addEventListener('click',build);
 root.querySelectorAll('input,select').forEach(x=>x.addEventListener('change',build));
 root.querySelectorAll('input[type=number]').forEach(x=>x.addEventListener('input',build));
 build();
})();
