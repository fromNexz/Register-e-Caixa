// js/router.js
function initRouter() {
  const navItems = document.querySelectorAll('.nav-item');
  const views = document.querySelectorAll('.view');

  navItems.forEach(btn => {
    btn.addEventListener('click', () => {
      const viewName = btn.dataset.view;       // "dashboard", "clientes"...
      const targetId = `view-${viewName}`;

      navItems.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      views.forEach(v => v.classList.remove('active'));
      const targetView = document.getElementById(targetId);
      if (targetView) targetView.classList.add('active');
    });
  });
}

