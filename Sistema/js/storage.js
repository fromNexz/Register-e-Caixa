// js/storage.js
const STORAGE_KEYS = {
  CLIENTES: 'om_clientes',
  OS: 'om_ordens_servico',
  PARCELAS: 'om_parcelas',
  MOVIMENTOS: 'om_movimentos_caixa'
};

function loadFromStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];
  }
}

function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// coleções em memória
let clientes = loadFromStorage(STORAGE_KEYS.CLIENTES);
let ordensServico = loadFromStorage(STORAGE_KEYS.OS);
let parcelas = loadFromStorage(STORAGE_KEYS.PARCELAS);
let movimentosCaixa = loadFromStorage(STORAGE_KEYS.MOVIMENTOS);

// função utilitária para salvar tudo quando necessário
function persistAll() {
  saveToStorage(STORAGE_KEYS.CLIENTES, clientes);
  saveToStorage(STORAGE_KEYS.OS, ordensServico);
  saveToStorage(STORAGE_KEYS.PARCELAS, parcelas);
  saveToStorage(STORAGE_KEYS.MOVIMENTOS, movimentosCaixa);
}

// Sistema de notificações toast
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Container de toast não encontrado');
        return;
    }
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icon = type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ';
    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Animação de entrada
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // Remover após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            container.removeChild(toast);
        }, 300);
    }, 3000);
}
