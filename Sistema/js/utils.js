// js/utils.js
const Utils = {
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  },

  formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  },

  getCurrentDate() {
    return new Date().toISOString().split('T')[0];
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const iconMap = {
      success: '✓',
      error: '✕',
      info: 'ℹ',
      warning: '⚠'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      margin-bottom: 10px;
      font-weight: 600;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 12px;
      opacity: 0;
      transform: translateX(100px);
      transition: all 0.3s ease;
      border-left: 4px solid ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4895ef'};
    `;
    
    toast.innerHTML = `
      <span style="font-size: 1.2rem; color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#4895ef'};">${iconMap[type]}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    
    setTimeout(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(0)';
    }, 10);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('is-open');
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('is-open');
  }
};

window.Utils = Utils;
console.log('✅ Utils carregado');
