// js/main.js
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;

  container.appendChild(toast);

  // animação de entrada
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // remover depois de alguns segundos
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 200);
  }, 3000);
}


window.addEventListener('DOMContentLoaded', () => {
  initRouter();
  initClientes();
  initDetalhesClienteModal();
  renderClientesTabela();
  initOS();
  if (typeof initCaixa === 'function') initCaixa();
  if (typeof initRelatorios === 'function') initRelatorios();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();
});

