/* Shared entry for all existing pages. The original HTML remains the no-JS fallback. */
(() => {
 'use strict';
 // Remove decorative canvases before legacy mini3d.js starts an animation loop.
 document.querySelectorAll('.mini3d').forEach(el=>el.remove());
 const base=new URL('.',document.currentScript.src);
 const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('book.css',base).href;
 document.head.appendChild(css);
 const load=name=>new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=new URL(name,base).href;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});
 load('book-data.js').then(()=>load('book-examples.js')).then(()=>load('book.js')).catch(()=>{
  const n=document.createElement('p');n.textContent='新版阅读资源未能加载，当前是旧版静态备份。请保留完整 assets 目录，并用本地 HTTP 服务打开新版。';n.setAttribute('role','alert');document.body.prepend(n);
 });
})();
