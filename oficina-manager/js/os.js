// js/os.js

// utilidades básicas (se já existirem em outro arquivo, remova estas duplicatas)
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

// ---------- HELPERS INTERNOS ----------

// preenche select de clientes no modal de OS
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

// gera linhas de parcelas no tbody do modal
function gerarParcelasParaModal() {
  const valorTotal = Number(document.getElementById('os-valor-total').value || 0);
  const numParcelas = Number(document.getElementById('os-numero-parcelas').value || 1);
  const dataPrimeira = document.getElementById('os-data-primeira-parcela').value || todayISO();
  const tbody = document.getElementById('os-parcelas-tbody');

  if (!tbody) return;
  if (valorTotal <= 0 || numParcelas <= 0) {
    showToast('Informe valor total e número de parcelas válidos.', 'error');
    return;
  }

  const totalCent = Math.round(valorTotal * 100);
  const base = Math.floor(totalCent / numParcelas);
  const resto = totalCent - base * numParcelas;

  tbody.innerHTML = '';

  for (let i = 0; i < numParcelas; i++) {
    let valorParcelaCent = base;
    if (i === numParcelas - 1) valorParcelaCent += resto;
    const valorParcela = (valorParcelaCent / 100).toFixed(2);
    const dataVenc = addMonthsISO(dataPrimeira, i);

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><input type="date" class="parc-venc" value="${dataVenc}" /></td>
      <td><input type="number" step="0.01" class="parc-valor" value="${valorParcela}" /></td>
      <td><input type="checkbox" class="parc-pago" /></td>
      <td><input type="date" class="parc-data-pag" disabled /></td>
      <td>
        <select class="parc-forma" disabled>
          <option value="">Selecione</option>
          <option value="pix">Pix</option>
          <option value="debito">Cartão débito</option>
          <option value="credito">Cartão crédito</option>
          <option value="boleto">Boleto</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="outro">Outro</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
  }

  // ligar comportamento de "Pago?"
  tbody.querySelectorAll('.parc-pago').forEach(chk => {
    chk.addEventListener('change', () => {
      const row = chk.closest('tr');
      const dtPag = row.querySelector('.parc-data-pag');
      const forma = row.querySelector('.parc-forma');
      const on = chk.checked;
      dtPag.disabled = !on;
      forma.disabled = !on;
      if (on && !dtPag.value) dtPag.value = todayISO();
    });
  });
}

// carrega parcelas de uma OS existente no modal
function carregarParcelasOSNoModal(osId) {
  const tbody = document.getElementById('os-parcelas-tbody');
  tbody.innerHTML = '';

  const parcOS = parcelas
    .filter(p => p.osId === osId)
    .sort((a, b) => a.numeroParcela - b.numeroParcela);

  if (!parcOS.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="6">Nenhuma parcela gerada</td>`;
    tbody.appendChild(tr);
    return;
  }

  parcOS.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${p.numeroParcela}</td>
      <td><input type="date" class="parc-venc" value="${p.dataVencimento}" /></td>
      <td><input type="number" step="0.01" class="parc-valor" value="${p.valorParcela}" /></td>
      <td><input type="checkbox" class="parc-pago" ${p.dataPagamento ? 'checked' : ''} /></td>
      <td><input type="date" class="parc-data-pag" ${p.dataPagamento ? '' : 'disabled'} value="${p.dataPagamento || ''}" /></td>
      <td>
        <select class="parc-forma" ${p.dataPagamento ? '' : 'disabled'}>
          <option value="">Selecione</option>
          <option value="pix">Pix</option>
          <option value="debito">Cartão débito</option>
          <option value="credito">Cartão crédito</option>
          <option value="boleto">Boleto</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="outro">Outro</option>
        </select>
      </td>
    `;
    tbody.appendChild(tr);
    tr.querySelector('.parc-forma').value = p.formaPagamento || '';

    const chk = tr.querySelector('.parc-pago');
    const dtPag = tr.querySelector('.parc-data-pag');
    const forma = tr.querySelector('.parc-forma');
    chk.addEventListener('change', () => {
      const on = chk.checked;
      dtPag.disabled = !on;
      forma.disabled = !on;
      if (on && !dtPag.value) dtPag.value = todayISO();
    });
  });
}

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


// abre modal de OS para nova ou edição
function abrirModalOS(os) {
  const modal = document.getElementById('modal-os');
  const titulo = document.getElementById('modal-os-titulo');
  const form = document.getElementById('form-os');

  preencherSelectClientesOS();
  ligarPreenchimentoVeiculoAutomatico();
  renderOSTabela();

  if (os) {
    titulo.textContent = `Editar OS #${os.numero}`;
    document.getElementById('os-id').value = os.id;
    document.getElementById('os-cliente-id').value = os.clienteId;
    document.getElementById('os-veiculo').value = os.veiculo || '';
    document.getElementById('os-data-abertura').value = os.dataAbertura;
    document.getElementById('os-status').value = os.status;
    document.getElementById('os-descricao').value = os.descricao || '';
    document.getElementById('os-valor-total').value = os.valorTotal || '';
    document.getElementById('os-numero-parcelas').value = os.qtdParcelas || 1;
    document.getElementById('os-data-primeira-parcela').value =
      os.dataPrimeiraParcela || todayISO();

    carregarParcelasOSNoModal(os.id);
  } else {
    titulo.textContent = 'Nova OS';
    form.reset();
    document.getElementById('os-id').value = '';
    document.getElementById('os-data-abertura').value = todayISO();
    document.getElementById('os-status').value = 'aberto';
    document.getElementById('os-numero-parcelas').value = 1;
    document.getElementById('os-data-primeira-parcela').value = todayISO();

    const tbody = document.getElementById('os-parcelas-tbody');
    tbody.innerHTML = `
      <tr class="empty-row">
        <td colspan="6">Nenhuma parcela gerada</td>
      </tr>
    `;
  }

  modal.classList.add('is-open');
}



// fecha modal OS
function fecharModalOS() {
  const modal = document.getElementById('modal-os');
  modal.classList.remove('is-open');
}

// salva OS + parcelas + movimentos de caixa
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
  const dataPrimeiraParcela =
    document.getElementById('os-data-primeira-parcela').value || todayISO();

  if (!clienteId) {
    showToast('Selecione um cliente para a OS.', 'error');
    return;
  }

  let numeroOS;
  const existente = ordensServico.find(o => o.id === id);
  if (existente) {
    numeroOS = existente.numero;
  } else {
    // número sequencial simples
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

  // se for edição, limpar parcelas e entradas anteriores dessa OS
  if (existente) {
    const idx = ordensServico.findIndex(o => o.id === id);
    ordensServico[idx] = os;
    parcelas = parcelas.filter(p => p.osId !== id);
    movimentosCaixa = movimentosCaixa.filter(
      m => !(m.osId === id && m.tipo === 'entrada')
    );
  } else {
    ordensServico.push(os);
  }

  // ler parcelas da tabela
  const tbody = document.getElementById('os-parcelas-tbody');
  const rows = Array.from(tbody.querySelectorAll('tr')).filter(
    tr => !tr.classList.contains('empty-row')
  );

  rows.forEach((row, index) => {
    const numeroParcela = index + 1;
    const dataVenc = row.querySelector('.parc-venc').value || todayISO();
    const valorParc = Number(row.querySelector('.parc-valor').value || 0);
    const pago = row.querySelector('.parc-pago').checked;
    const dataPag = row.querySelector('.parc-data-pag').value || null;
    const forma = row.querySelector('.parc-forma').value || null;

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

    // se paga, lança entrada no caixa
    if (parc.dataPagamento && parc.formaPagamento) {
      movimentosCaixa.push({
        id: crypto.randomUUID(),
        tipo: 'entrada',
        osId: id,
        clienteId,
        descricao: `Parc. ${numeroParcela} OS ${numeroOS} - ${cliente?.nome || ''}`,
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
  renderClientesTabela(); // atualiza badges de pendência
  if (typeof renderCaixa === 'function') renderCaixa();
  if (typeof atualizarDashboard === 'function') atualizarDashboard();

  showToast('Ordem de serviço salva com sucesso!', 'success');
}

// renderiza tabela de OS
function renderOSTabela() {
  const tbody = document.getElementById('os-tbody');
  const inputBusca = document.getElementById('os-busca');
  if (!tbody) return;

  const termo = (inputBusca?.value || '').toLowerCase().trim();

  tbody.innerHTML = '';

  const lista = ordensServico.filter(os => {
    if (!termo) return true;
    const cliente = clientes.find(c => c.id === os.clienteId);
    const texto = `${os.numero} ${cliente?.nome || ''}`.toLowerCase();
    return texto.includes(termo);
  });

  if (!lista.length) {
    const tr = document.createElement('tr');
    tr.className = 'empty-row';
    tr.innerHTML = `<td colspan="6">Nenhuma ordem de serviço encontrada</td>`;
    tbody.appendChild(tr);
    return;
  }

  lista
    .slice()
    .sort((a, b) => b.numero - a.numero)
    .forEach(os => {
      const cliente = clientes.find(c => c.id === os.clienteId);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${os.numero}</td>
        <td>${cliente?.nome || '-'}</td>
        <td>${os.veiculo || '-'}</td>
        <td>${formatCurrency(os.valorTotal)}</td>
        <td>${os.status}</td>
        <td class="col-acoes">
          <button class="btn" data-edit-os="${os.id}">Editar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll('[data-edit-os]').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.editOs;
      const os = ordensServico.find(o => o.id === id);
      if (!os) return;
      abrirModalOS(os);
    });
  });
}

// inicialização do módulo de OS
function initOS() {
  const btnNovaOS = document.getElementById('btn-nova-os');
  const btnCancelarOS = document.getElementById('btn-cancelar-os');
  const btnGerarParcelas = document.getElementById('btn-gerar-parcelas');
  const modal = document.getElementById('modal-os');
  const backdrop = modal.querySelector('.modal__backdrop');
  const form = document.getElementById('form-os');
  const inputBusca = document.getElementById('os-busca');

  btnNovaOS.addEventListener('click', () => abrirModalOS(null));
  btnCancelarOS.addEventListener('click', fecharModalOS);
  backdrop.addEventListener('click', fecharModalOS);
  btnGerarParcelas.addEventListener('click', gerarParcelasParaModal);
  form.addEventListener('submit', salvarOS);
  if (inputBusca) inputBusca.addEventListener('input', renderOSTabela);

  // inicial
  renderOSTabela();
}
