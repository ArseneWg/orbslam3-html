/* 07 · Specific force, state propagation and reusable preintegration. */
(() => {
const V=window.ORB_VISUALS,{p,t,box,dot,edge,svg,figure,formula,steps,note,lab}=V;
let rest='<path d="M55 250H365" stroke="#899f8c" stroke-width="5"/><rect x="130" y="180" width="115" height="67" rx="8" fill="#edf3e8" stroke="#62846a"/>';
rest+=t(187,218,'静止 IMU',17,'middle')+edge([[164,178],[164,69]],'比力 aₘ≈+g',47,46)+edge([[300,128],[300,236]],'g_w 向下',305,165);
rest+=t(75,290,'世界 z 向上；坐标轴暂时重合',15)+box(415,65,290,76,'陀螺读数：约 0','没有角速度，不表示没有重力')+box(415,185,290,76,'加速度计：约 +9.81','支撑状态下比力不为零');
rest+=t(360,343,'a_world = (+9.81) + (−9.81) = 0 m/s²',20,'middle');
V.add('imu','测量模型','图解 07.1 · 加速度计静止时为什么不是零',
figure('静止在桌面上的 IMU：读数与运动加速度不同',svg(730,378,rest,'桌上静止IMU，机体z向上，比力正9.81与世界重力负9.81抵消'),'忽略偏置噪声，世界z向上、机体与世界暂时对齐；9.81是用于算例的重力量级，不是要求每台设备每个通道都精确等于该值。','物体受支撑保持静止，世界运动加速度为0，但加速度计测的是比力。此朝向的z读数约+g。把机体系比力旋到世界后，再加世界重力−g，才得到运动加速度0。')+
formula('ωₘ = ω + b_g + n_g<br>aₘ = Rbw · (a_w − g_w) + b_a + n_a<br>a_w ≈ Rwb · (aₘ − b_a) + g_w',[
['ωₘ / ω','测得的 / 理想机体系角速度，rad/s。'],['aₘ / a_w','加速度计比力 / 世界系运动加速度，m/s²。'],['Rwb / Rbw','机体→世界的旋转及其逆；旋转没有平移项。'],['g_w','世界重力向量。重力对齐后源码用(0,0,−g)。'],['b_g / b_a','陀螺偏置rad/s / 加速度计偏置m/s²，是待估误差，不是重力。'],['n_g / n_a','测量噪声。近似传播时忽略其瞬时未知值，但要考虑不确定性。']
],'先去偏置，再换坐标，再加世界重力；顺序与坐标不能混淆。','机体状态和测量时刻一致，外参及重力方向定义正确。任意姿态下不能只在原始z通道机械减9.81。')+
lab('imu','单轴实验：忘记补偿重力会发生什么',[
['measure','加速度计比力（m/s²）',8.81,10.81,.1,9.81],['bias','所用偏置估计（m/s²）',-.2,.2,.01,0],['gravity','世界重力该轴分量：−9.81 或 0',-9.81,0,9.81,-9.81],['t','传播时间（s）',0,5,.1,1]
],'保持坐标对齐、零初速度、恒定输入，a=measure−bias+gravity。将重力项误设为0，会把静止读数积分成虚假运动；真实三维代码还处理旋转和视觉约束。'),
[['src/Tracking.cc',1736,1784],['src/ImuTypes.cc',189,199]]);
let ints=t(25,35,'同一批测量，两个不同起点',19);
for(const [x,label] of [[60,'KeyFrame k'],[245,'Frame i−2'],[430,'Frame i−1'],[640,'Frame i']])ints+=dot(x,104,'')+t(x,76,label,14,x===60?'start':'middle');
ints+='<line x1="60" y1="104" x2="640" y2="104" stroke="#8eaa95"/>';
ints+=edge([[430,135],[430,171],[640,171],[640,135]],'Frame 区间：只覆盖最近一帧',310,208);
ints+=edge([[60,238],[60,275],[640,275],[640,238]],'KeyFrame 区间：跨多帧持续累计',186,314);
V.add('imu','为什么有“从上一帧”','图解 07.2 · Δp 不是世界位置，先看起点',
figure('帧间预积分与关键帧间预积分不能互换',svg(720,349,ints,'上一关键帧到当前帧的长区间和上一帧到当前帧的短区间'),'区间长度仅表示覆盖范围，不代表各时间间隔相等。创建关键帧后的新累计对象与已经保存的历史约束要区分。','短区间从上一Frame到当前Frame。长区间从最近KeyFrame到当前Frame，跨过若干普通Frame。二者接收同一新测量片段，但过去累计不同，所以不能因类型相同就互换Δ量。')+
formula('Rj = Ri · ΔRij(b)<br>vj = vi + gΔt + Ri·Δvij(b)<br>pj = pi + viΔt + ½gΔt² + Ri·Δpij(b)',[
['i / j','积分起点 / 当前终点，不一定是相邻关键帧。'],['Ri、pi、vi','起点机体到世界的旋转、世界位置m、世界速度m/s。'],['ΔRij / Δvij / Δpij','测量汇总的相对增量；速度/位置增量在起点参考下表达，单位m/s、m。'],['Ri·Δv / Ri·Δp','把增量旋到世界参考，而不是给世界位置直接加机体系数字。'],['b / Δt / g','用于偏置修正的偏置、真实区间时长s、世界重力m/s²。']
],'已缓存的增量不绑定一个绝对世界原点。后端修正起点状态后，仍能把同一测量区间接到新的起点上。','省略旋转归一化等实现细节；这对应 PredictStateIMU 的传播关系，不是完整优化目标。Δp中不重复加入起点世界速度与重力。'),
[['src/Tracking.cc',1690,1784],['src/Tracking.cc',3216,3249]]);
V.add('imu','偏置 Jacobian','推导 07.3 · 为什么 Jacobian 能修正旧积分',
formula('Δv(b₀+δb) ≈ Δv(b₀) + Jᵥ · δb<br>单轴恒定例：Δv=(aₘ−b)T，Jᵥ=−T',[
['b₀ / δb','积分时的基准偏置 / 此后优化带来的小修正。'],['Jᵥ','速度增量对偏置的局部导数；本单轴例单位s，三维为矩阵。'],['T','该段积分总时长，s，不是当前采样的序号。'],['≈','一阶局部近似。三维含旋转耦合，不保证任意大偏置变化都精确。']
],'导数提前记录“输入偏置变一点，输出增量怎么变”，避免所有小改动都重新遍历测量。','本算例是零旋转、单轴、固定T；真实程序还维护旋转/位置对gyro和acc偏置的多块Jacobian，并有Reintegrate。')+
steps([['先用旧偏置积分','aₘ=1.00m/s²，b₀=0，T=0.2s，Δv旧=0.200m/s。'],['偏置修正0.01','δb=+0.01m/s²，Jᵥδb=−0.2×0.01=−0.002m/s。'],['新增量变小','Δv新≈0.198m/s；直接计算(1.00−0.01)×0.2也得到0.198。这个线性玩具例恰好精确，不代表完整旋转耦合模型也全局精确。']])+
note('源码的更新顺序有物理意义','IntegrateNewMeasurement 先用旧dV、旧dR更新dP，再更新dV，最后更新dR。这样位置使用区间起点的速度，不会把刚增加的速度再多算一次。协方差和Jacobian也按对应旧状态传播。'),
[['src/ImuTypes.cc',168,244],['src/ImuTypes.cc',275,310]]);
// Signed single-axis plots: keep negative acceleration visible instead of clipping below the SVG.
const mount=V.mount;
V.mount=()=>{mount();document.querySelectorAll('[data-visual-lab="imu"]').forEach(root=>{const draw=()=>{const x={};root.querySelectorAll('input').forEach(i=>x[i.name]=Number(i.value));const r=V.evaluate('imu',x),m=Math.max(1,Math.abs(r.p));const pts=Array.from({length:31},(_,i)=>[60+i*17,115-r.p*(i/30)**2/m*75]);const body=edge([[60,204],[60,18]])+edge([[60,115],[602,115]])+t(68,29,'位置 p（m），上正下负',14)+t(495,216,'时间 0 → '+x.t+'s',13)+`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#226249" stroke-width="3"/>`+t(330,45,'末端 p='+r.p.toFixed(4)+'m',16);root.querySelector('.v-lab-plot').innerHTML=svg(640,235,body,'单轴位置随时间曲线，包括正负方向');};root.querySelectorAll('input').forEach(i=>i.addEventListener('input',draw));draw();});};
})();
