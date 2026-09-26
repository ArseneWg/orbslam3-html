(() => {
 const sim=document.querySelector('[data-kf-sim]');
 if(sim){
  const calc=()=>{
   const imuInit=sim.querySelector('[name=imuInit]').checked;
   const dt=parseFloat(sim.querySelector('[name=dt]').value||0);
   const inliers=parseInt(sim.querySelector('[name=inliers]').value||0,10);
   const ref=parseInt(sim.querySelector('[name=ref]').value||1,10);
   const idle=sim.querySelector('[name=idle]').checked;
   let text='';
   if(!imuInit){ text = dt>=0.25 ? '源码分支：IMU 尚未初始化且 Δt ≥ 0.25s → 直接允许插入关键帧' : '源码分支：IMU 尚未初始化且 Δt < 0.25s → 不插入'; }
   else {
     const th=inliers>350?0.75:0.90;
     const c2=(inliers<ref*th)&&inliers>15;
     const c3=dt>=0.5;
     const c4=((inliers<75&&inliers>15));
     text='简化演示：thRefRatio='+th.toFixed(2)+', c2='+c2+', c3='+c3+', c4='+c4+', LocalMappingIdle='+idle+'. 注意：完整源码还含 c1a/c1b/重定位等条件。';
   }
   sim.querySelector('.sim-result').textContent=text;
  };
  sim.querySelectorAll('input').forEach(x=>x.addEventListener('input',calc)); calc();
 }
})();