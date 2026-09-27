# ORB-SLAM3 源码手册 · 单目 + IMU

面向初学者的中文静态学习网站。先讲“测量给了什么、未知量是什么”，再用图解、公式、数值算例和源码说明怎样求解。保留已确认的浅色阅读排版与字体。

当前课程：**14 章、177 个主小节**。在正文相关位置加入 **34 个图解/推导子主题、28 个新增 SVG 图解、25 个带符号与前提说明的公式面板、6 个新增参数实验**。原有有明确几何意义的三维实验继续保留。这些数量是内容清单，不代表对全部算法正确性的证明。

## 先把网站打开

阅读不需要编译 ORB-SLAM3，不需要 npm、数据库或下载字体。浏览器需要启用 JavaScript；推荐本地 HTTP 访问。

### 第一次使用

```bash
git clone https://github.com/ArseneWg/orbslam3-html.git
cd orbslam3-html
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows 可将最后一行换为：

```powershell
py -3 -m http.server 8000 --bind 127.0.0.1
```

浏览器打开 `http://localhost:8000/`。终端按 `Ctrl+C` 停止服务。端口被占用时改为 `8001`，浏览器地址也相应改变。该命令仅监听本机，不是公网部署。

没有 Git 时，在仓库页面选择 **Code → Download ZIP**，完整解压后，在解压目录启动同样的服务。

### 更新旧版

在已有仓库目录中执行：

```bash
git pull --ff-only
python3 -m http.server 8000 --bind 127.0.0.1
```

浏览器强制刷新：Windows/Linux `Ctrl+Shift+R`，macOS `Cmd+Shift+R`。必须保留整个 `assets/`，不能只复制 HTML。若 Git 提示存在本地修改，先保存自己的改动再合并，不要直接覆盖。

直接双击 HTML 在部分浏览器可用，但不作为排查资源问题的首选。正文与图解在本地提供；访问外部源码和官方参考链接需要联网。

## 先看哪一章

从 `index.html` 开始，先读“采集 → 观测 → 估计 → 地图 → 输出”的完整图。随后按目录学习；不要在还没有分清二维观察和三维地图点时直接跳到 PnP 或优化器。

| 章 | 这一章要回答的问题 | 入口 |
|---|---|---|
| 00 开始 | 图像和 IMU 怎样一路变成位姿、稀疏地图和导出文件？ | `index.html` |
| 01 架构 | Tracking、LocalMapping、LoopClosing 怎样并行协作？ | `overview.html` |
| 02 基础 | 位姿、投影、内参、畸变、外参、相机–IMU 联合标定是什么？ | `foundations.html` |
| 03 输入 | IMU 每列是什么，为什么一幅图需要一段测量，时间怎样对齐？ | `entry.html` |
| 04 System | 哪些对象只创建一次，逐帧接口返回什么？ | `system.html` |
| 05 特征 | FAST、ORB 方向、描述子、Hamming、BoW 和匹配怎样工作？ | `src_orb.html` |
| 06 初始化 | 没有地图时，怎样从两张图恢复相对运动与第一批三维点？ | `init.html` |
| 07 IMU | 比力、重力、积分、偏置、预积分、尺度初始化怎样联系？ | `imu.html` |
| 08 Tracking | 地图已有三维点后，怎样求本帧位姿？PnP 与当前优化有什么区别？ | `tracking.html` |
| 09 建图 | 候选三维点要过哪些检验？关键帧与地图点为什么会被裁剪？ | `local_mapping.html` |
| 10 回环 | 外观相似如何变成几何证据？Sim3、区域支持和地图合并是什么？ | `loop_closing.html` |
| 11 优化 | 变量、残差、权重、鲁棒核、Jacobian、BA 怎样具体求解？ | `optimizer.html` |
| 12 对象 | Frame、KeyFrame、MapPoint、观测图、Atlas 和轨迹文件有什么区别？ | `data_structures.html` |
| 13 复习 | 用一组数字贯通预测与像素验证，遇到问题按什么顺序排查？ | `stage6_learning_hub.html` |

每章推荐按 **问题和已知量 → 图解 → 公式符号/单位/前提 → 逐步算例 → 源码对照 → 理解检查** 阅读。公式中的同名符号可能位于不同问题，例如优化的一阶项 g 与重力 g；相应面板分别说明其含义。

## 如何操作图解与实验

左侧为章节目录，右侧为本章提纲及图解子主题；手机点击顶部“目录”。正文术语可展开解释。顶部可调字号或进入专注阅读，章末有理解题、答案、已读标记与前后章节导航。

图解有“放大图解”按钮，按 `Escape` 关闭；窄屏图形可在图框内横向滚动，每图还提供按文字顺序阅读的说明。手机自动展开这些文字说明，不必靠缩成小字的图理解流程。

参数实验可逐项改变输入，观察图与数值结果同步变化：

- **投影**：改变焦距、主点、三维点和相机横移，区分内参与位姿。
- **匹配**：修改 8 位教学编码，数出不同 bit；真实 ORB 是 256 位。
- **深度**：改变基线与视差误差，观察远点不稳定和零基线退化。
- **IMU**：把重力项设错，观察静止比力如何被误积分成运动。
- **位姿**：改变一个相机位置，使三个地图点的预测像素共同靠近固定观测。
- **优化**：改变残差与标准差，观察加权误差及 Huber 代价。

**这些都是明示前提的教学实验，不是完整 ORB-SLAM3 在浏览器中的移植。** 尤其是位姿滑块只隔离一个自由度，其余五个自由度已知，不等于运行完整 PnP。数值是人为选定、可手算验证的例子，不是传感器实测成绩。

阅读进度与字号保存在当前浏览器；存储不可用时仍可阅读，但不保证跨页保存。

## 图文与源码的关系

上游固定版本：

```text
UZ-SLAMLab/ORB_SLAM3
4452a3c4ab75b1cde34e5505a36ec3f9edcdc4c4
```

页面中的“源码对照”指向这个提交的具体文件与行号。对概念的补充优先使用 OpenCV、Kalibr 等英文官方资料。教学示意、理论关系和本仓库实际调用路径分开说明，不能把通用原理冒充该函数的实现。

例如：两视图初始化是 2D–2D 问题；已有地图的位姿估计是 3D–2D 问题。重定位路径实际创建 `MLPnPsolver`，而普通 `TrackReferenceKeyFrame` 是 BoW 匹配后调用 `PoseOptimization`，不是每幅图都无条件调用 PnP。

网页不会运行 C++ SLAM，也没有进行 EuRoC 精度评测。源码链接能打开、行号合法，不等于自动证明每句解释正确。升级上游时必须重新核对调用和条件，不能只替换提交字符串。

## 旧地址与维护位置

保留 27 个兼容入口。`src_*` 与对应概览地址进入同一主题；旧 Stage 3/4/5 分别进入 Tracking / IMU / 建图章，不新增第二套学习目录。

旧 HTML 正文仅作为历史备份。**新版主小节在 `assets/chapters/`，图解、公式详解与新实验在 `assets/visuals/`。** 禁用 JavaScript 或资源失败时可能看到旧深色稿；请先检查完整资源目录和缓存，不要同时维护两套正文。

```text
assets/app.js                  加载入口
assets/book.css / book.js      已确认的阅读器与交互
assets/book-data.js            基础目录、别名与旧基础内容
assets/book-examples.js        原有逐步算例
assets/chapters/runtime.js     主章节组件与已有参数模型
assets/chapters/<章节>.js       14 章原理正文
assets/chapters/deep.css       主章节附加样式
assets/visuals/runtime.js      图解、公式、参数模型与放大阅读
assets/visuals/<章节>.js        每章图解、推导与算例
assets/visuals/index.js         按章节顺序加载已完成内容
assets/visuals/visual.css       继承现有字体的图文样式
tests/test_curriculum.py       实际 HTTP 阅读器回归测试
.github/workflows/curriculum.yml  GitHub Actions 检查
```

## 开发者如何复查

阅读网站不需要下面这些测试依赖。开发测试需要 Python、Node.js 和 Chromium：

```bash
python3 -m pip install playwright
python3 -m playwright install chromium
python3 tests/test_curriculum.py --verify-sources
```

Linux 缺少浏览器依赖时按 Playwright 官方方式安装；已有 Chromium 可通过 `CHROMIUM_EXECUTABLE` 指定。测试会启动本机临时 HTTP 服务，经过真实 `app.js` 加载，检查所有入口、移动端、参数变化、同源进度存储及固定源码行号。结果写入 `artifacts/curriculum/report.json`，并生成截图。

[已通过的完整回归运行](https://github.com/ArseneWg/orbslam3-html/actions/runs/36289311379) 对应网页代码提交 `0a3963aa9182a535817141773ea780427ea8c6e6`：27 个桌面入口、14 章手机宽度、11 个已有/新增参数组件、22 个上游文件的 236 个去重行号区间。运行产物 `curriculum-review` 含截图、报告和精确源码快照；当前工作流产物保留 7 天，过期后可重新运行生成。

这些测试不替代人工读图、概念核对、真实传感器实验或跨浏览器验收。每次提交的最新状态请看仓库 Actions，不把一次历史通过永久沿用。

## 交付与历史记录

- [ILLUSTRATED_REVIEW.md](ILLUSTRATED_REVIEW.md)：本次逐章图文完善、14 个章节提交、读者视角复核、实测范围与限制。
- [SOURCE_BASELINE.md](SOURCE_BASELINE.md)：上游源码基线。
- [REDESIGN_REVIEW.md](REDESIGN_REVIEW.md)：前一轮阅读界面重构历史。
- [SOURCE_REVIEW.md](SOURCE_REVIEW.md)、[QA.md](QA.md)：更早版本检查记录，不代表当前全部内容逐句无误。

本轮按“完成一个章节，独立提交推送，再开始下一章”保留检查点；测试发现的引用边界问题另作修正提交，不强推、不覆盖提交历史。
