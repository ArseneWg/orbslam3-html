/* Chapter 01: branches, asynchronous queues and map feedback. */
(() => {
const D=window.ORB_DEEP,{S,eq,table,note,figure}=D;
const box=(x,y,w,title,sub,url)=>`<a href="${url}"><rect x="${x}" y="${y}" width="${w}" height="62" rx="7" fill="#fff" stroke="#92ac99"/><text x="${x+w/2}" y="${y+25}" text-anchor="middle" font-size="14" font-weight="600">${title}</text><text x="${x+w/2}" y="${y+46}" text-anchor="middle" font-size="11">${sub}</text></a>`;
const diagram=figure('真正的分支与数据交接 / 实线是当前处理，虚线是队列或共享状态',`<span class="d-diagram-scroll" tabindex="0"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 850 1010" role="img" aria-label="从相机与 IMU 进入 System，再分初始化和已建图跟踪，关键帧进入后台，地图反馈给前端并导出"><defs><marker id="whole-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0L8 4L0 8Z" fill="#62816c"/></marker></defs><g stroke="#62816c" fill="none" stroke-width="1.5" marker-end="url(#whole-arrow)"><path d="M135 82V101H400V121"/><path d="M405 82V121"/><path d="M675 82V101H420V121"/><path d="M410 183V222"/><path d="M410 284V319"/><path d="M310 353H180V404"/><path d="M510 353H630V404"/><path d="M180 466V489H410V514"/><path d="M630 466V489H410V514"/><path d="M610 669V704"/><path d="M610 766V801"/><path d="M610 863V915"/><path d="M270 735H454" stroke-dasharray="6 5"/><path d="M450 445H318V668H300" stroke-dasharray="6 5"/><path d="M610 607V579H630V466" stroke-dasharray="6 5" marker-start="url(#whole-arrow)" marker-end="none"/><path d="M460 945H230V795" stroke-dasharray="6 5"/><path d="M140 607V591H42V262H160" stroke-dasharray="6 5"/></g>${box(20,20,230,'单目相机','图像 Iₖ + 时间 tₖ','entry.html')}${box(290,20,230,'IMU','aₘ、ωₘ、时间 t','imu.html')}${box(560,20,230,'标定与配置','K / 畸变 / Tbc / 噪声','foundations.html')}${box(190,121,440,'按时间整理 → System::TrackMonocular','先 GrabImuData 入队，再 GrabImageMonocular','system.html')}${box(160,222,500,'构造 Frame / ORB 特征 → 帧间 IMU 预积分','当前观测准备；无上一帧等情况存在提前返回','src_orb.html')}<path d="M410 319L510 353L410 387L310 353Z" fill="#eaf2e9" stroke="#92ac99"/><text x="410" y="357" text-anchor="middle" font-size="13">已有视觉地图？</text><text x="224" y="343" font-size="12">否</text><text x="550" y="343" font-size="12">是</text>${box(35,404,290,'两视图初始化','2D–2D → 相对运动 → 初始三维点','init.html')}${box(450,404,350,'正常跟踪 / 失败恢复','预测 → 3D–2D 匹配 → 视觉惯性优化','tracking.html')}${box(190,514,440,'逐帧返回 Tcw；查询 Tracking 状态','这是当前帧结果，并不等待所有后台任务结束','tracking.html')}${box(460,607,340,'关键帧判定与创建 → LM 队列','不是每张图入队；还要通过创建保护','tracking.html')}${box(30,607,270,'共享 Atlas / Map','关键帧、MapPoint、观测图','data_structures.html')}${box(460,704,340,'LocalMapping 后台','建点 / 融合 / 剔除 / 局部 BA','local_mapping.html')}${box(30,733,270,'按条件：IMU 初始化','尺度 / 重力 / 速度 / 偏置','imu.html')}${box(460,801,340,'处理后的关键帧 → LC 队列','LoopClosing 查区域并做几何验证','loop_closing.html')}${box(460,915,340,'有可靠回环或合图：修正地图','更新共享地图，后续前端使用新状态','loop_closing.html')}<text x="35" y="698" font-size="12">地图为前端提供已有三维点 ↑</text><text x="329" y="654" font-size="11">更新地图</text><text x="34" y="852" font-size="12">Viewer 读取地图 → 稀疏点云 / 轨迹</text><text x="34" y="879" font-size="12">保存接口：轨迹文件 或 Atlas 序列化</text><text x="34" y="906" font-size="11">输出接口详见对象章与验收章</text><text x="492" y="993" font-size="11">虚线回馈代表共享状态，不是递归调用</text></svg></span>`, '学习图把条件与队列显式分开。图中两条初始化/正常路径是互斥分支；IMU 初始化属于 LocalMapping 内的条件工作。原始图像不会直接送到 LoopClosing。可点击节点阅读原理。');
D.chapter('architecture',{
title:'把执行流程、状态阶段和地图反馈分开看。',dek:'系统全景 · 一次调用不等于整个系统的一轮',goal:'读完能把一个像素观测追踪到当前位姿、关键帧、三维点、全局校正与输出，并能指出每条箭头的含义。',
sections:[
S('完整流程图：需要看见的不只有箭头',`上一章建立了采集到输出的总图，这里把<strong>初始化分支、关键帧队列和地图反馈</strong>展开。请先找到 System、菱形判断和两个后台队列，再顺着图走一次。

${diagram}`, [['src/System.cc',182,238],['src/System.cc',462,476],['src/Tracking.cc',1898,2030],['src/Tracking.cc',3216,3341],['src/LocalMapping.cc',64,273]]),
S('主线程和两个后台线程究竟分别做什么',`线程可以理解为独立推进的一条执行路线。源码没有给 Tracking 单独创建 new thread；调用者执行 TrackMonocular 时，会同步进入 Tracking。LocalMapping 和 LoopClosing 则由 System 构造时启动独立线程。

为什么这样分？每张图都需要尽快得到当前位姿，但三角化许多新点、局部 BA 和闭环校正比一次前端匹配更重。把选中的关键帧放进队列，允许前端继续接收图像，后台稍后精修地图。这是源码架构的职责分离，不是“后台计算不影响前端”。地图改变后，前端下一帧可能需要采用更新后的关键帧状态。

Viewer 是可选可视化线程；Optimizer 是函数集合，不是第四个永远独立运行的优化线程。某些大范围 BA 会另外启动工作线程，不能因此把所有优化都画成同一个固定线程。`,[['src/System.cc',182,238],['src/LoopClosing.cc',1168,1211]]),
S('三种不同的“初始化状态”',`${table(['状态/标记','已经具备什么','尚不能由它推出什么'],[
['Tracking::NOT_INITIALIZED','正在尝试建立第一张视觉地图。','不能对空地图直接做常规地图点跟踪。'],
['Tracking::OK','这一阶段已可用视觉地图进行跟踪，或当前帧跟踪通过。','不自动表示惯性已初始化，也不保证尺度已经准确。'],
['Map::isImuInitialized()','惯性初始化已更新相关状态并置位。','不自动表示后续 BA1/BA2 都完成。'],
['GetIniertialBA1()/BA2()','源码分阶段惯性估计的进度标记。','不是“全程永不漂移”的质量证书。']])}

这些量属于不同对象、控制不同分支。例如 ORB 初始化提取器的选择看 Tracking 状态；是否在局部建图中调用 LocalInertialBA 看地图的惯性初始化标记。只写一个“初始化完成”会让读者无法判断真实路径。`,[['src/Tracking.cc',1566,1614],['src/Tracking.cc',2448,2668],['src/LocalMapping.cc',127,241]]),
S('一帧输入在各模块间携带的不是同一种数据',`${table(['边界','传递的内容','为什么这样设计'],[
['Example → System','一张图像、图像时间、vector<IMU::Point>。','核心不负责读取 CSV 或摄像头驱动。'],
['System → Tracking','IMU 队列和图像入口调用。','将采集组织与状态估计分离。'],
['Frame → KeyFrame','被选中帧的特征、位姿、地图点关联与惯性信息。','保留适合长期优化的观测，而非所有图像。'],
['Tracking → LocalMapping','KeyFrame 指针进入队列。','后台可以建立观测和新地图点。'],
['LocalMapping → LoopClosing','处理后的 KeyFrame。','检索和几何验证利用地图关联，而不只比较整张图片。']])}

初始地图和后续地图不是两个完全不同的数据结构：它们最终都使用 KeyFrame、MapPoint、Map。差别在于这些对象在什么时候、用哪些几何信息创建。`,[['Examples/Monocular-Inertial/mono_inertial_euroc.cc',129,195],['src/System.cc',462,476],['src/Tracking.cc',2526,2632],['src/LocalMapping.cc',253,337]]),
S('为什么要关键帧，而不是把每张图都存下来',`Frame 的目标是实时跟踪当前时刻；KeyFrame 的目标是长期留下有用的几何观测。相邻许多图像可能几乎一样，把它们全部放进 BA 会增加计算与存储，却未必增加足够的新视角。

但关键帧也不能太少：三角化需要不同视角，场景改变时需要新的观测，惯性约束也需要可连接的时间链。因此选择关键帧要同时考虑时间间隔、跟踪点数量、相对参考关键帧的观测覆盖、前后端是否繁忙。它不是“每 N 帧永久留一张”这么简单。

源码中 NeedNewKeyFrame 只是判定；CreateNewKeyFrame 还会检查局部建图初始化状态与停止保护。随后 KeyFrameCulling 可能再移除冗余关键帧，形成“选择—维护—裁剪”的生命周期。`,[['src/Tracking.cc',3064,3249],['src/LocalMapping.cc',902,1000]]),
S('地图为什么会反过来改变当前帧的处理',`第一次看到桌角时，你只能把它当二维特征。建立三维 MapPoint 后，下一次就能预测它应该投在哪里；因此地图不只是流程终点，还是前端下一步的输入。

后端优化若改变了上一关键帧的位姿、速度或偏置，继续沿旧的上一帧状态传播可能不一致。Tracking 会检查 MapChangeIndex，设置 mbMapUpdated。惯性预测与局部地图优化据此选择“上一关键帧”或“上一 Frame”作为约束参照。

这解释了图中的反馈虚线：<strong>地图是被所有模块共同维护的估计，不是一个只写不读的结果文件。</strong>`,[['src/Tracking.cc',1736,1784],['src/Tracking.cc',1880,1897],['src/Tracking.cc',2970,2997]]),
S('一份前端输出和一份最终轨迹为什么可能不同',`每帧刚处理完的位姿是当时的在线估计。之后局部 BA 或回环可能修正关键帧。普通 Frame 的历史位姿常以“相对参考关键帧”的方式保存；导出时重新结合被修正的参考关键帧，因此历史轨迹也会改变。

${eq('Tcw(frame) = Tcr(frame 相对参考帧) · Trw(参考帧最新位姿)','这是解释相对保存的简化组合；实际导出还处理被裁剪参考帧的父链、地图选择与坐标原点。')}

所以“每帧实时返回值拼起来的路径”和“结束后导出的轨迹”不应被默认当成同一份最终优化结果。也不能把轨迹文本文件当成完整 Atlas：后者还需要地图点与观测关系。`,[['src/Tracking.cc',2297,2326],['src/System.cc',599,625],['src/System.cc',668,745]]),
S('共享数据怎样协调：队列、互斥锁与停止请求',`队列解决“谁先处理哪一个关键帧”；互斥锁解决“某段共享对象更新时，别人不能同时改”；停止请求解决“闭环校正时暂时不让 LocalMapping 继续插入或优化相关结构”。三者不是同一个开关。

LocalMapping::InsertKeyFrame 把新关键帧入队并设置 BA 中断标记，Run 多次检查队列来避免长期滞后。CorrectLoop 请求停止局部建图、处理队列并等待停下，再在合适锁保护下修改地图。EmptyQueue 不是把所有关键帧直接扔掉，而是循环 ProcessNewKeyFrame。

这些代码说明了设计意图，但仅阅读几个 mutex 不能证明整个 C++ 程序不存在数据竞争；学习时应围绕具体共享变量与锁范围理解。`,[['src/LocalMapping.cc',282,343],['src/LoopClosing.cc',969,1050]]),
S('把原理问题定位到对应章节',`${table(['现在的问题','先读哪里','再跟到源码'],[
['内参、外参和像素射线是什么？','基础几何；输入与标定。','Pinhole / ImuTypes::Calib / Settings'],
['怎么知道两张图里是同一个点？','ORB 特征与匹配。','ORBextractor / ORBmatcher'],
['初始三维点从哪里来？','单目初始化。','TwoViewReconstruction / Triangulate'],
['PnP 怎么用地图求相机？','Tracking 章的 3D–2D 推导。','PoseOptimization / Relocalization / MLPnPsolver'],
['IMU 为什么还需要相机？','IMU 章的积分与偏置。','Preintegrated / PredictStateIMU'],
['点和相机一起优化是什么意思？','Optimizer 章。','LocalBundleAdjustment / LocalInertialBA']])}

每次读函数都先写明“输入有哪些已知量、要求哪些未知量”。同样叫匹配，2D–2D、3D–2D、3D–3D 的后续几何问题完全不同。`)
],question:'为什么“图片 → Tracking → LocalMapping → LoopClosing → 地图”不是准确的逐帧执行描述？',answer:'初始化与正常跟踪有分支，非每张图都变关键帧；LM/LC 独立消费队列，图像调用不等待它们全部完成；Optimizer 在不同位置按需调用；已有地图还会反过来为下一帧的匹配、预测和优化提供约束。地图也不是只在最后才输出。'
});
})();
