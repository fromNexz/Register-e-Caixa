// js/dashboard.js
//
//    ATUALIZADO PARA RECEBER INDEXEDDB
//              02/02/2026
//@pedro

if (window.Dashboard) {
  console.warn('[!] Dashboard já foi carregado, pulando redeclaração');
} else {
  window.Dashboard = {
    initialized: false,

    init() {
      if (this.initialized) return;
      this.initialized = true;
      ('[+] Módulo Dashboard inicializado');
    },

    async render() {
      this.init();
      await this.updateStats();
      this.updateDate();
    },

    updateDate() {
      const dateDisplay = document.getElementById('current-date-display');
      if (dateDisplay) {
        const now = new Date();
        const options = { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        };
        dateDisplay.textContent = now.toLocaleDateString('pt-BR', options);
      }
    },

    async updateStats() {
      const stats = await window.storage.getEstatisticas();

      // Atualizar DOM
      const elReceita = document.getElementById('dash-receita');
      const elConcluidas = document.getElementById('dash-os-concluidas');
      const elNovosClientes = document.getElementById('dash-novos-clientes');
      const elPendentes = document.getElementById('dash-os-pendentes');

      if (elReceita) elReceita.textContent = Utils.formatCurrency(stats.receitaMes);
      if (elConcluidas) elConcluidas.textContent = stats.osConcluidas;
      if (elNovosClientes) elNovosClientes.textContent = stats.novosClientes;
      if (elPendentes) elPendentes.textContent = stats.osPendentes;
    }
  };

  ('[+] Módulo Dashboard carregado');

  // Renderizar dashboard na inicialização
  document.addEventListener('DOMContentLoaded', async () => {
    setTimeout(async() => {
      await window.Dashboard.render();
    }, 100);
  });
}
