# ORB-SLAM3 Mono + IMU 源码学习站

面向 ORB-SLAM3 零基础/源码学习者的静态学习网站，主线为 **Monocular + IMU**。内容尽量以官方源码的真实调用链、条件、阈值和数据结构为依据，并提供流程图、交互演示和源码跳转链接。

## Source baseline

所有源码结论默认固定到以下版本：

- Upstream: `UZ-SLAMLab/ORB_SLAM3`
- Branch: `master`
- Baseline commit: `4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4`

如果以后升级 ORB-SLAM3 baseline，应重新进行源码对照 review，不能默认旧页面仍然适用于新版本。

## 如何使用

这是一个**纯静态网站**，不需要 npm、数据库或后端服务。

### 方法 1：直接打开

Clone 仓库：

```bash
git clone https://github.com/ArseneWg/orbslam3-html.git
cd orbslam3-html
```

然后直接用浏览器打开：

```text
index.html
```

大多数页面可以直接以本地文件方式浏览。

### 方法 2：启动本地 HTTP 服务（推荐）

使用 Python：

```bash
cd orbslam3-html
python3 -m http.server 8000
```

浏览器访问：

```text
http://localhost:8000/
```

如果机器上的命令是 `python`：

```bash
python -m http.server 8000
```

停止服务时在终端按：

```text
Ctrl+C
```

本地 HTTP 方式更接近真实网站环境，也更适合后续增加模块、调试 JavaScript 或部署到静态托管服务。

## 推荐学习顺序

如果你对 ORB-SLAM3 几乎不了解，建议严格按下面顺序：

```text
Stage 1：整体框架
        ↓
Stage 2：源码函数级精读
        ↓
Stage 3：Tracking 单帧执行
        ↓
Stage 4：IMU / 预积分 / 惯性初始化
        ↓
Stage 5：Local Mapping / Loop Closing / Atlas
        ↓
Stage 6：源码导航 / 故障定位 / 知识检查
```

### Stage 1：先建立全局地图

从 `index.html` 开始。先理解数据入口、System/Tracking/LocalMapping/LoopClosing 的职责，以及 Frame、KeyFrame、MapPoint、Map、Atlas 的关系，不要一开始就钻优化公式。

### Stage 2：开始对照真实源码

进入 `source_index.html`，建议按下面顺序阅读：

```text
src_entry.html
→ src_system.html
→ src_orb.html
→ src_tracking.html
→ src_init.html
→ src_imu.html
→ src_local_mapping.html
→ src_loop_closing.html
→ src_optimizer.html
→ src_objects.html
```

页面中的源码链接都指向固定 baseline commit，因此不会因为 upstream 后续变化而悄悄漂移。

### Stage 3：模拟一次 Tracking

打开 `stage3_tracking_executor.html`。

可以修改 Tracking 状态、IMU 初始化状态、运动模型、Map 更新状态、LocalMapping 状态、inliers、参考 KeyFrame 地图点数量、距上一 KeyFrame 的时间/Frame 数和 `mMaxFrames`，观察执行路线如何变化。

它不是重新实现 ORB-SLAM3，而是把 `Tracking::Track()`、`TrackLocalMap()`、`NeedNewKeyFrame()` 等源码分支做成交互式学习工具。

### Stage 4：理解 IMU

打开 `stage4_imu_math.html`，重点按下面顺序理解：

```text
GrabImuData
→ PreintegrateIMU
→ PredictStateIMU
→ InitializeIMU
→ InertialOptimization
→ FullInertialBA / VIBA
```

页面里的简单数值积分演示是**教学简化**；真正 ORB-SLAM3 使用 3D 状态、SO(3)、预积分协方差和 Bias Jacobian。

### Stage 5：理解后端地图

打开 `stage5_backend_graph.html`，重点理解：

- Tracking 创建 KeyFrame 后去了哪里
- LocalMapping 如何消费 KeyFrame 队列
- 什么时候运行 Local BA / LocalInertialBA
- KeyFrame / MapPoint 如何被裁剪
- LoopClosing 如何从 BoW 候选进入 Sim3 几何验证
- Loop / Merge 的区别
- Atlas 为什么能维护多张 Map

### Stage 6：自己定位源码问题

打开 `stage6_learning_hub.html`。

推荐按：

```text
问题
→ 状态 / 函数
→ 源码精读页
→ 官方 GitHub 固定 commit
```

进行排查。目前覆盖单目初始化失败、IMU 初始化/reset、运行中丢跟踪、BAD LOOP、为什么没有插入新 KeyFrame。

## 主要页面入口

| 页面 | 用途 |
|---|---|
| `index.html` | 整体学习入口 |
| `overview.html` | Mono+IMU 全局框架 |
| `entry.html` | 图像 / IMU 数据入口 |
| `system.html` | System 与线程装配 |
| `tracking.html` | Tracking 概览 |
| `init.html` | 单目初始化 |
| `imu.html` | IMU / 惯性初始化概览 |
| `local_mapping.html` | Local Mapping |
| `loop_closing.html` | Loop Closing |
| `optimizer.html` | Optimizer |
| `data_structures.html` | Frame / KeyFrame / MapPoint / Atlas |
| `source_index.html` | 源码精读总入口 |
| `stage3_tracking_executor.html` | Tracking 交互执行器 |
| `stage4_imu_math.html` | IMU 数学与源码 |
| `stage5_backend_graph.html` | 地图后端动态图 |
| `stage6_learning_hub.html` | 调试与最终知识导航 |

## 如何和 ORB-SLAM3 源码一起看

推荐左右分屏：

- 左侧：本学习网站
- 右侧：`UZ-SLAMLab/ORB_SLAM3` 固定 commit 源码

看到 `Tracking::TrackLocalMap()`、`LocalMapping::InitializeIMU()`、`Optimizer::InertialOptimization()`、`LoopClosing::CorrectLoop()` 等函数时，点击页面里的源码链接直接核对官方实现。

读源码时始终问四个问题：

1. 这个函数是谁调用的？
2. 输入的数据对象是什么？
3. 哪些条件会进入不同分支？
4. 函数执行完以后修改了哪些状态或对象？

## 页面内容可信度约定

### 源码直接可见

表示可以从固定 baseline 的代码中直接观察到，例如函数调用、if 条件、阈值、成员变量、对象创建、线程启动、图优化顶点/边。

### 由源码行为推导

表示为了教学而解释“这段设计意味着什么”，不是官方代码注释的逐字复述。

### 教学可视化

网站里的 3D 动画、流程动画和简化数学演示用于建立直觉：

- 不代表 Pangolin Viewer 的真实输出
- 不代表算法内部真实 3D 仿真
- 不替代官方源码

## 当前进度

- [x] **Stage 1 — 框架认知**
- [x] **Stage 2 — 源码函数级精读**
- [x] **Stage 3 — Tracking.cc 单帧逐步执行器**
- [x] **Stage 4 — IMU 数学与源码对应**
- [x] **Stage 5 — 地图后端深挖**
- [x] **Stage 6 — 完整学习闭环**

## 源码 Review

- [`SOURCE_REVIEW.md`](SOURCE_REVIEW.md)：网页内容与官方源码逐页对照结果
- [`QA.md`](QA.md)：网站结构与最终检查
- [`SOURCE_BASELINE.md`](SOURCE_BASELINE.md)：源码基线说明

建议深入学习前先看一次 `SOURCE_REVIEW.md`，里面记录了边界条件、阈值顺序和交互模拟的复核结果。

## 项目结构

```text
orbslam3-html/
├── index.html
├── source_index.html
├── src_*.html
├── stage3_tracking_executor.html
├── stage4_imu_math.html
├── stage5_backend_graph.html
├── stage6_learning_hub.html
├── assets/
│   ├── styles.css
│   ├── mini3d.js
│   ├── source.css
│   ├── stage3.js
│   ├── stage4.js
│   ├── stage5.js
│   └── stage6.js
├── SOURCE_BASELINE.md
├── SOURCE_REVIEW.md
└── QA.md
```

## 提交规则

每完成一个 Stage 就直接推送到 `main`，形成可独立回退的 checkpoint。

所有源码结论继续固定到当前官方 baseline，除非明确升级 baseline。升级 baseline 后应重新执行逐页源码 review。
