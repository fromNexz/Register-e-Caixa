// js/clientes.js

// Função para gerar ID sequencial para cliente
function gerarIdCliente() {
  if (!clientes || clientes.length === 0) {
    return '#01';
  }
  const numeros = clientes.map(c => {
    const match = c.idSequencial ? c.idSequencial.match(/\d+/) : null;
    return match ? parseInt(match[0]) : 0;
  });
  const proximoNum = Math.max(...numeros) + 1;
  return '#' + String(proximoNum).padStart(2, '0');
}

function statusCliente(clienteId) {
  const hoje = new Date().toISOString().slice(0, 10);
  const parcelasCliente = parcelas.filter(p => p.clienteId === clienteId);
  let temAtraso = false;
  let temPendente = false;

  parcelasCliente.forEach(p => {
    if (!p.dataPagamento) {
      if (p.dataVencimento < hoje) temAtraso = true;
      else temPendente = true;
    }
  });

  if (temAtraso) return { tipo: 'atraso', label: 'Parcelas em atraso' };
  if (temPendente) return { tipo: 'pendente', label: 'Parcelas pendentes' };
  return { tipo: 'ok', label: 'Sem pendências' };
}

function renderClientesTabela() {
  const tbody = document.getElementById('clientes-tbody');
  const termo = document.getElementById('clientes-busca').value.toLowerCase().trim();
  tbody.innerHTML = '';

  const listaFiltrada = clientes.filter(c => {
    if (!termo) return true;
    return (
      (c.nome || '').toLowerCase().includes(termo) ||
      (c.telefone || '').toLowerCase().includes(termo) ||
      (c.email || '').toLowerCase().includes(termo) ||
      (c.documento || '').toLowerCase().includes(termo)
    );
  });

  if (!listaFiltrada.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="5">Nenhum cliente encontrado</td>`;
    tbody.appendChild(tr);
    return;
  }

  listaFiltrada.forEach(c => {
    const st = statusCliente(c.id);
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${c.idSequencial || '-'}</td>
      <td>${c.nome}</td>
      <td>${c.telefone || c.email || '-'}</td>
      <td>${c.documento || '-'}</td>
      <td>
        <span class="badge badge-${st.tipo}">${st.label}</span>
      </td>
      <td class="col-acoes">
        <button class="btn btn-detalhes" data-det-cliente="${c.id}" title="Visualizar detalhes"><i class="fas fa-eye"></i> Detalhes</button>
        <button class="btn btn-editar" data-edit-cliente="${c.id}" title="Editar cliente"><i class="fas fa-edit"></i> Editar</button>
        <button class="btn btn-danger" data-del-cliente="${c.id}" title="Excluir cliente"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  tbody.querySelectorAll('[data-edit-cliente]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editCliente;
      const cliente = clientes.find(c => c.id === id);
      if (!cliente) return;
      abrirModalCliente(cliente);
    });
  });

  tbody.querySelectorAll('[data-det-cliente]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.detCliente;
      const cliente = clientes.find(c => c.id === id);
      if (!cliente) return;
      abrirCardDetalhesCliente(cliente);
    });
  });

  tbody.querySelectorAll('[data-del-cliente]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.delCliente;
      excluirCliente(id);
    });
  });
}

function abrirModalCliente(cliente) {
  const modal = document.getElementById('modal-cliente');
  const titulo = document.getElementById('modal-cliente-titulo');

  if (cliente) {
    titulo.textContent = 'Editar Cliente';
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-id-sequencial').value = cliente.idSequencial || '';
    document.getElementById('cliente-id-sequencial').disabled = true;
    document.getElementById('cliente-nome').value = cliente.nome || '';
    document.getElementById('cliente-telefone').value = cliente.telefone || '';
    document.getElementById('cliente-documento').value = cliente.documento || '';
    document.getElementById('cliente-email').value = cliente.email || '';
    document.getElementById('cliente-endereco').value = cliente.endereco || '';
    document.getElementById('cliente-veiculo-modelo').value = cliente.veiculoModelo || '';
    document.getElementById('cliente-veiculo-ano').value = cliente.veiculoAno || '';
    document.getElementById('cliente-veiculo-placa').value = cliente.veiculoPlaca || '';
    document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
  } else {
    titulo.textContent = 'Novo Cliente';
    document.getElementById('cliente-id').value = '';
    const novoId = gerarIdCliente();
    document.getElementById('cliente-id-sequencial').value = novoId;
    document.getElementById('cliente-id-sequencial').disabled = true;
    document.getElementById('form-cliente').reset();
    document.getElementById('cliente-id-sequencial').value = novoId;
  }

  modal.classList.add('is-open');
}

function fecharModalCliente() {
  document.getElementById('modal-cliente').classList.remove('is-open');
}

function abrirCardDetalhesCliente(cliente) {
  const modal = document.getElementById('modal-cliente-detalhes');

  // Preencher dados básicos
  document.getElementById('det-cliente-id-seq').textContent = cliente.idSequencial || '-';
  document.getElementById('det-cliente-nome').textContent = cliente.nome || '';
  document.getElementById('det-cliente-documento').textContent = cliente.documento || '-';
  document.getElementById('det-cliente-placa').textContent = cliente.veiculoPlaca || '-';
  document.getElementById('det-cliente-veiculo-info').textContent = `${cliente.veiculoModelo || 'N/A'} (${cliente.veiculoAno || 'N/A'})`;
  document.getElementById('det-cliente-contato').textContent = cliente.telefone || cliente.email || '-';
  document.getElementById('det-cliente-endereco').textContent = cliente.endereco || '-';
  document.getElementById('det-cliente-obs').textContent = cliente.observacoes || 'Sem observações';

  // Montar histórico de OS
  const tbodyOS = document.getElementById('det-cliente-os-tbody');
  tbodyOS.innerHTML = '';

  const osCliente = ordensServico
    .filter(os => os.clienteId === cliente.id)
    .sort((a, b) => (a.dataAbertura > b.dataAbertura ? -1 : 1)); // mais recente primeiro

  if (!osCliente.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="5">Nenhum serviço registrado para este cliente</td>`;
    tbodyOS.appendChild(tr);
  } else {
    osCliente.forEach(os => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${os.numero || '-'}</strong></td>
        <td>${os.dataAbertura || '-'}</td>
        <td>${os.descricao || '-'}</td>
        <td>${formatCurrency(os.valorTotal || 0)}</td>
        <td><span class="status-badge status-${os.status}">${os.status}</span></td>
      `;
      tbodyOS.appendChild(tr);
    });
  }

  // Verificar se tem parcelas em atraso
  const parcelasCliente = parcelas.filter(p => p.clienteId === cliente.id);
  const hoje = new Date().toISOString().slice(0, 10);
  const atrasos = parcelasCliente.filter(p => !p.dataPagamento && p.dataVencimento < hoje);

  const alertaAtraso = document.getElementById('det-cliente-alerta-atraso');
  if (atrasos.length > 0) {
    alertaAtraso.style.display = 'block';
    alertaAtraso.innerHTML = `
      <div class="alert alert-danger">
        <i class="fas fa-exclamation-circle"></i>
        <strong>ATENÇÃO!</strong> Este cliente possui <strong>${atrasos.length} parcela(s) em atraso</strong>.
        Total devido: <strong>${formatCurrency(atrasos.reduce((sum, p) => sum + (p.valor || 0), 0))}</strong>
      </div>
    `;
  } else {
    alertaAtraso.style.display = 'none';
  }

  modal.classList.add('is-open');
}

function initDetalhesClienteModal() {
  const modal = document.getElementById('modal-cliente-detalhes');
  if (!modal) return;

  const backdrop = modal.querySelector('.modal__backdrop');
  const btnFechar = document.getElementById('btn-fechar-detalhes-cliente');

  function fechar() {
    modal.classList.remove('is-open');
  }

  if (backdrop) backdrop.addEventListener('click', fechar);
  if (btnFechar) btnFechar.addEventListener('click', fechar);
}

let clientesInitialized = false;

window.initClientes = function initClientes() {
  // Verificar se estamos na página de clientes
  const tbody = document.getElementById('clientes-tbody');
  if (!tbody) {
    console.warn('Tabela de clientes não encontrada - view não está ativa');
    return;
  }

  const btnNovo = document.getElementById('btn-novo-cliente');
  const inputBusca = document.getElementById('clientes-busca');
  const form = document.getElementById('form-cliente');
  const btnCancelar = document.getElementById('btn-cancelar-cliente');
  const modal = document.getElementById('modal-cliente');
  
  // Verificar se todos os elementos necessários existem
  if (!btnNovo || !inputBusca || !form || !btnCancelar || !modal) {
    console.warn('Elementos da página de clientes não encontrados');
    return;
  }
  
  const backdrop = modal.querySelector('.modal__backdrop');

  // Se já foi inicializado, apenas renderizar a tabela
  if (clientesInitialized) {
    console.log('Clientes já inicializado, apenas renderizando tabela');
    renderClientesTabela();
    return;
  }

  // Marcar como inicializado
  clientesInitialized = true;

  btnNovo.addEventListener('click', () => abrirModalCliente(null));
  btnCancelar.addEventListener('click', fecharModalCliente);
  if (backdrop) backdrop.addEventListener('click', fecharModalCliente);
  inputBusca.addEventListener('input', renderClientesTabela);

  form.addEventListener('submit', e => {
    e.preventDefault();
    
    const id = document.getElementById('cliente-id').value || crypto.randomUUID();
    const idSequencial = document.getElementById('cliente-id-sequencial').value || gerarIdCliente();
    
    const cliente = {
      id,
      idSequencial,
      nome: document.getElementById('cliente-nome').value.trim(),
      telefone: document.getElementById('cliente-telefone').value.trim(),
      documento: document.getElementById('cliente-documento').value.trim(),
      email: document.getElementById('cliente-email').value.trim(),
      endereco: document.getElementById('cliente-endereco').value.trim(),
      veiculoModelo: document.getElementById('cliente-veiculo-modelo').value.trim(),
      veiculoAno: document.getElementById('cliente-veiculo-ano').value.trim(),
      veiculoPlaca: document.getElementById('cliente-veiculo-placa').value.trim(),
      observacoes: document.getElementById('cliente-observacoes').value.trim()
    };

    const idx = clientes.findIndex(c => c.id === id);
    if (idx >= 0) clientes[idx] = cliente;
    else clientes.push(cliente);

    persistAll();
    fecharModalCliente();
    renderClientesTabela();
    showToast('Cliente salvo com sucesso!', 'success');
  });

  initDetalhesClienteModal();
  renderClientesTabela();
  
  console.log('Clientes inicializado com sucesso');
};

function excluirCliente(id) {
  const cliente = clientes.find(c => c.id === id);
  if (!cliente) return;

  if (!confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`)) {
    return;
  }

  const temOS = ordensServico.some(os => os.clienteId === id);
  if (temOS) {
    showToast('Não é possível excluir: cliente possui ordens de serviço.', 'error');
    return;
  }

  clientes = clientes.filter(c => c.id !== id);
  persistAll();
  renderClientesTabela();
  showToast('Cliente excluído com sucesso.', 'info');
}

function formatCurrency(val) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

