(() => {
 const root=document.querySelector('[data-backend]');
 if(!root)return;
 const nodes=[...root.querySelectorAll('[data-node]')];
 const desc=root.querySelector('[data-backend-desc]');
 const routes={
  kf:{active:['tracking','queue','process','cullmp','triangulate','neighbors'],text:'新关键帧进入 LocalMapping：ProcessNewKeyFrame → MapPointCulling → CreateNewMapPoints → SearchInNeighbors。'},
  lba:{active:['process','lba','kfcull','loopqueue'],text:'队列空闲且未请求停止时进入优化：只有 mbInertial && map->isImuInitialized() 时调用 LocalInertialBA，否则 LocalBundleAdjustment；随后 KeyFrameCulling，并把当前 KF 交给 LoopClosing。'},
  loop:{active:['loopqueue','bow','sim3','coincidence'],text:'LoopClosing 对新 KF 做 place recognition：DBoW2 候选 → Sim3 几何验证 → 连续 coincidence 计数。源码连续确认 >=3 才置 mbLoopDetected/mbMergeDetected。'},
  correct:{active:['coincidence','stoplm','correctkf','correctmp','fusion'],text:'闭环确认后 CorrectLoop：暂停 LocalMapping，必要时停止 GBA，传播 corrected Sim3 到共视 KF，修正 MapPoint，并融合重复点。'},
  merge:{active:['coincidence','mergecheck','stoplm','atlas','fusion'],text:'地图合并分支：当前 Map 在惯性模式但尚未 IMU 初始化时会放弃 merge；当 current/merge 两张 Map 都是 inertial 时，还检查 scale 是否在 0.90~1.10。通过后停止 LocalMapping，切换/融合地图与局部窗口。'}
 };
 root.querySelectorAll('[data-route]').forEach(b=>b.addEventListener('click',()=>{
   const r=routes[b.dataset.route]; nodes.forEach(n=>n.classList.toggle('active',r.active.includes(n.dataset.node))); desc.textContent=r.text;
 }));
 root.querySelector('[data-route=kf]').click();
})();