# ORB-SLAM3 学习站源码逐页复核

复核日期：2026-09-26

## 固定源码基线

- Upstream: `UZ-SLAMLab/ORB_SLAM3`
- Branch: `master`
- Commit: `4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4`

本轮不是只做页面链接检查，而是把网页中的调用链、条件判断、阈值和交互逻辑重新与上述 commit 一一对照。

## 逐页结论

| 页面 | 对照的主要源码 | Review 结果 |
|---|---|---|
| `index.html` | System / Tracking / LocalMapping / LoopClosing 总主链 | 通过；属于高层导航，不承载精细阈值 |
| `overview.html` | `System.cc`, `Tracking.cc`, `LocalMapping.cc`, `LoopClosing.cc` | 通过；Tracking 在调用线程执行、LM/LC 独立线程的描述一致 |
| `entry.html` | `Examples/Monocular-Inertial/mono_inertial_euroc.cc` | **已修正** IMU 时间窗：不是简单闭区间 `[t_k,t_{k+1}]`；由持续前进的 `first_imu` 游标决定，并保留首个边界样本 |
| `system.html` | `src/System.cc` | **已修正** 模块依赖描述：LocalMapping 与 LoopClosing 持有的对象不同，不能笼统写成二者都访问 Database |
| `tracking.html` | `src/Tracking.cc` | **已修正** `TrackReferenceKeyFrame`：实际为 ComputeBoW → SearchByBoW → PoseOptimization，本函数没有“局部投影匹配” |
| `init.html` | `Tracking::MonocularInitialization`, `CreateInitialMapMonocular` | 通过；>100 特征、>=100 匹配、两视图重建、初始 GBA、<50 tracked points reset 均一致 |
| `imu.html` | `PreintegrateIMU`, `InitializeIMU` | **已修正** InitializeIMU 的硬入口 gate 是 Mono >=10 KFs 且 >=2s；“运动激励”不是函数入口处的单独阈值 |
| `local_mapping.html` | `LocalMapping::Run` | 通过；处理顺序和视觉/惯性 BA 的角色一致 |
| `loop_closing.html` | `LoopClosing::Run`, `CorrectLoop` | 通过；高层说明一致 |
| `optimizer.html` | `Optimizer.cc` | 通过；Pose-only / Local BA / inertial optimization 的变量角色一致 |
| `data_structures.html` | Frame / KeyFrame / MapPoint / Map / Atlas | 通过；对象关系与源码容器/观测关系一致 |
| `source_index.html` | 多模块阈值索引 | 通过；速览阈值与 baseline 一致 |
| `src_entry.html` | EuRoC mono-inertial example | **已修正** 游标与首区间边界样本说明 |
| `src_system.html` | `System::System`, `TrackMonocular` | 通过；线程创建、指针注入、IMU 先入队再处理图像均一致 |
| `src_orb.html` | `ORBextractor.cc`, `ORBmatcher.cc`, `Frame::ComputeBoW` | 通过；金字塔、32-byte descriptor、BoW 节点内匹配、projection search 描述一致 |
| `src_tracking.html` | `GrabImageMonocular`, `Track`, `TrackLocalMap`, `NeedNewKeyFrame` | **已修正** extractor 切换取决于 Tracking 的视觉初始化状态，而不是 Map 的 IMU 初始化状态 |
| `src_init.html` | `MonocularInitialization`, `CreateInitialMapMonocular` | 通过；包括 Mono+IMU 初始 `4/medianDepth` 归一化与 KF 时间链 |
| `src_imu.html` | `PreintegrateIMU`, `PredictStateIMU`, `InitializeIMU`, `InertialOptimization` | 通过；两类 Preintegrated 对象、状态传播、scale/gravity/bias 变量描述一致 |
| `src_local_mapping.html` | `LocalMapping::Run` | **已修正** ScaleRefinement：内层虽列 25/35/45/55/65/75s，但外层 `mTinit<50` 使该 baseline 实际只可达约 25/35/45s |
| `src_loop_closing.html` | `NewDetectCommonRegions`, `DetectCommonRegionsFromBoW`, `CorrectLoop` | **已修正** 新候选阈值执行顺序；并明确 `phi=LogSO3(R)` 是旋转向量，不是 Euler 角 |
| `src_optimizer.html` | `PoseOptimization`, `LocalBundleAdjustment`, `LocalInertialBA`, `InertialOptimization` | 通过；fixed/free vertex 解释一致 |
| `src_objects.html` | `Frame::ComputeBoW`, `KeyFrame::UpdateConnections`, MapPoint / Atlas | 通过；共视阈值 15、MapPoint descriptor 中位距离选择、Atlas 新图语义一致 |
| `stage3_tracking_executor.html` + `assets/stage3.js` | `Track`, `NeedNewKeyFrame`, `TrackLocalMap` | **已修正** 交互器加入 LocalMapping gate、frames-since-KF / maxFrames；并使用 mapUpdated 展示 LastFrame/LastKeyFrame 惯性优化路径 |
| `stage4_imu_math.html` | `InitializeIMU`, `InertialOptimization`, LocalMapping staged VIBA | **已修正** 55/65/75s ScaleRefinement 在当前 baseline 被外层 `mTinit<50` gate 阻断 |
| `stage5_backend_graph.html` + `assets/stage5.js` | LocalMapping / LoopClosing / Atlas | **已修正** Loop 新候选阈值真实顺序；LocalInertialBA 必须等 IMU 初始化；merge scale gate 的适用条件写清 |
| `stage6_learning_hub.html` | 全链故障定位 | **已修正** BAD LOOP 使用的是 SO(3) 旋转向量分量，不再把其严格等同于 roll/pitch/yaw |

## 本轮发现的关键问题

1. **IMU 示例输入边界**：EuRoC example 的 `first_imu` 初始化会保留一个不晚于首图时间戳的样本，之后游标持续前进。
2. **视觉初始化 vs IMU 初始化**：`mpIniORBextractor` 的切换看 Tracking state，不看 `isImuInitialized()`。
3. **NeedNewKeyFrame 的 LocalMapping gate**：Mono+IMU 条件触发后，LocalMapping 忙时仍可能返回 false。
4. **ScaleRefinement dead windows**：当前 commit 内层列出 55/65/75s，但被外层 `mTinit<50` 阻断。
5. **Loop threshold execution order**：新候选是 BoW≥20 → RANSAC(min15) → coarse projection≥50 → OptimizeSim3 result≥20 → refined projection≥80。
6. **SO(3) `phi` 语义**：`LogSO3` 输出是旋转向量；源码“force only yaw”是将 x/y 分量清零的工程处理，不等同于先求 Euler angles。

## 仍然保留的教学简化

- Stage 3 只模拟 Mono+IMU 主路径，不覆盖 localization-only、重定位后的 frame-id guard、完整 RECENTLY_LOST/LOST 状态机。
- Stage 4 的一维积分小工具是教学近似，页面已明确真实代码运行在 3D/SO(3) 且维护 covariance / bias Jacobian。
- 3D 动画用于解释数据关系，不代表 ORB-SLAM3 Viewer 的真实渲染结果。

这些简化均应在页面中明确标注为教学可视化，而不是源码直接执行结果。
