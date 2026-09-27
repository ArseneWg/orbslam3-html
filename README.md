# ORB-SLAM3 图解源码手册 · 单目 + IMU

从一张桌子、一个角点和一次相机移动开始，逐步解释图像与 IMU 怎样产生位姿和地图。保留浅色阅读排版与中文字体，默认先看可操作的图，而不是先读长篇源码摘要。

**当前版本：14 章、68 个图解学习环节；177 个原理与源码参考小节保留在各章展开区。** 每章已经分别提交，完整目录与本轮验收见 [STORY_REVIEW.md](STORY_REVIEW.md)。这些数量说明覆盖范围，不是对算法正确性的证明。

## 先把网站打开

阅读不需要编译 ORB-SLAM3，不需要 npm、数据库或下载字体。浏览器需要启用 JavaScript；推荐用本地 HTTP 服务。

### 第一次使用

```bash
git clone https://github.com/ArseneWg/orbslam3-html.git
cd orbslam3-html
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows 已安装 Python 时可将最后一行换为：

```powershell
py -3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开：

```text
http://localhost:8000/
```

终端按 `Ctrl+C` 停止服务。端口被占用时改为 `8001`，浏览器地址也对应修改。该命令只监听本机，不是公网部署。

没有 Git 时，在仓库页面选择 **Code → Download ZIP**，完整解压后，在解压目录运行上述服务。

### 已经下载过旧版

在原仓库目录执行：

```bash
git pull --ff-only
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器强制刷新：Windows/Linux `Ctrl+Shift+R`，macOS `Cmd+Shift+R`。必须保留完整 `assets/`，包括 `story/`、`chapters/` 和 `visuals/`，不能只复制一个 HTML。Git 提示有本地修改时，先保存自己的修改，不要强制覆盖。

直接双击 HTML 在部分浏览器也能使用，但排查加载问题时优先使用 HTTP。图文与教学计算在本地提供；打开 GitHub 源码和外部官方参考需要联网。

## 新版怎么学：先看变化，再解释原因

从 `index.html` 开始。先操作第一幅桌子与相机的图：移动相机，观察同一个桌角在图像中怎样移动。首页第三个图解给出**采集、标定、初始化分支、跟踪、后台建图、地图反馈与输出**的完整流程，节点可点击进入对应章节。

每个图解环节按以下层次阅读：

1. **看一个具体场景。** 图上的点、相机、采样或连线都有明确含义。
2. **动一项参数，观察变化。** 滑块、选择框和部分图中的“小步更新”按钮会同步改变图形与读数。
3. **按讲解步骤往前走。** 步骤按钮逐层说明发生了什么；它们不是实际 C++ 线程执行进度。
4. **展开公式和符号。** 查看变量、单位、前提和算例；不必在初见图形时先吞下全部矩阵。
5. **展开源码对照。** 看官方固定版本的实际函数、条件与实现边界。

图框支持“放大看图”，按 `Escape` 关闭。图下面的模型范围说明不可跳过：它说明哪些量固定、哪些是未知，以及这个实验没有模拟什么。

每章还保留“深入原理与源码参考”展开区。可在地址加 `?reference=1`，例如 `tracking.html?reference=1`，直接展开完整参考正文。旧的 `#s…` 小节链接也会定位并展开相应正文。

左侧为章节目录，右侧为当前章节的图解提纲；手机点击顶部“目录”。顶部可调字号、进入专注阅读；章末有理解题、已读标记与前后章节入口。已读状态和字号保存在当前浏览器本地，不是跨设备账号同步。

## 14 章学习路线

| 章 | 从具体问题出发 | 图解数 | 入口 |
|---|---|---:|---|
| 00 开始 | 绕桌子移动时，相机看见什么？这怎么走到地图输出？ | 4 | `index.html` |
| 01 架构 | 一帧返回位姿时，两个后台线程可能在做什么？ | 4 | `overview.html` |
| 02 基础 | 一个像素为什么对应射线？内参、外参、畸变与安装关系是什么？ | 6 | `foundations.html` |
| 03 输入 | 11 个 IMU 采样点为什么只描述 10 段时间？ | 4 | `entry.html` |
| 04 System | 词典、数据库、地图和逐帧调用为什么不是一回事？ | 4 | `system.html` |
| 05 特征 | 从灰度角点到 ORB 编码，怎样判断两处纹理可能相同？ | 6 | `src_orb.html` |
| 06 初始化 | 两条观察射线怎样增加深度约束？没有地图时怎样启动？ | 5 | `init.html` |
| 07 IMU | 静止时为什么有加速度读数？积分、偏置和重力怎样联系？ | 7 | `imu.html` |
| 08 Tracking | 已知三维点以后，怎样让所有预测像素同时对齐？ | 5 | `tracking.html` |
| 09 建图 | 一个候选点要过哪些检验？为什么有些点应该被删除？ | 5 | `local_mapping.html` |
| 10 回环 | 认出旧地方后，怎样协调修正地图，而非只移动终点？ | 4 | `loop_closing.html` |
| 11 优化 | 残差、权重和 Jacobian 怎样决定下一小步？ | 5 | `optimizer.html` |
| 12 对象 | 二维观测、三维点、共视关系和输出文件怎样连接？ | 5 | `data_structures.html` |
| 13 复习 | 用同一组数字走完惯性预测、投影与结果检查。 | 4 | `stage6_learning_hub.html` |

`src_*` 与原 Stage 入口保留，共 27 个 HTML 地址，不再维护互相重复的多套课程。`stage3_tracking_executor.html` 进入 Tracking，`stage4_imu_math.html` 进入 IMU，`stage5_backend_graph.html` 进入建图；回环、优化可继续沿目录阅读。

## 实验中具体能观察什么

- **相机与三维：** 左侧显示教学空间，右侧像素由同一组坐标按投影模型计算；改变位置、方向或内参，观察像素的对应变化。
- **特征与匹配：** 观察 FAST 连续亮段、旋转比较尺、二值编码和 Hamming 差异；区分外观距离与像素几何误差。
- **深度与尺度：** 改变基线、深度或整体尺度，观察射线、视差和零基线退化，而不是把一串 XYZ 当成可靠重建。
- **IMU 与时间：** 观察静止比力与重力的抵消、偏置误差累积、帧间和关键帧间不同积分起点，以及图像时间边界处的部分区间。
- **多点位姿与优化：** 六个已知三维点共同约束教学相机的横向位置与绕 Y 轴角度；点击小步更新，观察所有投影残差一起改变。其余自由度固定，**不是完整六自由度 PnP 或浏览器版 ORB-SLAM3**。
- **地图维护：** 看点的观察期、共视连接、回环修正和轨迹输出；图中的等权二维回环链只是说明约束传播，不等于真实 Sim3/全局 BA。

部分展示是静态原理图，部分是按参数重算的 2D/3D 教学场景；不将所有图统称为物理仿真。数据、纹理、比较样本和模型简化均在图旁说明。

## 固定源码与事实边界

```text
UZ-SLAMLab/ORB_SLAM3
4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4
```

源码链接使用上述固定 commit，而不是随时变化的 `master`。区分三类内容：**源码直接行为、原理解释、明确简化的教学计算**。

例如两视图初始化需要先恢复运动和点；正常跟踪已有地图点后才形成 3D–2D 位姿问题。网页不能把这些都写成“特征匹配之后直接 PnP”。同样，Tcw 的平移不是相机世界位置，IMU 比力不是已经去重力的世界加速度，视觉初始化成功也不等于惯性初始化完成。

本网站不运行 ORB-SLAM3 C++，不报告真实 EuRoC 精度，不声称把每一行上游源码做了形式化验证。图示也不是实际 Pangolin 输出。源码行号合法是可复现的结构检查，不能单独证明一段文字的全部语义正确。

## 内容维护位置

```text
assets/app.js                  完整加载入口
assets/book.css                已确认的字体、排版和基础阅读控件
assets/book.js                 共享阅读器与原有基础演示
assets/story/<chapter>.js      当前默认的图解式课程；场景、步骤、公式、源码
assets/story/engine.js         图解阅读器、展开区与交互装配
assets/story/renderers.js      可重复计算的教学图形和数值模型
assets/story/enhancements.js   整体流程及图框、边界、导航修正
assets/story/story.css         图解式课程排版
assets/chapters/<chapter>.js   深入原理与源码参考正文
assets/visuals/                深入参考区的补充图解
assets/book-data.js            基础课程元数据与旧地址映射
assets/book-examples.js        原有补充数值例子
```

旧 HTML 中的正文仅为历史静态备份，不是当前课程的维护入口。若看到旧深色卡片或只有旧文字，先检查 JavaScript、资源目录和缓存。不要只改旧 HTML 就以为新课程已经更新。

每次改一个主题，应同时检查对应图、参数含义、公式、引用与手机布局，按章节形成可回退提交。升级官方基线时重新核对分支和行号，不能只替换 commit 字符串。

## 测试与验收

阅读网站无需测试依赖。开发者可运行：

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_curriculum.py --verify-sources
```

已有系统 Chromium 时，可设置 `CHROMIUM_EXECUTABLE`。`--verify-sources` 需要联网读取官方固定版本；不带该参数只做本地网页与算例回归。

当前测试通过真实本地 HTTP 加载网站，要求 27 个入口、全部 14 章和 68 个图解都存在；操作每个步骤、滑块两端、选择框、放大/关闭和展开区；检查手机宽度、阅读进度、算例与实际渲染的源码行号。结果、全套图解截图和被测试的源码快照输出到 `artifacts/`。

2026-09-27 的代码验收提交为 `6ac3825fe901d4399726ac28bfbb5fa0a9ead4b8`，对应 [已通过的 Actions 检查](https://github.com/ArseneWg/orbslam3-html/actions/runs/36330751300)。详细范围和本轮修正见 [STORY_REVIEW.md](STORY_REVIEW.md)。这些检查不替代真实算法、所有浏览器或公网部署验收。

## 历史记录

- [STORY_REVIEW.md](STORY_REVIEW.md)：当前图解式课程的完成核对、覆盖与验收。
- [ILLUSTRATED_REVIEW.md](ILLUSTRATED_REVIEW.md)：上一轮逐章增加图文和推导的记录。
- [REDESIGN_REVIEW.md](REDESIGN_REVIEW.md)：更早的阅读界面重构记录。
- [SOURCE_BASELINE.md](SOURCE_BASELINE.md)：固定上游基线。
- [SOURCE_REVIEW.md](SOURCE_REVIEW.md)、[QA.md](QA.md)：更早版本的审核快照，不作为新版逐句正确的证明。
