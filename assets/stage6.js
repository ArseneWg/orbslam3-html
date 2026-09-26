(() => {
 const root=document.querySelector('[data-stage6]'); if(!root)return;
 const search=root.querySelector('[data-search]');
 const rows=[...root.querySelectorAll('[data-search-row]')];
 search.addEventListener('input',()=>{
   const q=search.value.trim().toLowerCase();
   rows.forEach(r=>r.style.display=!q||r.textContent.toLowerCase().includes(q)?'':'none');
 });
 root.querySelectorAll('[data-debug]').forEach(btn=>btn.addEventListener('click',()=>{
   const key=btn.dataset.debug;
   root.querySelectorAll('[data-debug-panel]').forEach(p=>p.hidden=p.dataset.debugPanel!==key);
 }));
 root.querySelectorAll('[data-quiz]').forEach(box=>{
   box.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{
     const ok=b.dataset.correct==='1';
     box.querySelector('.quiz-feedback').textContent=ok?'正确。继续对照源码锚点理解原因。':'不对。查看本题下方的源码提示后再试。';
     box.querySelector('.quiz-feedback').style.color=ok?'#8cffb7':'#ffd166';
   }));
 });
})();