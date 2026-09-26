/* Chapter 04: construction, public API contract and coordination. */
(() => {
const D=window.ORB_DEEP,{S,eq,table,note,flow}=D;const C='src/System.cc',T='src/Tracking.cc';
D.chapter('system',{
title:'System：把数据、模型和后台工作接在一起。',dek:'系统入口 · 先有共享对象，再有逐帧估计',goal:'从构造和一次图像调用中看清对象职责、生命周期、返回值与控制请求；不把 System 当成所有算法的实现。',sections:[
S('构造一次、调用很多次：两个不同时间尺度',`System 构造时做一次长期准备：读取配置、加载词典、建立数据库和 Atlas，创建 Tracker 与后台建图/回环对象。之后每一张图调用 TrackMonocular，复用这些对象，而不是每次重新创建一套地图。

${eq('System(vocabulary_path, settings_path, IMU_MONOCULAR, use_viewer)\n每次新图：TrackMonocular(image, timestamp, imu_measurements)','这是接口角色示意，非一段独立可编译程序。传感器模式在构造期确定。')}

若构造成 MONOCULAR，再向 TrackMonocular 第三个参数放 IMU，并不自动让系统变成 IMU_MONOCULAR。源码是按 mSensor 决定是否将 IMU 测量送入跟踪器，因此初始化模式本身就是数据契约。`,[[C,41,77],[C,399,476]]),
S('加载配置是在确定测量模型，不是读装饰选项',`相机 K 和畸变决定像素怎样变成观察方向；Tbc 决定视觉与机体状态如何转换；噪声配置决定惯性约束的不确定性；ORB 参数决定提取器怎样在图像上采样特征。这些会改变估计问题，而不仅是界面的显示效果。

源码根据 File.version 是否为字符串 "1.0" 选择 Settings 路径，否则走旧格式读取路径。网上某份 YAML 的字段名并不保证适用于所有版本。读配置时，应同时核对版本、字段含义和引用位置，不只看“文件能否打开”。

例如 Viewer.PointSize 只影响显示；Camera1.fx 则改变所有几何投影。把二者都叫“参数调优”会掩盖本质区别。`,[[C,70,106],['Examples/Monocular-Inertial/EuRoC.yaml',6,49]]),
S('词典、描述子、数据库、地图：四个对象不要混成一个',`${table(['对象','内容','用于什么'],[
['ORB 描述子','本张图某个特征附近亮度比较得到的二进制编码。','描述局部外观，做匹配。'],
['ORBVocabulary','离线构造的视觉词汇树；启动时加载。','把描述子归到词/树节点，形成 BoW 表示。'],
['KeyFrameDatabase','运行过程中历史关键帧的检索索引。','查外观相似的关键帧候选。'],
['Atlas / Map','本次/加载会话中的三维点、关键帧及关系。','为几何跟踪、优化与合图提供空间状态。']])}

词典不是当前房间的地图，也不是识别“桌子/椅子”的语义分类器。它帮助把全图搜索缩成候选检索，真正是不是同一地点仍要几何验证。下一章会从二进制描述子讲到词袋匹配。`,[[C,114,132],['src/Frame.cc',738,745],['src/KeyFrameDatabase.cc',27,70]]),
S('构造期的数据和线程怎么连接',`${flow('对象装配 / 列出持有关系，不是函数逐帧调用顺序',[
{name:'长期共享',parallel:true,steps:[['Vocabulary','提供视觉词树','src_orb.html'],['KeyFrameDatabase','索引历史关键帧','loop_closing.html'],['Atlas','管理活动图与历史图','data_structures.html']]},
{name:'执行模块',parallel:true,steps:[['Tracking','在图像调用线程运行','tracking.html'],['LocalMapping','独立后台线程','local_mapping.html'],['LoopClosing','独立后台线程','loop_closing.html']]}
], 'System 显式给模块注入指针。LocalMapping 与 LoopClosing 的依赖不是完全相同：数据库直接传给 LoopClosing；不要给每个模块虚构一样的成员。')}

从零启动与从文件加载 Atlas 也是不同分支。加载后源码还创建新的活动地图；“磁盘里有旧地图”不等于当前第一张图像已自动定位到旧图中。重定位/合图仍需要后续观测和验证。`,[[C,112,179],[C,182,238]]),
S('一次 TrackMonocular：从保护条件到真实算法入口',`该函数先检查关机状态和传感器类型，再处理需要的图像缩放、模式切换与 reset 请求。只有准备好后，才在 IMU_MONOCULAR 分支里逐条调用 GrabImuData，并调用 GrabImageMonocular。

${eq('检查与控制请求\n→ 将新 IMU 测量加入 Tracker 队列\n→ GrabImageMonocular 构造当前 Frame 并调用 Track\n→ 缓存状态/关联，返回 Tcw','顺序重要：当前图像进入状态估计前，对应的 IMU 包已经入队。System 本身没有重新实现 ORB、三角化或 BA。')}

把所有计算都解释成“TrackMonocular 内部黑盒”会让源码难读。正确下一站是 Tracking::GrabImageMonocular，再由 Track 的状态进入初始化或正常跟踪。`,[[C,399,476],[T,1566,1614]]),
S('如何解释返回值：有矩阵，不等于跟踪有效',`返回类型 Sophus::SE3f 表示旋转和平移，它不是一个附带“成功概率”的结果包。System 另行缓存 Tracker 的 mState、当前关联的地图点和去畸变关键点；使用者应结合状态理解位姿。

单位变换矩阵可能代表真正位于参考原点，也可能出现在未建立有效结果的场景中。不能用“矩阵不是空的”或“位置不为零”作为唯一成功判断。源码在 shutdown 检查里就可能直接返回一个默认构造的 SE3。

此外 Tcw 的平移分量不是相机的世界位置。调用者绘图应使用 Twc=Tcw⁻¹ 的平移；若要 IMU 机体位姿，还必须按固定外参转换。`,[[C,399,411],[C,465,476],['src/Frame.cc',457,491]]),
S('Reset、ResetActiveMap、只定位模式分别意味着什么',`Reset 与 ResetActiveMap 在 System 层先设置请求标记。下一次 TrackMonocular 的控制段才交给 Tracker 执行相应重置。这说明“调用 reset 接口”与“地图对象已经立即完成全部清理”不是同一个时刻。

只定位模式请求会暂停 LocalMapping，再通知 Tracker 只跟踪已有地图；退出时释放局部建图。概念上它区别于一边定位一边扩展地图。但该固定基线的 Tracking 代码对惯性 only-tracking 路径带有 TODO 限制，不能因为 System 暴露了接口就宣称 Mono+IMU 的所有模式已完整支持。

读控制接口最重要的是区分：请求、等待、执行、状态置位。它们影响的不只是一个 if 值，还涉及后台是否正在改地图。`,[[C,422,460],[C,482,513],[T,2037,2050]]),
S('Shutdown 与保存：检查实际执行，不只读注释',`该基线的 Shutdown 设置 mbShutDown，向 LocalMapping 与 LoopClosing 发出 RequestFinish；配置了 Atlas 保存路径时调用 SaveAtlas。值得注意的是，源码里“等待所有线程结束”的那段循环被注释掉了。

所以不能根据函数名或“Wait until…”注释，写成“返回时一定完成了严格线程 join 并且所有地图优化结束”。实际工程要确认后台结束与导出时的一致性边界；本教材不把该示例实现包装成经过证明的生命周期管理。

轨迹保存与 Atlas 保存仍是两类操作。示例在结束阶段显式调用 SaveTrajectoryEuRoC 与 SaveKeyFrameTrajectoryEuRoC；文件名叫 CameraTrajectory.txt，也不能据此推断惯性分支一定导出相机而非机体坐标。对象/输出章将读具体分支。`,[[C,515,557],['Examples/Monocular-Inertial/mono_inertial_euroc.cc',230,250],[C,668,709]]),
S('沿一次调用建立断点地图',`${table(['想确认什么','首个观察位置','继续往哪里跟'],[
['是否真的是 Mono+IMU','System 构造的 mSensor。','TrackMonocular 的 IMU_MONOCULAR 条件。'],
['测量是否进入队列','System 的 GrabImuData 循环。','Tracking::PreintegrateIMU。'],
['相机模型是否对应图像','Settings/Tracking 的相机配置。','Frame 去畸变与 Pinhole 投影。'],
['为什么还未跟踪','Tracking::mState。','MonocularInitialization 或正常分支。'],
['为什么地图还没增加新点','关键帧创建和 LM 队列。','LocalMapping::CreateNewMapPoints。']])}

System 章的作用是消除入口与对象关系上的黑盒。接下来，先把图像中的二维特征和匹配讲透，再去解释三维几何与状态估计。`,[[C,182,238],[C,462,476],[T,1624,1734]])
],question:'把系统构造成 MONOCULAR，但每次仍传入 IMU 向量，会自动得到单目惯性 SLAM 吗？',answer:'不会。传感器模式在构造期保存为 mSensor；TrackMonocular 仅在 IMU_MONOCULAR 条件成立时逐条转交 IMU。配置、惯性标志、Tracker/LocalMapper 的构造也受模式影响，不能用非空第三参数替代正确的系统构造。'
});
})();
