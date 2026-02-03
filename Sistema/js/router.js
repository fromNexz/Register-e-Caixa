// js/router.js
class Router {
  constructor() {
    this.currentView = 'dashboard';
    this.init();
  }

  init() {
    
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.getAttribute('data-view');
        if (view) {
          this.navigateTo(view);
        }
      });
    });

    console.log('[+] Router inicializado');
  }

  navigateTo(viewName) {
    console.log(`[=] Navegando para: ${viewName}`);

    
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    
    const view = document.getElementById(`view-${viewName}`);
    const navLink = document.querySelector(`[data-view="${viewName}"]`);

    if (view) {
      view.classList.add('active');
      console.log(`[+] View ${viewName} ativada`);
    } else {
      console.error(`[-] View ${viewName} não encontrada`);
    }

    if (navLink) {
      navLink.classList.add('active');
    }

    this.currentView = viewName;

    this.onViewChange(viewName);
  }

  async onViewChange(viewName) {
    switch (viewName) {
      case 'dashboard':
        if (window.Dashboard) await window.Dashboard.render();
        if (window.Relatorios) await window.Relatorios.updateDashboardCards(); 
        break;
      case 'clientes':
        if (window.Clientes) await window.Clientes.render();
        break;
      case 'os':
        if (window.OS) await window.OS.render();
        break;
      case 'caixa':
        if (window.Caixa) await window.Caixa.render();
        break;
      case 'relatorios':
        if (window.Relatorios) await window.Relatorios.init();
        break;
    }
  }

}


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
  });
} else {
  window.router = new Router();
}

console.log('[+] Router carregado')