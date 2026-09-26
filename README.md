# ORB-SLAM3 源码手册 · 单目 + IMU

面向初学者的中文静态学习网站。按“问题 → 原理 → 图示/算例 → 源码行为 → 理解检查”组织内容，而不是只列函数名。新版包含 **14 个连续章节、74 个小节**；保留旧页面地址，但统一进入新版章节。

## 先把网站打开

不需要编译 ORB-SLAM3，不需要 npm、数据库或下载字体。需要浏览器启用 JavaScript；推荐用本地 HTTP 服务访问。

### 第一次使用

```bash
git clone https://github.com/ArseneWg/orbslam3-html.git
cd orbslam3-html
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows 已安装 Python 时可将最后一行换成：

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

在浏览器打开：

```text
http://localhost:8000/
```

终端按 `Ctrl+C` 停止服务。端口被占用时改为 `8001`，浏览器地址也对应修改。

### 已经下载过旧版

在已有仓库目录中执行：

```bash
git pull --ff-only
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器强制刷新：Windows/Linux `Ctrl+Shift+R`，macOS `Cmd+Shift+R`。必须保留完整 `assets/` 目录，不能只复制一个 HTML 文件。

没有 Git 时，可在仓库页面使用 **Code → Download ZIP**，完整解压后，在解压目录启动同样的 HTTP 服务。直接双击 HTML 在部分浏览器中也能加载，但不作为排查资源问题的首选方式。

## 网站怎么读

从 `index.html` 开始。左侧是固定学习目录；右侧是本章提纲；手机点击顶部“目录”。绿色下划线术语可点击解释；每节底部的“源码对照”打开固定提交的文件与行号。

顶部可调整正文字号、进入专注阅读。章末有理解题、答案折叠区、已读标记和上一章/下一章。章节搜索也会检索正文概念。字体与已读标记保存在当前浏览器本地；禁用本地存储时仍可阅读，但不会保证跨页面保存进度。

| 顺序 | 内容 | 入口 |
|---|---|---|
| 00 | 开始阅读与学习方法 | `index.html` |
| 01 | 系统全景：线程、队列、共享地图 | `overview.html` |
| 02 | 点、相机与坐标：位姿、投影、尺度 | `foundations.html` |
| 03 | 图像与 IMU 输入、时间边界 | `entry.html` |
| 04 | System 对象与线程装配 | `system.html` |
| 05 | ORB、描述子、BoW 与投影匹配 | `src_orb.html` |
| 06 | 两视图重建与第一张视觉地图 | `init.html` |
| 07 | 预积分、偏置、传播与惯性初始化 | `imu.html` |
| 08 | Tracking 初值、局部地图与失败路径 | `tracking.html` |
| 09 | LocalMapping 建点、融合、剔除与优化 | `local_mapping.html` |
| 10 | 回环、几何确认与地图合并 | `loop_closing.html` |
| 11 | 优化的变量、残差和固定边界 | `optimizer.html` |
| 12 | Frame、KeyFrame、MapPoint 与 Atlas | `data_structures.html` |
| 13 | 调试路径与理解检查 | `stage6_learning_hub.html` |

## 演示不是摆设，也不是完整 SLAM

- **系统全景图**：点击三个执行位置中的节点，查看职责、数据交接和章节入口。Optimizer 是按需调用的公共能力，不是串行流程终点。
- **基线与尺度实验**：拖动三维视角，改变双视图基线与整体尺度，观察像素视差、射线夹角和深度；模型与单位在图下说明。
- **偏置积分实验**：改变单轴恒定残留偏置和积分时间，观察速度、位置误差增长。
- **Tracking 分支实验**：只覆盖 `TrackLocalMap` 的优化函数选择与内点判定，明确处理近期重定位和 `RECENTLY_LOST`；不冒充完整 C++ 执行器。

正文另含相机右移/像素左移、Hamming 距离、两步位置积分、Bias Jacobian、加权重投影误差、共视计数等逐步算例。算例数字人为选定，不是传感器实测数据。

## 旧链接与新版内容的关系

原有 26 个 HTML 地址保留；加入 `foundations.html` 后共 27 个入口，由 `assets/app.js` 加载共享阅读器。`src_*` 和对应概览页合并为同一主题章节，不再让读者在多套 Stage 导航之间来回跳转。

`stage3_tracking_executor.html` 进入 Tracking 章，`stage4_imu_math.html` 进入 IMU 章，`stage5_backend_graph.html` 进入局部建图章，并可沿目录进入回环与优化。新版不再声称旧 Stage 3 的简化模型能模拟完整 Tracking 状态机。

旧 HTML 正文作为历史静态备份保留；**它不是新版课程正文的维护入口**。关闭 JavaScript 或新资源加载失败时可能看到旧稿。看到原来的深色大卡片页面，先检查 JavaScript、完整资源目录和缓存。新版正文以 `book-data.js`、`book-examples.js` 为准；旧审核记录是历史快照，不应当作新版每一句话都已验证的证明。

## 固定源码版本与可信度边界

```text
UZ-SLAMLab/ORB_SLAM3
4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4
```

源码链接固定在该提交。区分三类内容：源码可见行为、对其原理的解释、明确简化的教学模型。图示不代表真实 Pangolin 输出；本网站不运行 C++ SLAM、不加载真实数据集，也没有证明算法精度或对全部源码做形式化验证。

升级上游版本时，需要重新核对函数、分支顺序和源码行号，不能只替换提交字符串。

## 修改与测试

```text
assets/app.js            所有旧页面共用的加载入口
assets/book.css          中文阅读排版、导航、移动端和打印样式
assets/book-data.js      14 章基础正文、固定源码引用、URL 映射
assets/book-examples.js  6 个补充的逐步数值算例
assets/book.js           阅读器、图示、几何/偏置/分支实验
foundations.html        新增基础章节入口
```

阅读网站不需要测试依赖。开发者可运行独立浏览器回归测试：

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_reader.py
```

已有系统 Chromium 时可设置 `CHROMIUM_EXECUTABLE` 指向可执行文件。测试使用浏览器 DOM 渲染及本地资源拦截，检查布局和交互，不代表已验证 GitHub Pages 部署、所有浏览器或 C++ 算法。运行结果输出到临时目录。

- [REDESIGN_REVIEW.md](REDESIGN_REVIEW.md)：本次版式、教学结构、源码修正与测试边界
- [SOURCE_BASELINE.md](SOURCE_BASELINE.md)：上游基线记录
- [SOURCE_REVIEW.md](SOURCE_REVIEW.md)：上一版逐页复核历史
- [QA.md](QA.md)：上一版结构检查历史

本次重构以原 `main` 为父提交，保留旧文件与提交历史，不强制覆盖分支历史。后续修改应按可复核的阶段提交，而不是以页面数量代替教学质量。
