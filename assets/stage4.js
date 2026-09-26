(() => {
 const r=document.querySelector('[data-imu-demo]'); if(!r)return;
 const q=n=>r.querySelector('[name='+n+']');
 const out=n=>r.querySelector('[data-out='+n+']');
 function calc(){
   const dt=+q('dt').value, a0=+q('a0').value, a1=+q('a1').value, w0=+q('w0').value, w1=+q('w1').value;
   const a=.5*(a0+a1), w=.5*(w0+w1);
   const dv=a*dt, dp=.5*a*dt*dt, dtheta=w*dt;
   out('a').textContent=a.toFixed(4); out('w').textContent=w.toFixed(4);
   out('dv').textContent=dv.toFixed(4); out('dp').textContent=dp.toFixed(4); out('dr').textContent=dtheta.toFixed(4);
   const kf=+q('kf').value, span=+q('span').value, scale=+q('scale').value;
   let gate='等待';
   if(kf<10) gate='等待：KeyFrame < 10';
   else if(span<2) gate='等待：时间跨度 < 2.0s';
   else if(scale<0.1) gate='初始化优化得到 scale < 0.1 → 源码直接退出';
   else gate='满足 Mono InitializeIMU 基本门槛';
   out('gate').textContent=gate;
 }
 r.querySelectorAll('input').forEach(x=>x.addEventListener('input',calc)); calc();
})();