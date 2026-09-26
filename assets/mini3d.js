
(() => {
  const scenes = {
    overview(){
      const pts=[]; for(let i=0;i<140;i++) pts.push([rnd(-3,3), rnd(-1.5,1.8), rnd(-4,4)]);
      const cams=[[-2.5,0.2,-2.5],[-1.3,0.25,-1],[0,0.3,0.2],[1.2,0.35,1.4],[2.3,0.45,2.8]];
      return {pts,cams,path:cams,mode:'map'};
    },
    entry(){
      const path=[]; for(let i=0;i<18;i++){ const t=i/17; path.push([-2+t*4, 0.2+Math.sin(t*3)*.15, -1.2+t*2]); }
      const imu=[]; for(let i=0;i<65;i++){ const t=i/64; imu.push([-2+t*4, 0.4+Math.sin(t*8)*.2, -1.2+t*2]); }
      return {path,imu,pts:[],cams:[path[0],path[8],path[17]],mode:'entry'};
    },
    tracking(){
      const pts=[]; for(let i=0;i<220;i++) pts.push([rnd(-4,4), rnd(-2,2), rnd(-6,6)]);
      const path=[]; for(let i=0;i<40;i++){ const t=i/39; path.push([-2.8+t*5.6, 0.15, Math.sin(t*6)*1.2]); }
      return {pts,path,cams:[path[6],path[20],path[32]],mode:'tracking'};
    },
    init(){
      const pts=[]; for(let i=0;i<80;i++) pts.push([rnd(-2,2), rnd(-1.3,1.2), rnd(-1.4,1.8)]);
      return {pts,cams:[[-1.8,0.2,0],[1.8,0.2,0.2]],mode:'triangulation'};
    },
    imu(){
      const path=[]; const imu=[]; for(let i=0;i<60;i++){ const t=i/59; const x=-2.5+t*5; const y=Math.sin(t*5)*.3; const z=Math.cos(t*5)*.8; path.push([x,y,z]); imu.push([x, y+.55*Math.abs(Math.sin(t*16)), z]); }
      return {path,imu,cams:[path[5],path[20],path[35],path[59]],mode:'imu'};
    },
    localmap(){
      const pts=[]; for(let i=0;i<120;i++) pts.push([rnd(-3,3), rnd(-1.6,1.6), rnd(-3,3)]);
      const neigh=[]; for(let i=0;i<10;i++) neigh.push([Math.cos(i/10*Math.PI*2)*2.4, 0.2, Math.sin(i/10*Math.PI*2)*2.4]);
      return {pts,cams:neigh,path:neigh,mode:'localmap'};
    },
    loop(){
      const pts=[]; for(let i=0;i<160;i++) pts.push([rnd(-4,4), rnd(-1.8,1.8), rnd(-4,4)]);
      const path=[]; for(let i=0;i<50;i++){ const a=i/50*Math.PI*2; path.push([Math.cos(a)*2.8, 0.2, Math.sin(a)*2.8]); }
      return {pts,path,cams:[path[0],path[15],path[30],path[48]],mode:'loop'};
    },
    optimizer(){
      const nodes=[]; for(let i=0;i<12;i++) nodes.push([Math.cos(i/12*Math.PI*2)*2.3, Math.sin(i/12*Math.PI*2)*1.4, rnd(-.6,.6)]);
      const pts=[]; for(let i=0;i<40;i++) pts.push([rnd(-2.8,2.8), rnd(-1.6,1.6), rnd(-1.4,1.4)]);
      return {nodes,pts,mode:'graph'};
    },
    structures(){
      const nodes=[[0,1.4,0],[-2.1,0.6,0],[2.1,0.6,0],[-2.6,-0.9,0],[-1.0,-0.9,0],[1.0,-0.9,0],[2.6,-0.9,0]];
      return {nodes,mode:'structures'};
    },
    system(){
      const nodes=[[-2.7,0,0],[-1.2,0.8,0],[-1.2,-0.8,0],[0.6,1.2,0],[0.6,0,0],[0.6,-1.2,0],[2.5,0,0]];
      return {nodes,mode:'threads'};
    }
  };
  function rnd(a,b){ return a + Math.random()*(b-a); }
  function draw(el, sceneName){
    const canvas = document.createElement('canvas');
    el.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let scene = (scenes[sceneName] || scenes.overview)();
    let t = 0;
    function resize(){
      const r = el.getBoundingClientRect();
      canvas.width = Math.max(320, r.width*devicePixelRatio);
      canvas.height = Math.max(240, r.height*devicePixelRatio);
      ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
    }
    resize(); addEventListener('resize', resize);

    function proj(p, ang){
      const x=p[0], y=p[1], z=p[2];
      const ca=Math.cos(ang), sa=Math.sin(ang);
      const rx = ca*x - sa*z;
      const rz = sa*x + ca*z + 8;
      const s = 210/Math.max(1,rz);
      return [canvas.width/devicePixelRatio/2 + rx*s, canvas.height/devicePixelRatio/2 - y*s, s];
    }
    function line(a,b,ang,color,w=1){
      const p=proj(a,ang), q=proj(b,ang);
      ctx.strokeStyle=color; ctx.lineWidth=w; ctx.beginPath(); ctx.moveTo(p[0],p[1]); ctx.lineTo(q[0],q[1]); ctx.stroke();
    }
    function pt(a, ang, color, r=3){
      const p=proj(a,ang); ctx.fillStyle=color; ctx.beginPath(); ctx.arc(p[0],p[1],Math.max(1.4,r*p[2]/45),0,Math.PI*2); ctx.fill();
    }
    function frustum(c, ang, scale=.35, color='rgba(103,213,255,.8)'){
      const [x,y,z]=c; const k=scale;
      const corners=[[x-k,y-k,z+1.2],[x+k,y-k,z+1.2],[x+k,y+k,z+1.2],[x-k,y+k,z+1.2]];
      corners.forEach(q=>line(c,q,ang,color,1.2));
      for(let i=0;i<4;i++) line(corners[i], corners[(i+1)%4], ang, color,1.2);
      pt(c,ang,color,4);
    }
    function label(text, x, y){
      ctx.fillStyle='rgba(232,238,252,.95)'; ctx.font='12px Inter, sans-serif'; ctx.fillText(text, x, y);
    }
    function render(){
      t += 0.007;
      const W=canvas.width/devicePixelRatio, H=canvas.height/devicePixelRatio;
      const grad=ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#081021'); grad.addColorStop(1,'#060a15'); ctx.fillStyle=grad; ctx.fillRect(0,0,W,H);
      const ang=t;
      ctx.strokeStyle='rgba(255,255,255,.05)'; ctx.lineWidth=1;
      for(let i=-4;i<=4;i++) line([-4, -1.4, i],[4,-1.4,i],ang,'rgba(255,255,255,.05)');
      for(let i=-4;i<=4;i++) line([i, -1.4, -4],[i,-1.4,4],ang,'rgba(255,255,255,.05)');
      if(scene.pts) scene.pts.forEach(p=>pt(p,ang,'rgba(140,255,183,.9)',2.6));
      if(scene.imu) scene.imu.forEach(p=>pt(p,ang,'rgba(255,209,102,.85)',2.2));
      if(scene.path){ for(let i=1;i<scene.path.length;i++) line(scene.path[i-1],scene.path[i],ang,'rgba(244,154,194,.65)',1.8); }
      if(scene.cams) scene.cams.forEach(c=>frustum(c,ang,.35,'rgba(103,213,255,.95)'));
      if(scene.nodes && scene.mode==='graph'){
        scene.nodes.forEach(n=>pt(n,ang,'rgba(103,213,255,.95)',5));
        for(let i=1;i<scene.nodes.length;i++) line(scene.nodes[i-1],scene.nodes[i],ang,'rgba(103,213,255,.55)',1.3);
        line(scene.nodes[scene.nodes.length-1], scene.nodes[0], ang,'rgba(103,213,255,.55)',1.3);
      }
      if(scene.mode==='threads'){
        const labels=['System','Tracker','Atlas','LocalMapping','LoopClosing','Viewer','Output'];
        scene.nodes.forEach((n,idx)=>pt(n,ang,'rgba(103,213,255,.95)',7));
        const links=[[0,1],[0,2],[1,3],[1,4],[1,5],[3,6],[4,6]]; links.forEach(([a,b])=>line(scene.nodes[a],scene.nodes[b],ang,'rgba(140,255,183,.65)',2));
        scene.nodes.forEach((n,idx)=>{ const p=proj(n,ang); label(labels[idx],p[0]+8,p[1]-8); });
      }
      if(scene.mode==='structures'){
        const labels=['Atlas','Map','KeyFrameDatabase','Frame','KeyFrame','MapPoint','Vocabulary'];
        const links=[[0,1],[0,2],[1,4],[1,5],[3,4],[4,5],[2,4],[2,6]];
        scene.nodes.forEach((n,idx)=>pt(n,ang,'rgba(140,255,183,.95)',7));
        links.forEach(([a,b])=>line(scene.nodes[a],scene.nodes[b],ang,'rgba(103,213,255,.55)',2));
        scene.nodes.forEach((n,idx)=>{ const p=proj(n,ang); label(labels[idx],p[0]+8,p[1]-8); });
      }
      if(scene.mode==='entry') label('图像帧之间的 IMU 样本', 16, 24);
      else if(scene.mode==='triangulation') label('两视图三角化：从 2D 匹配恢复 3D', 16, 24);
      else if(scene.mode==='imu') label('IMU 轨迹 + 视觉关键帧', 16, 24);
      else if(scene.mode==='localmap') label('局部地图窗口', 16, 24);
      else if(scene.mode==='loop') label('闭环回到旧区域', 16, 24);
      else if(scene.mode==='graph') label('优化图：位姿节点 + 约束边', 16, 24);
      else if(scene.mode==='map') label('相机轨迹与稀疏地图点', 16, 24);
      else if(scene.mode==='tracking') label('Tracking：当前位姿在点云中前进', 16, 24);
      else if(scene.mode==='threads') label('线程关系示意', 16, 24);
      else if(scene.mode==='structures') label('核心对象关系', 16, 24);
      requestAnimationFrame(render);
    }
    render();
  }
  document.querySelectorAll('.mini3d').forEach(el => draw(el, el.dataset.scene || 'overview'));
})();
