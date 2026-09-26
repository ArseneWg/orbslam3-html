# ORB-SLAM3 Mono + IMU 源码学习站

面向 ORB-SLAM3 零基础/源码学习者的静态学习网站，主线为 **Monocular + IMU**。

## Source baseline

- Upstream: `UZ-SLAMLab/ORB_SLAM3`
- Branch: `master`
- Baseline commit: `4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4`

## 当前进度

- [x] **Stage 1 — 框架认知**：完整流程、System、Tracking、初始化、IMU、Local Mapping、Loop Closing、Optimizer、数据结构。
- [x] **Stage 2 — 源码函数级精读**：真实函数调用、源码阈值、成员变量、BoW/ORB、图优化与源码行号链接。
- [ ] **Stage 3 — Tracking.cc 单帧逐步执行器**：沿一次 Mono+IMU 帧处理过程逐步展开调用栈、状态变化和数据变化。
- [ ] **Stage 4 — IMU 数学与源码对应**：预积分、Bias、重力、尺度、速度、惯性初始化与 VIBA。
- [ ] **Stage 5 — 地图后端深挖**：Local Mapping / Loop Closing / Atlas / BA / Sim3 的动态图解。
- [ ] **Stage 6 — 完整学习闭环**：源码导航、术语索引、知识检查、调试路径与最终 QA。

## 入口

- `index.html`：整体学习站
- `source_index.html`：Stage 2 源码精读入口

## 提交规则

每完成一个 Stage，就直接推送到 `main`，形成可独立回退的 checkpoint。所有源码结论继续固定到上面的官方 baseline，除非明确升级 baseline。
