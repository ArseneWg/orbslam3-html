/* 05 · Measured image structure, oriented binary tests and association ambiguity. */
(() => {
const V=window.ORB_VISUALS,{p,t,box,dot,edge,svg,figure,formula,steps,note,lab}=V;
let ring=t(180,28,'候选中心 + 圆环亮度',17,'middle');
ring+='<circle cx="180" cy="160" r="84" style="fill:none;stroke:#c1cfc2" stroke-dasharray="3 4"/>';
for(let i=0;i<16;i++){const a=i*2*Math.PI/16-Math.PI/2,x=180+84*Math.cos(a),y=160+84*Math.sin(a),value=i<9?160:105;ring+=`<circle cx="${x}" cy="${y}" r="13" style="fill:${i<9?'#f6dfab':'#c8d4cc'};stroke:#718574"/>`+t(x,y+4,String(i+1),10,'middle');}
ring+='<circle cx="180" cy="160" r="28" style="fill:#aabcb0;stroke:#537961"/>'+t(180,165,'100',15,'middle');
ring+=box(345,65,350,75,'中心 I₀=100，阈值 t=20','亮：>120；暗：<80')+box(345,173,350,75,'圆环 1…9 的亮度取 160','连续亮段提供角点候选证据');
ring+=t(34,297,'只比较两个像素不够，还要看圆环上的连续结构。',17);
V.add('features','FAST','图解 05.1 · 特征检测器到底在图像上找什么',
figure('FAST 的连续亮段测试：从亮度到候选角点',svg(720,332,ring,'中心亮度100，阈值20，16点圆环前9点亮度160的教学测试'),'使用常见 FAST-9/16 结构作教学示意；这里没有实际调用 OpenCV 检测器，也没有演示全部非极大值抑制过程。源码在图像网格内调用 OpenCV FAST。','中心像素亮度100。超过120才算明显更亮，低于80才算明显更暗。例子的圆环1到9连续更亮，所以它能提供一条候选角点证据；真实检测还需按算法类型及非极大值抑制筛选。')+
formula('亮：Iⱼ > I₀ + t　　暗：Iⱼ < I₀ − t',[
['I₀','候选中心的灰度强度；8位灰度图常用0…255。'],['Iⱼ','圆环第j个采样点的灰度，和中心用同一强度标度。'],['t','亮暗差阈值，是强度差，不是像素距离或深度。']
],'把“明显不同的灰度”变成可计算的条件，再检查满足条件的点在圆环上是否形成足够长的连续段。','单个亮度差不是充分条件。具体 FAST 类型、阈值和非极大值抑制共同决定输出。')+
p('纹理角点的价值在于<strong>重新定位容易</strong>，不在于它像“物体几何顶点”。墙上的文字笔画交叉、贴纸纹理也可能是好特征。平坦区域位置不唯一；沿直边移动时外观变化弱，这就是只靠边缘往往难约束沿边运动的直觉。')+
note('对应源码，不靠名字猜','每格先尝试 iniThFAST，格子没有角点时才降低到 minThFAST。得到的还是二维 KeyPoint；三维坐标尚未产生。')+
V.source([], [['OpenCV 官方 FAST 教程','https://docs.opencv.org/4.x/df/d0c/tutorial_py_fast.html']]),
[['src/ORBextractor.cc',803,861]]);
let sample='';
for(let n=0;n<2;n++){const cx=170+n*370,cy=150,angle=n*Math.PI/3;sample+=`<circle cx="${cx}" cy="${cy}" r="99" style="fill:#f4f6f1;stroke:#aabdac"/>`+t(cx,28,n?'纹理旋转后的比较尺':'原纹理与比较尺',16,'middle');const a=[cx-60*Math.cos(angle),cy-60*Math.sin(angle)],b=[cx+60*Math.cos(angle),cy+60*Math.sin(angle)];sample+=edge([a,b])+dot(a[0],a[1],'A')+dot(b[0],b[1],'B');sample+=t(cx,278,'I(A)=50 < I(B)=180 → bit=1',14,'middle');}
sample+=t(355,151,'按 θ 旋转',14,'middle');
V.add('features','方向：','图解 05.2 · ORB 的方向与二进制描述子',
figure('旋转的是采样位置，不是把 IMU 航向塞进描述子',svg(720,313,sample,'两张局部纹理图中的A B亮度比较尺按图像方向旋转'),'图中只画一对亮度测试，假设纹理相应旋转且亮度关系保留。真实 ORB 做256次测试，且方向、噪声、遮挡都会影响重复性。','先估计图像邻域的亮度主方向θ，再旋转比较采样位置A B。比较尺跟随纹理方向，才有机会在相机旋转后仍得到相似的二进制结果。')+
formula('m₁₀ = ∑ u·I(u,v)，m₀₁ = ∑ v·I(u,v)<br>θ = atan2(m₀₁,m₁₀)<br>bit = 1{ I(Aθ) < I(Bθ) }',[
['u、v','相对关键点中心的局部图像坐标，单位像素，不是世界坐标。'],['m₁₀、m₀₁','亮度分布的一阶矩，刻画邻域亮度重心方向。'],['θ','图像纹理主方向。源码 fastAtan2 返回角度，计算采样旋转时转为弧度。'],['Aθ、Bθ','按照θ旋转后的两个预定义测试位置。'],['1{条件}','条件成立取1，否则取0；不是匹配概率。']
],'描述子保存局部亮度比较，不保存XYZ或位姿；把测试结果装进32字节，是256个bit。','公式解释 IC_Angle / computeOrbDescriptor；实际实现包括像素取整、圆形邻域、固定采样模式。光照与视角变化下不保证完全相同。'),
[['src/ORBextractor.cc',75,148],['src/ORBextractor.cc',1086,1168]]);
V.add('features','Hamming','实验 05.3 · 外观相似不等于匹配已经正确',
lab('hamming','数一数到底哪些bit不同',[
['code','候选8位编码的十进制值（0…255）',0,255,1,162]
],'参考编码固定为10110010（十进制178）；滑块只为方便修改候选编码。标出的方格是不同位。正式 ORB 为256位，此处只用8位教学。')+
formula('d_H(A,B)=∑ 1{Aᵢ≠Bᵢ}<br>d_best < τ · d_second',[
['d_H','逐位不同的数量，是整数；实际256位编码的范围是0…256。'],['d_best / d_second','候选描述子中最佳和次佳的距离。'],['τ','区分力比值门槛；不同源码匹配路径可使用不同数值。']
],'第一式判断像不像；第二式进一步判断“最像的是否明显优于另一个”。','还要满足绝对距离、尺度/方向及后续几何条件。距离比值通过不是跟踪成功的充分条件。')+
steps([['有两个都很像的窗格','d_best=24，d_second=26，τ=0.7。24<18.2不成立，虽然24是最小值仍拒绝。'],['有一个明显更好的候选','d_best=24，d_second=55。24<38.5成立，但仍需其余检查。'],['把候选交给几何验证','即便几个描述子相近，若它们无法被同一相机位姿一致投影解释，优化与外点判定仍可能剔除它们。重复纹理不能靠“只取最小距离”可靠解决。']]),
[['src/ORBmatcher.cc',223,330],['src/Tracking.cc',2720,2781],['src/Optimizer.cc',814,900]]);
})();
