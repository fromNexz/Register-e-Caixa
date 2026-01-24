// js/caixa.js - Sistema de Caixa (Entradas e Saídas)

let filtroAtual = 'todas';

function initCaixa() {
  // Botões de nova entrada/saída
  const btnNovaEntrada = document.getElementById('btn-nova-entrada');
  const btnNovaSaida = document.getElementById('btn-nova-saida');
  
  if (btnNovaEntrada) {
    btnNovaEntrada.addEventListener('click', () => abrirModalCaixa('entrada'));
  }
  
  if (btnNovaSaida) {
    btnNovaSaida.addEventListener('click', () => abrirModalCaixa('saida'));
  }

  // Tabs de filtro
  const tabs = document.querySelectorAll('[data-caixa-filter]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filtroAtual = tab.dataset.caixaFilter;
      renderCaixaTabela();
    });
  });

  // Modal
  const modal = document.getElementById('modal-caixa');
  if (modal) {
    const backdrop = modal.querySelector('.modal__backdrop');
    const btnCancelar = document.getElementById('btn-cancelar-caixa');
    const form = document.getElementById('form-caixa');

    if (backdrop) backdrop.addEventListener('click', fecharModalCaixa);
    if (btnCancelar) btnCancelar.addEventListener('click', fecharModalCaixa);
    if (form) form.addEventListener('submit', salvarMovimento);
  }

  // Criar modal se não existir
  criarModalCaixaSeNecessario();
  
  // Renderizar tabela
  renderCaixaTabela();
  atualizarTotaisCaixa();
}

function criarModalCaixaSeNecessario() {
  if (document.getElementById('modal-caixa')) return;

  const modalHTML = `
    <div id="modal-caixa" class="modal">
      <div class="modal__backdrop"></div>
      <div class="modal__content">
        <header class="modal__header">
          <h2 id="modal-caixa-titulo">Novo Lançamento</h2>
        </header>
        <form id="form-caixa" class="modal__body">
          <input type="hidden" id="caixa-id" />
          <input type="hidden" id="caixa-tipo" />
          
          <label>
            <span class="label-text">Data *</span>
            <input type="date" id="caixa-data" required />
          </label>
          
          <label>
            <span class="label-text">Descrição *</span>
            <input type="text" id="caixa-descricao" placeholder="Ex: Pagamento de serviço" required />
          </label>
          
          <label>
            <span class="label-text">Cliente (opcional)</span>
            <select id="caixa-cliente">
              <option value="">-- Nenhum --</option>
            </select>
          </label>
          
          <label>
            <span class="label-text">Forma de Pagamento</span>
            <select id="caixa-forma-pgto">
              <option value="dinheiro">Dinheiro</option>
              <option value="pix">PIX</option>
              <option value="cartao_credito">Cartão de Crédito</option>
              <option value="cartao_debito">Cartão de Débito</option>
              <option value="transferencia">Transferência</option>
              <option value="boleto">Boleto</option>
              <option value="outro">Outro</option>
            </select>
          </label>
          
          <label>
            <span class="label-text">Valor (R$) *</span>
            <input type="number" step="0.01" min="0.01" id="caixa-valor" placeholder="0,00" required />
          </label>
          
          <label>
            <span class="label-text">Observações</span>
            <textarea id="caixa-observacoes" rows="2" placeholder="Observações adicionais..."></textarea>
          </label>
          
          <footer class="modal__footer">
            <button type="button" class="btn" id="btn-cancelar-caixa">Cancelar</button>
            <button type="submit" class="btn primary" id="btn-salvar-caixa">Salvar</button>
          </footer>
        </form>
      </div>
    </div>
  `;

  document.querySelector('.app').insertAdjacentHTML('beforeend', modalHTML);

  // Adicionar eventos ao novo modal
  const modal = document.getElementById('modal-caixa');
  const backdrop = modal.querySelector('.modal__backdrop');
  const btnCancelar = document.getElementById('btn-cancelar-caixa');
  const form = document.getElementById('form-caixa');

  backdrop.addEventListener('click', fecharModalCaixa);
  btnCancelar.addEventListener('click', fecharModalCaixa);
  form.addEventListener('submit', salvarMovimento);
}

function abrirModalCaixa(tipo, movimento = null) {
  criarModalCaixaSeNecessario();
  
  const modal = document.getElementById('modal-caixa');
  const titulo = document.getElementById('modal-caixa-titulo');
  const btnSalvar = document.getElementById('btn-salvar-caixa');
  const inputTipo = document.getElementById('caixa-tipo');
  const inputId = document.getElementById('caixa-id');
  const inputData = document.getElementById('caixa-data');
  const inputDescricao = document.getElementById('caixa-descricao');
  const selectCliente = document.getElementById('caixa-cliente');
  const selectFormaPgto = document.getElementById('caixa-forma-pgto');
  const inputValor = document.getElementById('caixa-valor');
  const inputObs = document.getElementById('caixa-observacoes');

  // Popular select de clientes
  popularSelectClientes(selectCliente);

  // Definir título e cor baseado no tipo
  if (movimento) {
    titulo.textContent = 'Editar Lançamento';
    inputId.value = movimento.id;
    inputTipo.value = movimento.tipo;
    inputData.value = movimento.data;
    inputDescricao.value = movimento.descricao;
    selectCliente.value = movimento.clienteId || '';
    selectFormaPgto.value = movimento.formaPagamento || 'dinheiro';
    inputValor.value = movimento.valor;
    inputObs.value = movimento.observacoes || '';
    
    btnSalvar.className = movimento.tipo === 'entrada' ? 'btn success' : 'btn danger';
    btnSalvar.textContent = 'Atualizar';
  } else {
    titulo.textContent = tipo === 'entrada' ? 'Nova Entrada' : 'Nova Saída';
    inputId.value = '';
    inputTipo.value = tipo;
    inputData.value = new Date().toISOString().split('T')[0];
    inputDescricao.value = '';
    selectCliente.value = '';
    selectFormaPgto.value = 'dinheiro';
    inputValor.value = '';
    inputObs.value = '';
    
    btnSalvar.className = tipo === 'entrada' ? 'btn success' : 'btn danger';
    btnSalvar.textContent = 'Salvar';
  }

  // Mudar cor do título baseado no tipo
  titulo.style.color = (movimento?.tipo || tipo) === 'entrada' ? '#16a34a' : '#dc2626';

  modal.classList.add('is-open');
}

function fecharModalCaixa() {
  const modal = document.getElementById('modal-caixa');
  if (modal) modal.classList.remove('is-open');
}

function popularSelectClientes(select) {
  if (!select) return;
  
  const currentValue = select.value;
  select.innerHTML = '<option value="">-- Nenhum --</option>';
  
  clientes.forEach(cliente => {
    const option = document.createElement('option');
    option.value = cliente.id;
    option.textContent = cliente.nome;
    select.appendChild(option);
  });
  
  if (currentValue) select.value = currentValue;
}

function salvarMovimento(e) {
  e.preventDefault();

  const id = document.getElementById('caixa-id').value;
  const tipo = document.getElementById('caixa-tipo').value;
  const data = document.getElementById('caixa-data').value;
  const descricao = document.getElementById('caixa-descricao').value.trim();
  const clienteId = document.getElementById('caixa-cliente').value;
  const formaPagamento = document.getElementById('caixa-forma-pgto').value;
  const valor = parseFloat(document.getElementById('caixa-valor').value) || 0;
  const observacoes = document.getElementById('caixa-observacoes').value.trim();

  if (!data || !descricao || valor <= 0) {
    showToast('Preencha todos os campos obrigatórios', 'error');
    return;
  }

  if (id) {
    // Editar existente
    const idx = movimentosCaixa.findIndex(m => m.id === id);
    if (idx !== -1) {
      movimentosCaixa[idx] = {
        ...movimentosCaixa[idx],
        data,
        descricao,
        clienteId: clienteId || null,
        formaPagamento,
        valor,
        observacoes
      };
      showToast('Lançamento atualizado com sucesso!', 'success');
    }
  } else {
    // Novo movimento
    const novoMovimento = {
      id: 'mov_' + Date.now(),
      tipo,
      data,
      descricao,
      clienteId: clienteId || null,
      formaPagamento,
      valor,
      observacoes,
      criadoEm: new Date().toISOString()
    };
    movimentosCaixa.push(novoMovimento);
    showToast(tipo === 'entrada' ? 'Entrada registrada!' : 'Saída registrada!', 'success');
  }

  saveToStorage(STORAGE_KEYS.MOVIMENTOS, movimentosCaixa);
  fecharModalCaixa();
  renderCaixaTabela();
  atualizarTotaisCaixa();
  
  // Atualizar dashboard se existir
  if (typeof atualizarDashboard === 'function') atualizarDashboard();
}

function renderCaixaTabela() {
  const tbody = document.getElementById('caixa-tbody');
  if (!tbody) return;

  // Filtrar e ordenar por data (mais recente primeiro)
  let movimentosFiltrados = [...movimentosCaixa];
  
  if (filtroAtual === 'entrada') {
    movimentosFiltrados = movimentosFiltrados.filter(m => m.tipo === 'entrada');
  } else if (filtroAtual === 'saida') {
    movimentosFiltrados = movimentosFiltrados.filter(m => m.tipo === 'saida');
  }

  movimentosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

  if (movimentosFiltrados.length === 0) {
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="7">
          <div style="display: flex; flex-direction: column; align-items: center; padding: 40px; color: #9ca3af;">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.5; margin-bottom: 12px;">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
              <line x1="1" y1="10" x2="23" y2="10"></line>
            </svg>
            <p style="margin: 0; font-size: 1rem; color: #6b7280;">Nenhuma transação encontrada</p>
            <span style="font-size: 0.85rem; margin-top: 4px;">Clique em "Nova Entrada" ou "Nova Saída" para começar</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = movimentosFiltrados.map(mov => {
    const cliente = mov.clienteId ? clientes.find(c => c.id === mov.clienteId) : null;
    const clienteNome = cliente ? cliente.nome : '-';
    const dataFormatada = formatarData(mov.data);
    const valorFormatado = formatarMoeda(mov.valor);
    const formaPgto = formatarFormaPagamento(mov.formaPagamento);
    
    const tipoClass = mov.tipo === 'entrada' ? 'tipo-entrada' : 'tipo-saida';
    const tipoLabel = mov.tipo === 'entrada' ? 'Entrada' : 'Saída';
    const valorClass = mov.tipo === 'entrada' ? 'valor-entrada' : 'valor-saida';

    return `
      <tr data-id="${mov.id}">
        <td>${dataFormatada}</td>
        <td>
          <span class="tipo-badge ${tipoClass}">
            ${tipoLabel}
          </span>
        </td>
        <td>${escapeHtml(mov.descricao)}</td>
        <td>${escapeHtml(clienteNome)}</td>
        <td>${formaPgto}</td>
        <td class="${valorClass}">${mov.tipo === 'entrada' ? '+' : '-'} ${valorFormatado}</td>
        <td class="col-acoes">
          <div class="acoes-btns">
            <button class="btn-acao btn-editar" onclick="editarMovimento('${mov.id}')" title="Editar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
            <button class="btn-acao btn-excluir" onclick="excluirMovimento('${mov.id}')" title="Excluir">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function editarMovimento(id) {
  const movimento = movimentosCaixa.find(m => m.id === id);
  if (movimento) {
    abrirModalCaixa(movimento.tipo, movimento);
  }
}

function excluirMovimento(id) {
  if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

  const idx = movimentosCaixa.findIndex(m => m.id === id);
  if (idx !== -1) {
    movimentosCaixa.splice(idx, 1);
    saveToStorage(STORAGE_KEYS.MOVIMENTOS, movimentosCaixa);
    renderCaixaTabela();
    atualizarTotaisCaixa();
    showToast('Lançamento excluído!', 'success');
    
    if (typeof atualizarDashboard === 'function') atualizarDashboard();
  }
}

function atualizarTotaisCaixa() {
  const totalEntradas = movimentosCaixa
    .filter(m => m.tipo === 'entrada')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const totalSaidas = movimentosCaixa
    .filter(m => m.tipo === 'saida')
    .reduce((sum, m) => sum + (m.valor || 0), 0);

  const saldo = totalEntradas - totalSaidas;

  const elEntradas = document.getElementById('caixa-total-entradas');
  const elSaidas = document.getElementById('caixa-total-saidas');
  const elSaldo = document.getElementById('caixa-saldo');

  if (elEntradas) elEntradas.textContent = formatarMoeda(totalEntradas);
  if (elSaidas) elSaidas.textContent = formatarMoeda(totalSaidas);
  if (elSaldo) {
    elSaldo.textContent = formatarMoeda(saldo);
    elSaldo.style.color = saldo >= 0 ? '#16a34a' : '#dc2626';
  }
}

// Funções utilitárias
function formatarData(dataStr) {
  if (!dataStr) return '-';
  const [ano, mes, dia] = dataStr.split('-');
  return `${dia}/${mes}/${ano}`;
}

function formatarMoeda(valor) {
  return 'R$ ' + (valor || 0).toLocaleString('pt-BR', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
}

function formatarFormaPagamento(forma) {
  const formas = {
    'dinheiro': 'Dinheiro',
    'pix': 'PIX',
    'cartao_credito': 'Cartão Crédito',
    'cartao_debito': 'Cartão Débito',
    'transferencia': 'Transferência',
    'boleto': 'Boleto',
    'outro': 'Outro'
  };
  return formas[forma] || forma || '-';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
