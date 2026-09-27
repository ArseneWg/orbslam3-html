/* Preserve the approved reader; visual stories lead into the full source reference. */
(() => {
'use strict';
document.querySelectorAll('.mini3d').forEach(el=>el.remove());
const base=new URL('.',document.currentScript.src);
for(const name of ['book.css','chapters/deep.css','visuals/visual.css','story/story.css']){const css=document.createElement('link');css.rel='stylesheet';css.href=new URL(name,base).href;document.head.appendChild(css);}
const load=name=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(name,base).href;s.onload=resolve;s.onerror=()=>reject(Error('Could not load '+name));document.head.appendChild(s);});
load('book-data.js').then(()=>load('book-examples.js')).then(()=>load('chapters/runtime.js'))
.then(()=>Promise.all(window.ORB_BOOK.chapters.map(c=>load('chapters/'+c.id+'.js'))))
.then(()=>load('visuals/runtime.js')).then(()=>load('visuals/index.js')).then(()=>window.ORB_VISUALS.ready)
.then(()=>load('story/engine.js')).then(()=>load('story/renderers.js')).then(()=>load('story/enhancements.js')).then(()=>load('story/index.js')).then(()=>window.ORB_STORY.ready)
.then(()=>load('book.js')).then(()=>{window.ORB_DEEP.mount();window.ORB_VISUALS.mount();window.ORB_STORY.mount();}).catch(error=>{
console.error(error);const n=document.createElement('p');n.textContent='章节资源未能完整加载。请 git pull，保留整个 assets 目录并强制刷新；推荐从本地 HTTP 服务访问。';n.setAttribute('role','alert');document.body.prepend(n);
});
})();
