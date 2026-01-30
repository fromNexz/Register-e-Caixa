// js/router.js
class Router {
  constructor() {
    this.currentView = 'dashboard';
    this.init();
  }

  init() {
    // Configurar listeners dos botões de navegação
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

    console.log('✅ Router inicializado');
  }

  navigateTo(viewName) {
    console.log(`🔄 Navegando para: ${viewName}`);
    
    // Remover active de todas as views e nav-links
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));

    // Ativar view e nav-link corretos
    const view = document.getElementById(`view-${viewName}`);
    const navLink = document.querySelector(`[data-view="${viewName}"]`);

    if (view) {
      view.classList.add('active');
      console.log(`✅ View ${viewName} ativada`);
    } else {
      console.error(`❌ View ${viewName} não encontrada`);
    }
    
    if (navLink) {
      navLink.classList.add('active');
    }

    this.currentView = viewName;

    // Chamar função de inicialização da view
    this.onViewChange(viewName);
  }

  onViewChange(viewName) {
    // Chamar função específica de cada módulo quando a view é ativada
    switch (viewName) {
      case 'dashboard':
        if (window.Dashboard) window.Dashboard.render();
        break;
      case 'clientes':
        if (window.Clientes) window.Clientes.render();
        break;
      case 'os':
        if (window.OS) window.OS.render();
        break;
      case 'caixa':
        if (window.Caixa) window.Caixa.render();
        break;
    }
  }
}

// Inicializar router quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.router = new Router();
  });
} else {
  window.router = new Router();
}

console.log('✅ Router carregado');
