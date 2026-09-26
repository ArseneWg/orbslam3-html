
(() => {
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav.main a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path) a.classList.add('active');
  });
  document.querySelectorAll('[data-copy]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const target = document.querySelector(btn.dataset.copy);
      if(!target) return;
      try {
        await navigator.clipboard.writeText(target.textContent.trim());
        btn.textContent = '已复制';
        setTimeout(() => btn.textContent = '复制', 1200);
      } catch(e) {
        btn.textContent = '复制失败';
      }
    });
  });
})();
