// js/os.js - Módulo de Ordens de Serviço Redesenhado

// Utilidades
function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addMonthsISO(dateISO, months) {
  const d = new Date(dateISO);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function formatCurrency(v) {
  return `R$ ${Number(v || 0).toFixed(2).replace('.', ',')}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusLabel(status) {
  const labels = {
    'aberto': 'Aberto',
    'em_andamento': 'Em andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado'
  };
  return labels[status] || status;
}

// Atualiza contadores do resumo
function atualizarContadoresOS() {
  const totalEl = document.getElementById('os-total-count');
  const openEl = document.getElementById('os-open-count');
  const progressEl = document.getElementById('os-progress-count');
  const doneEl = document.getElementById('os-done-count');

  if (totalEl) totalEl.textContent = ordensServico.length;
  if (openEl) openEl.textContent = ordensServico.filter(os => os.status === 'aberto').length;
  if (progressEl) progressEl.textContent = ordensServico.filter(os => os.status === 'em_andamento').length;
  if (doneEl) doneEl.textContent = ordensServico.filter(os => os.status === 'concluido').length;
}

// Calcula status de pagamento de uma OS
function calcularStatusPagamento(osId) {
  const parcelasOS = parcelas.filter(p => p.osId === osId);
  if (parcelasOS.length === 0) return { status: 'pending', label: 'Sem parcelas', paid: 0, total: 0 };

  const totalParcelas = parcelasOS.length;
  const parcelasPagas = parcelasOS.filter(p => p.dataPagamento).length;

  if (parcelasPagas === 0) {
    return { status: 'pending', label: `0/${totalParcelas} pagas`, paid: 0, total: totalParcelas };
  } else if (parcelasPagas === totalParcelas) {
    return { status: 'paid', label: 'Pago', paid: parcelasPagas, total: totalParcelas };
  } else {
    return { status: 'partial', label: `${parcelasPagas}/${totalParcelas} pagas`, paid: parcelasPagas, total: totalParcelas };
  }
}

// Preenche select de clientes
function preencherSelectClientesOS() {
  const select = document.getElementById('os-cliente-id');
  if (!select) return;

  select.innerHTML = '<option value="">Selecione um cliente...</option>';

  clientes.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.nome;
    select.appendChild(opt);
  });
}

// Auto-preenche veículo ao selecionar cliente
function ligarPreenchimentoVeiculoAutomatico() {
  const select = document.getElementById('os-cliente-id');
  const inputVeiculo = document.getElementById('os-veiculo');
  if (!select || !inputVeiculo) return;

  select.addEventListener('change', () => {
    const cliente = clientes.find(c => c.id === select.value);
    if (!cliente) {
      inputVeiculo.value = '';
      return;
    }

    const partes = [];
    if (cliente.veiculoModelo) partes.push(cliente.veiculoModelo);
    if (cliente.veiculoAno) partes.push(cliente.veiculoAno);
    if (cliente.veiculoPlaca) partes.push(cliente.veiculoPlaca);

    inputVeiculo.value = partes.join(' - ');
  });
}

// Atualiza total das parcelas no header
function atualizarTotalParcelas() {
  const container = document.getElementById('os-parcelas-tbody');
  const totalEl = document.getElementById('os-parcelas-total');
  if (!container || !totalEl) return;

  const inputs = container.querySelectorAll('.os-parcela-value');
  let total = 0;
  inputs.forEach(input => {
    total += Number(input.value || 0);
  });

  totalEl.textContent = `Total: ${formatCurrency(total)}`;
}

// Gera parcelas no modal
function gerarParcelasParaModal() {
  const valorTotal = Number(document.getElementById('os-valor-total').value || 0);
  const numParcelas = Number(document.getElementById('os-numero-parcelas').value || 1);
  const dataPrimeira = document.getElementById('os-data-primeira-parcela').value || todayISO();
  const container = document.getElementById('os-parcelas-tbody');

  if (!container) return;

  if (valorTotal <= 0) {
    showToast('Informe o valor total da OS.', 'error');
    return;
  }

  if (numParcelas <= 0 || numParcelas > 48) {
    showToast('Número de parcelas deve ser entre 1 e 48.', 'error');
    return;
  }

  const totalCent = Math.round(valorTotal * 100);
  const base = Math.floor(totalCent / numParcelas);
  const resto = totalCent - base * numParcelas;

  container.innerHTML = '';

  for (let i = 0; i < numParcelas; i++) {
    let valorParcelaCent = base;
    if (i === numParcelas - 1) valorParcelaCent += resto;
    const valorParcela = (valorParcelaCent / 100).toFixed(2);
    const dataVenc = addMonthsISO(dataPrimeira, i);

    const item = document.createElement('div');
    item.className = 'os-parcela-item';
    item.innerHTML = `
      <span class="os-parcela-num">${i + 1}</span>
      <input type="date" class="os-parcela-date" value="${dataVenc}" />
      <input type="number" step="0.01" class="os-parcela-value" value="${valorParcela}" />
      <div class="os-parcela-checkbox">
        <input type="checkbox" class="os-parcela-pago" title="Marcar como pago" />
      </div>
      <input type="date" class="os-parcela-pay-date" disabled />
      <select class="os-parcela-forma" disabled>
        <option value="">Forma pgto</option>
        <option value="pix">Pix</option>
        <option value="debito">Débito</option>
        <option value="credito">Crédito</option>
        <option value="boleto">Boleto</option>
        <option value="dinheiro">Dinheiro</option>
        <option value="outro">Outro</option>
      </select>
    `;
    container.appendChild(item);

    // Event listeners
    const chk = item.querySelector('.os-parcela-pago');
    const dtPag = item.querySelector('.os-parcela-pay-date');
    const forma = item.querySelector('.os-parcela-forma');
    const valorInput = item.querySelector('.os-parcela-value');

    chk.addEventListener('change', () => {
      const on = chk.checked;
      dtPag.disabled = !on;
      forma.disabled = !on;
      if (on && !dtPag.value) dtPag.value = todayISO();
      item.classList.toggle('os-parcela-item--paid', on);
    });

    valorInput.addEventListener('input', atualizarTotalParcelas);
  }

  atualizarTotalParcelas();
  showToast(`${numParcelas} parcela(s) gerada(s)!`, 'success');
}

// Carrega parcelas existentes no modal
function carregarParcelasOSNoModal(osId) {
  const container = document.getElementById('os-parcelas-tbody');
  if (!container) return;

  container.innerHTML = '';

  const parcelasOS = parcelas
    .filter(p => p.osId === osId)
    .sort((a, b) => a.numeroParcela - b.numeroParcela);

  if (!parcelasOS.length) {
    container.innerHTML = `
      <div class="os-parcela-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <p>Nenhuma parcela gerada</p>
        <span>Preencha o valor e clique em "Gerar"</span>
      </div>
    `;
    atualizarTotalParcelas();
    return;
  }

  parcelasOS.forEach(p => {
    const isPaid = !!p.dataPagamento;
    const item = document.createElement('div');
    item.className = `os-parcela-item ${isPaid ? 'os-parcela-item--paid' : ''}`;
    item.innerHTML = `
      <span class="os-parcela-num">${p.numeroParcela}</span>
      <input type="date" class="os-parcela-date" value="${p.dataVencimento}" />
      <input type="number" step="0.01" class="os-parcela-value" value="${p.valorParcela}" />
      <div class="os-parcela-checkbox">
        <input type="checkbox" class="os-parcela-pago" ${isPaid ? 'checked' : ''} title="Marcar como pago" />
      </div>
      <input type="date" class="os-parcela-pay-date" ${isPaid ? '' : 'disabled'} value="${p.dataPagamento || ''}" />
      <select class="os-parcela-forma" ${isPaid ? '' : 'disabled'}>
        <option value="">Forma pgto</option>
        <option value="pix">Pix</option>
        <option value="debito">Débito</option>
        <option value="credito">Crédito</option>
        <option value="boleto">Boleto</option>
        <option value="dinheiro">Dinheiro</option>
        <option value="outro">Outro</option>
      </select>
    `;
    container.appendChild(item);

    // Set forma pagamento
    const formaSelect = item.querySelector('.os-parcela-forma');
    if (p.formaPagamento) formaSelect.value = p.formaPagamento;

    // Event listeners
    const chk = item.querySelector('.os-parcela-pago');
    const dtPag = item.querySelector('.os-parcela-pay-date');
    const forma = item.querySelector('.os-parcela-forma');
    const valorInput = item.querySelector('.os-parcela-value');

    chk.addEventListener('change', () => {
      const on = chk.checked;
      dtPag.disabled = !on;
      forma.disabled = !on;
      if (on && !dtPag.value) dtPag.value = todayISO();
      item.classList.toggle('os-parcela-item--paid', on);
    });

    valorInput.addEventListener('input', atualizarTotalParcelas);
  });

  atualizarTotalParcelas();
}

// Abre modal de OS
function abrirModalOS(os) {
  const modal = document.getElementById('modal-os');
  const titulo = document.getElementById('modal-os-titulo');
  const numeroBadge = document.getElementById('os-numero-display');
  const form = document.getElementById('form-os');

  preencherSelectClientesOS();
  ligarPreenchimentoVeiculoAutomatico();

  if (os) {
    titulo.textContent = 'Editar Ordem de Serviço';
    numeroBadge.textContent = `OS #${os.numero}`;
    document.getElementById('os-id').value = os.id;
    document.getElementById('os-cliente-id').value = os.clienteId;
    document.getElementById('os-veiculo').value = os.veiculo || '';
    document.getElementById('os-data-abertura').value = os.dataAbertura;
    document.getElementById('os-status').value = os.status;
    document.getElementById('os-descricao').value = os.descricao || '';
    document.getElementById('os-valor-total').value = os.valorTotal || '';
    document.getElementById('os-numero-parcelas').value = os.qtdParcelas || 1;
    document.getElementById('os-data-primeira-parcela').value = os.dataPrimeiraParcela || todayISO();

    carregarParcelasOSNoModal(os.id);
  } else {
    titulo.textContent = 'Nova Ordem de Serviço';
    numeroBadge.textContent = '';
    form.reset();
    document.getElementById('os-id').value = '';
    document.getElementById('os-data-abertura').value = todayISO();
    document.getElementById('os-status').value = 'aberto';
    document.getElementById('os-numero-parcelas').value = 1;
    document.getElementById('os-data-primeira-parcela').value = todayISO();

    const container = document.getElementById('os-parcelas-tbody');
    container.innerHTML = `
      <div class="os-parcela-empty">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
          <line x1="1" y1="10" x2="23" y2="10"></line>
        </svg>
        <p>Nenhuma parcela gerada</p>
        <span>Preencha o valor e clique em "Gerar"</span>
      </div>
    `;
    document.getElementById('os-parcelas-total').textContent = 'Total: R$ 0,00';
  }

  modal.classList.add('is-open');
}

// Fecha modal OS
function fecharModalOS() {
  const modal = document.getElementById('modal-os');
  modal.classList.remove('is-open');
}

// Salva OS
function salvarOS(e) {
  e.preventDefault();

  const id = document.getElementById('os-id').value || crypto.randomUUID();
  const clienteId = document.getElementById('os-cliente-id').value;
  const cliente = clientes.find(c => c.id === clienteId);
  const veiculo = document.getElementById('os-veiculo').value.trim();
  const dataAbertura = document.getElementById('os-data-abertura').value || todayISO();
  const status = document.getElementById('os-status').value;
  const descricao = document.getElementById('os-descricao').value.trim();
  const valorTotal = Number(document.getElementById('os-valor-total').value || 0);
  const qtdParcelas = Number(document.getElementById('os-numero-parcelas').value || 1);
  const dataPrimeiraParcela = document.getElementById('os-data-primeira-parcela').value || todayISO();

  if (!clienteId) {
    showToast('Selecione um cliente para a OS.', 'error');
    return;
  }

  let numeroOS;
  const existente = ordensServico.find(o => o.id === id);
  if (existente) {
    numeroOS = existente.numero;
  } else {
    numeroOS = (ordensServico[ordensServico.length - 1]?.numero || 0) + 1;
  }

  const os = {
    id,
    numero: numeroOS,
    clienteId,
    veiculo,
    dataAbertura,
    status,
    descricao,
    valorTotal,
    qtdParcelas,
    dataPrimeiraParcela
  };

  // Se for edição, limpar parcelas e entradas anteriores
  if (existente) {
    const idx = ordensServico.findIndex(o => o.id === id);
    ordensServico[idx] = os;
    parcelas = parcelas.filter(p => p.osId !== id);
    movimentosCaixa = movimentosCaixa.filter(m => !(m.osId === id && m.tipo === 'entrada'));
  } else {
    ordensServico.push(os);
  }

  // Ler parcelas do modal
  const container = document.getElementById('os-parcelas-tbody');
  const items = Array.from(container.querySelectorAll('.os-parcela-item'));

  items.forEach((item, index) => {
    const numeroParcela = index + 1;
    const dataVenc = item.querySelector('.os-parcela-date').value || todayISO();
    const valorParc = Number(item.querySelector('.os-parcela-value').value || 0);
    const pago = item.querySelector('.os-parcela-pago').checked;
    const dataPag = item.querySelector('.os-parcela-pay-date').value || null;
    const forma = item.querySelector('.os-parcela-forma').value || null;

    const parc = {
      id: crypto.randomUUID(),
      osId: id,
      clienteId,
      numeroParcela,
      valorParcela: valorParc,
      dataVencimento: dataVenc,
      dataPagamento: pago && dataPag ? dataPag : null,
      formaPagamento: pago && forma ? forma : null
    };
    parcelas.push(parc);

    // Se paga, lança entrada no caixa
    if (parc.dataPagamento && parc.formaPagamento) {
      movimentosCaixa.push({
        id: crypto.randomUUID(),
        tipo: 'entrada',
        osId: id,
        clienteId,
        descricao: `Parc. ${numeroParcela} OS #${numeroOS} - ${cliente?.nome || ''}`,
        data: parc.dataPagamento,
        valor: valorParc,
        formaPagamento: parc.formaPagamento,
        observacoes: ''
      });
    }
  });

  persistAll();
  fecharModalOS();
  renderOSTabela();
  atualizarContadoresOS();
  
  if (typeof renderClientesTabela === 'function') renderClientesTabela();
  if (typeof renderCaixa === 'function') renderCaixa();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();

  showToast('Ordem de serviço salva com sucesso!', 'success');
}

// Renderiza tabela de OS
function renderOSTabela() {
  const tbody = document.getElementById('os-tbody');
  const inputBusca = document.getElementById('os-busca');
  const filtroStatus = document.getElementById('os-filtro-status');
  
  if (!tbody) return;

  const termo = (inputBusca?.value || '').toLowerCase().trim();
  const statusFiltro = filtroStatus?.value || '';

  tbody.innerHTML = '';

  let lista = ordensServico.filter(os => {
    // Filtro de busca
    if (termo) {
      const cliente = clientes.find(c => c.id === os.clienteId);
      const texto = `${os.numero} ${cliente?.nome || ''} ${os.veiculo || ''}`.toLowerCase();
      if (!texto.includes(termo)) return false;
    }
    
    // Filtro de status
    if (statusFiltro && os.status !== statusFiltro) return false;
    
    return true;
  });

  if (!lista.length) {
    tbody.innerHTML = `
      <tr class="os-empty-row">
        <td colspan="8">
          <div class="os-empty-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="12" y1="18" x2="12" y2="12"></line>
              <line x1="9" y1="15" x2="15" y2="15"></line>
            </svg>
            <p>Nenhuma ordem de serviço encontrada</p>
            <span>Clique em "Nova OS" para criar a primeira</span>
          </div>
        </td>
      </tr>
    `;
    return;
  }

  // Ordenar por número (mais recente primeiro)
  lista.sort((a, b) => b.numero - a.numero);

  lista.forEach(os => {
    const cliente = clientes.find(c => c.id === os.clienteId);
    const pagamento = calcularStatusPagamento(os.id);
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td class="os-numero-cell">#${os.numero}</td>
      <td>${formatDate(os.dataAbertura)}</td>
      <td>${cliente?.nome || '-'}</td>
      <td>${os.veiculo || '-'}</td>
      <td><strong>${formatCurrency(os.valorTotal)}</strong></td>
      <td>
        <span class="os-payment-badge os-payment-badge--${pagamento.status}">
          ${pagamento.status === 'paid' ? '✓' : ''} ${pagamento.label}
        </span>
      </td>
      <td>
        <span class="os-status-badge os-status-badge--${os.status}">
          ${getStatusLabel(os.status)}
        </span>
      </td>
      <td>
        <div class="os-actions">
          <button class="os-action-btn os-action-btn--view" data-view-os="${os.id}" title="Ver detalhes">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="os-action-btn os-action-btn--edit" data-edit-os="${os.id}" title="Editar">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Event listeners para botões
  tbody.querySelectorAll('[data-edit-os]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editOs;
      const os = ordensServico.find(o => o.id === id);
      if (os) abrirModalOS(os);
    });
  });

  tbody.querySelectorAll('[data-view-os]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.viewOs;
      const os = ordensServico.find(o => o.id === id);
      if (os) abrirModalDetalhesOS(os);
    });
  });
}

// Modal de detalhes da OS
function abrirModalDetalhesOS(os) {
  const modal = document.getElementById('modal-os-detalhes');
  const numeroBadge = document.getElementById('os-det-numero');
  const content = document.getElementById('os-details-content');
  
  if (!modal || !content) return;

  const cliente = clientes.find(c => c.id === os.clienteId);
  const parcelasOS = parcelas.filter(p => p.osId === os.id).sort((a, b) => a.numeroParcela - b.numeroParcela);
  const pagamento = calcularStatusPagamento(os.id);

  numeroBadge.textContent = `OS #${os.numero}`;

  let parcelasHTML = '';
  if (parcelasOS.length > 0) {
    parcelasHTML = parcelasOS.map(p => `
      <div class="os-parcela-item ${p.dataPagamento ? 'os-parcela-item--paid' : ''}">
        <span class="os-parcela-num">${p.numeroParcela}</span>
        <span>${formatDate(p.dataVencimento)}</span>
        <span><strong>${formatCurrency(p.valorParcela)}</strong></span>
        <span>${p.dataPagamento ? '✓ Pago' : 'Pendente'}</span>
        <span>${p.dataPagamento ? formatDate(p.dataPagamento) : '-'}</span>
        <span>${p.formaPagamento || '-'}</span>
      </div>
    `).join('');
  } else {
    parcelasHTML = '<p style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma parcela registrada</p>';
  }

  content.innerHTML = `
    <div class="os-details-grid">
      <div class="os-detail-item">
        <span class="os-detail-label">Cliente</span>
        <span class="os-detail-value">${cliente?.nome || '-'}</span>
      </div>
      <div class="os-detail-item">
        <span class="os-detail-label">Veículo</span>
        <span class="os-detail-value">${os.veiculo || '-'}</span>
      </div>
      <div class="os-detail-item">
        <span class="os-detail-label">Data de Abertura</span>
        <span class="os-detail-value">${formatDate(os.dataAbertura)}</span>
      </div>
      <div class="os-detail-item">
        <span class="os-detail-label">Status</span>
        <span class="os-detail-value">
          <span class="os-status-badge os-status-badge--${os.status}">${getStatusLabel(os.status)}</span>
        </span>
      </div>
      <div class="os-detail-item">
        <span class="os-detail-label">Valor Total</span>
        <span class="os-detail-value" style="font-size: 1.2rem; color: #059669;">${formatCurrency(os.valorTotal)}</span>
      </div>
      <div class="os-detail-item">
        <span class="os-detail-label">Pagamento</span>
        <span class="os-detail-value">
          <span class="os-payment-badge os-payment-badge--${pagamento.status}">${pagamento.label}</span>
        </span>
      </div>
    </div>
    
    ${os.descricao ? `
      <div class="os-details-section">
        <h4>Descrição do Serviço</h4>
        <p style="color: #374151; line-height: 1.6;">${os.descricao}</p>
      </div>
    ` : ''}
    
    <div class="os-details-section">
      <h4>Parcelas (${parcelasOS.length})</h4>
      <div class="os-parcelas-container" style="margin-top: 0;">
        <div class="os-parcelas-header">
          <span>#</span>
          <span>Vencimento</span>
          <span>Valor</span>
          <span>Status</span>
          <span>Data Pgto</span>
          <span>Forma</span>
        </div>
        <div class="os-parcelas-list">
          ${parcelasHTML}
        </div>
      </div>
    </div>
  `;

  // Guardar ID da OS atual para o botão editar
  modal.dataset.currentOsId = os.id;
  modal.classList.add('is-open');
}

function fecharModalDetalhesOS() {
  const modal = document.getElementById('modal-os-detalhes');
  if (modal) modal.classList.remove('is-open');
}

// Inicialização
function initOS() {
  const btnNovaOS = document.getElementById('btn-nova-os');
  const btnCancelarOS = document.getElementById('btn-cancelar-os');
  const btnCloseOS = document.getElementById('btn-close-os');
  const btnGerarParcelas = document.getElementById('btn-gerar-parcelas');
  const modal = document.getElementById('modal-os');
  const backdrop = modal?.querySelector('.modal__backdrop');
  const form = document.getElementById('form-os');
  const inputBusca = document.getElementById('os-busca');
  const filtroStatus = document.getElementById('os-filtro-status');

  // Modal de detalhes
  const modalDet = document.getElementById('modal-os-detalhes');
  const backdropDet = modalDet?.querySelector('.modal__backdrop');
  const btnCloseDet = document.getElementById('btn-close-os-det');
  const btnFecharDet = document.getElementById('btn-fechar-os-det');
  const btnEditarDet = document.getElementById('btn-editar-os-det');

  // Event listeners - Modal principal
  if (btnNovaOS) btnNovaOS.addEventListener('click', () => abrirModalOS(null));
  if (btnCancelarOS) btnCancelarOS.addEventListener('click', fecharModalOS);
  if (btnCloseOS) btnCloseOS.addEventListener('click', fecharModalOS);
  if (backdrop) backdrop.addEventListener('click', fecharModalOS);
  if (btnGerarParcelas) btnGerarParcelas.addEventListener('click', gerarParcelasParaModal);
  if (form) form.addEventListener('submit', salvarOS);
  if (inputBusca) inputBusca.addEventListener('input', renderOSTabela);
  if (filtroStatus) filtroStatus.addEventListener('change', renderOSTabela);

  // Event listeners - Modal detalhes
  if (backdropDet) backdropDet.addEventListener('click', fecharModalDetalhesOS);
  if (btnCloseDet) btnCloseDet.addEventListener('click', fecharModalDetalhesOS);
  if (btnFecharDet) btnFecharDet.addEventListener('click', fecharModalDetalhesOS);
  if (btnEditarDet) {
    btnEditarDet.addEventListener('click', () => {
      const osId = modalDet.dataset.currentOsId;
      const os = ordensServico.find(o => o.id === osId);
      if (os) {
        fecharModalDetalhesOS();
        abrirModalOS(os);
      }
    });
  }

  // Render inicial
  renderOSTabela();
  atualizarContadoresOS();
}
