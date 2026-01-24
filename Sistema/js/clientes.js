// js/clientes.js
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
            (c.email || '').toLowerCase().includes(termo)
        );
    });

    if (!listaFiltrada.length) {
        const tr = document.createElement('tr');
        tr.className = 'empty-row';
        tr.innerHTML = `<td colspan="4">Nenhum cliente encontrado</td>`;
        tbody.appendChild(tr);
        return;
    }

    listaFiltrada.forEach(c => {
        const st = statusCliente(c.id);
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${c.nome}</td>
            <td>${c.telefone || c.email || '-'}</td>
            <td>${c.documento || '-'}</td>
            <td>
                <span class="badge badge-${st.tipo}">${st.label}</span>
            </td>
            <td class="col-acoes">
                <button class="btn" data-det-cliente="${c.id}">Detalhes</button>
                <button class="btn" data-edit-cliente="${c.id}">Editar</button>
                <button class="btn danger" data-del-cliente="${c.id}">Excluir</button>
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
            abrirModalDetalhesCliente(cliente);
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
        document.getElementById('form-cliente').reset();
    }

    modal.classList.add('is-open');
}

function fecharModalCliente() {
    document.getElementById('modal-cliente').classList.remove('is-open');
}

function abrirModalDetalhesCliente(cliente) {
    const modal = document.getElementById('modal-cliente-detalhes');

    // preencher dados básicos
    document.getElementById('det-cliente-nome').textContent = cliente.nome || '';
    document.getElementById('det-cliente-contato').textContent =
        cliente.telefone || cliente.email || '-';
    document.getElementById('det-cliente-doc').textContent = cliente.documento || '-';
    document.getElementById('det-cliente-endereco').textContent = cliente.endereco || '-';
    document.getElementById('det-cliente-obs').textContent = cliente.observacoes || '-';

    // montar histórico de OS
    const tbody = document.getElementById('det-cliente-os-tbody');
    tbody.innerHTML = '';

    const osCliente = ordensServico
        .filter(os => os.clienteId === cliente.id)
        .sort((a, b) => (a.dataAbertura > b.dataAbertura ? -1 : 1)); // mais recente primeiro

    if (!osCliente.length) {
        const tr = document.createElement('tr');
        tr.className = 'empty-row';
        tr.innerHTML = `<td colspan="5">Nenhum serviço registrado para este cliente</td>`;
        tbody.appendChild(tr);
    } else {
        osCliente.forEach(os => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${os.numero}</td>
                <td>${os.dataAbertura}</td>
                <td>${os.descricao || '-'}</td>
                <td>${formatCurrency(os.valorTotal || 0)}</td>
                <td>${os.status}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    modal.classList.add('is-open');
}

function initDetalhesClienteModal() {
    const modal = document.getElementById('modal-cliente-detalhes');
    const backdrop = modal.querySelector('.modal__backdrop');
    const btnFechar = document.getElementById('btn-fechar-detalhes-cliente');

    function fechar() {
        modal.classList.remove('is-open');
    }

    backdrop.addEventListener('click', fechar);
    btnFechar.addEventListener('click', fechar);
}


window.initClientes = function initClientes() {
    const btnNovo = document.getElementById('btn-novo-cliente');
    const inputBusca = document.getElementById('clientes-busca');
    const form = document.getElementById('form-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');
    const modal = document.getElementById('modal-cliente');
    const backdrop = modal.querySelector('.modal__backdrop');

    btnNovo.addEventListener('click', () => abrirModalCliente(null));
    btnCancelar.addEventListener('click', fecharModalCliente);
    backdrop.addEventListener('click', fecharModalCliente);

    inputBusca.addEventListener('input', renderClientesTabela);

    form.addEventListener('submit', e => {
        e.preventDefault();
        const id = document.getElementById('cliente-id').value || crypto.randomUUID();

        const cliente = {
            id,
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
    });


    renderClientesTabela();
}

function excluirCliente(id) {
    const cliente = clientes.find(c => c.id === id);
    if (!cliente) return;

    // confirmação simples (pode trocar por modal depois)
    if (!confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`)) {
        return;
    }

    // impede remover se tiver OS associada (opcional, mas recomendado)
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

