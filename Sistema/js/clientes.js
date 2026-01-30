// js/clientes.js
if (window.Clientes) {
    console.warn('⚠️ Clientes já foi carregado, pulando redeclaração');
} else {
    window.Clientes = {
        // ... resto do código
    };
    console.log('✅ Módulo Clientes carregado');
}

const Clientes = {
    initialized: false,
    clienteAtualId: null,

    init() {

        if (this.initialized) return;

        const btnNovo = document.getElementById('btn-novo-cliente');
        const btnFechar = document.getElementById('btn-fechar-modal-cliente');
        const btnCancelar = document.getElementById('btn-cancelar-cliente');
        const btnFecharDetalhes = document.getElementById('btn-fechar-detalhes');
        const inputBusca = document.getElementById('clientes-busca');
        const form = document.getElementById('form-cliente');
        const modal = document.getElementById('modal-cliente');
        const modalDetalhes = document.getElementById('modal-detalhes-cliente');
        const backdrop = modal?.querySelector('.modal__backdrop');
        const backdropDetalhes = modalDetalhes?.querySelector('.modal__backdrop');

        // Event listeners
        if (btnNovo) btnNovo.addEventListener('click', () => this.openModal());
        if (btnFechar) btnFechar.addEventListener('click', () => this.closeModal());
        if (btnCancelar) btnCancelar.addEventListener('click', () => this.closeModal());
        if (btnFecharDetalhes) btnFecharDetalhes.addEventListener('click', () => this.closeDetalhes());
        if (backdrop) backdrop.addEventListener('click', () => this.closeModal());
        if (backdropDetalhes) backdropDetalhes.addEventListener('click', () => this.closeDetalhes());
        if (inputBusca) inputBusca.addEventListener('input', () => this.render());
        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));

        // Botões dentro do modal de detalhes
        const btnEditarDoDetalhe = document.getElementById('btn-editar-do-detalhe');
        const btnNovaOsDoDetalhe = document.getElementById('btn-nova-os-do-detalhe');

        if (btnEditarDoDetalhe) {
            btnEditarDoDetalhe.addEventListener('click', () => {
                const cliente = window.storage.getClienteById(this.clienteAtualId);
                if (cliente) {
                    this.closeDetalhes();
                    this.openModal(cliente);
                }
            });
        }

        if (btnNovaOsDoDetalhe) {
            btnNovaOsDoDetalhe.addEventListener('click', () => {
                console.log('🟢 Nova OS do detalhe clicado');

                // Fechar modal de detalhes do cliente
                this.closeDetalhes();

                // Navegar para a view de OS
                if (window.router) {
                    window.router.navigateTo('os');
                }

                // Abrir modal de Nova OS com dados pré-preenchidos
                setTimeout(() => {
                    if (window.OS && window.OS.openModal) {
                        // Abrir modal limpo
                        window.OS.openModal();

                        // Preencher dados do cliente
                        setTimeout(() => {
                            const selectCliente = document.getElementById('os-cliente');
                            if (selectCliente) {
                                selectCliente.value = this.clienteAtualId;
                                // Disparar evento change para preencher dados do veículo
                                selectCliente.dispatchEvent(new Event('change'));
                            }
                        }, 100);
                    }
                }, 400);
            });
        }

        this.initialized = true;
        console.log('✅ Módulo Clientes inicializado');
    },

    render() {
        this.init();

        const tbody = document.getElementById('clientes-tbody');
        const searchTerm = document.getElementById('clientes-busca')?.value.toLowerCase() || '';

        if (!tbody) return;

        const clientes = window.storage.getClientes();

        // Filtrar clientes
        const filteredClientes = clientes.filter(c => {
            if (!searchTerm) return true;
            return (
                (c.nome || '').toLowerCase().includes(searchTerm) ||
                (c.telefone || '').toLowerCase().includes(searchTerm) ||
                (c.documento || '').toLowerCase().includes(searchTerm) ||
                (c.email || '').toLowerCase().includes(searchTerm)
            );
        });

        // Limpar tabela
        tbody.innerHTML = '';

        // Verificar se há resultados
        if (filteredClientes.length === 0) {
            tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
            ${searchTerm ? 'Nenhum cliente encontrado com esse termo' : 'Nenhum cliente cadastrado'}
          </td>
        </tr>
      `;
            return;
        }

        // Renderizar clientes
        filteredClientes.forEach(cliente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><strong>${cliente.idSequencial || '-'}</strong></td>
        <td>${cliente.nome}</td>
        <td>${cliente.telefone || cliente.email || '-'}</td>
        <td>${cliente.documento || '-'}</td>
        <td><span class="badge badge-ok">Ativo</span></td>
        <td>
          <button class="btn btn-detalhes" data-id="${cliente.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
            <i class="fas fa-eye"></i> Ver Detalhes
          </button>
          <button class="btn btn-editar" data-id="${cliente.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn btn-danger" data-id="${cliente.id}" style="padding: 0.5rem 1rem; font-size: 0.85rem;">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Adicionar event listeners aos botões de ação
        tbody.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.openDetalhes(id);
            });
        });

        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                const cliente = window.storage.getClienteById(id);
                if (cliente) this.openModal(cliente);
            });
        });

        tbody.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.id;
                this.delete(id);
            });
        });
    },

    openModal(cliente = null) {
        const modal = document.getElementById('modal-cliente');
        const titulo = document.getElementById('modal-cliente-titulo');
        const form = document.getElementById('form-cliente');

        if (!modal || !form) return;

        if (cliente) {
            // Edição
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
            // Novo
            titulo.textContent = 'Novo Cliente';
            form.reset();
            document.getElementById('cliente-id').value = '';
        }

        modal.classList.add('is-open');
    },

    closeModal() {
        const modal = document.getElementById('modal-cliente');
        if (modal) modal.classList.remove('is-open');
    },

    openDetalhes(clienteId) {
        this.clienteAtualId = clienteId;
        const cliente = window.storage.getClienteById(clienteId);

        if (!cliente) {
            Utils.showToast('Cliente não encontrado', 'error');
            return;
        }

        // Preencher informações do cliente
        document.getElementById('detalhe-nome').textContent = cliente.nome || '-';
        document.getElementById('detalhe-id-sequencial').textContent = cliente.idSequencial || '-';
        document.getElementById('detalhe-telefone').textContent = cliente.telefone || '-';
        document.getElementById('detalhe-email').textContent = cliente.email || '-';
        document.getElementById('detalhe-documento').textContent = cliente.documento || '-';
        document.getElementById('detalhe-endereco').textContent = cliente.endereco || '-';
        document.getElementById('detalhe-veiculo-modelo').textContent = cliente.veiculoModelo || '-';
        document.getElementById('detalhe-veiculo-ano').textContent = cliente.veiculoAno || '-';
        document.getElementById('detalhe-veiculo-placa').textContent = cliente.veiculoPlaca || '-';
        document.getElementById('detalhe-observacoes').textContent = cliente.observacoes || 'Nenhuma observação registrada';

        // Ocultar seções vazias
        const veiculoContainer = document.getElementById('veiculo-info-container');
        if (!cliente.veiculoModelo && !cliente.veiculoAno && !cliente.veiculoPlaca) {
            veiculoContainer.style.display = 'none';
        } else {
            veiculoContainer.style.display = 'block';
        }

        const observacoesContainer = document.getElementById('observacoes-container');
        if (!cliente.observacoes) {
            observacoesContainer.style.display = 'none';
        } else {
            observacoesContainer.style.display = 'block';
        }

        // Renderizar histórico de OS
        this.renderHistorico(clienteId);

        // Abrir modal
        const modal = document.getElementById('modal-detalhes-cliente');
        if (modal) modal.classList.add('is-open');
    },

    closeDetalhes() {
        const modal = document.getElementById('modal-detalhes-cliente');
        if (modal) modal.classList.remove('is-open');
        this.clienteAtualId = null;
    },

    renderHistorico(clienteId) {
        const tbody = document.getElementById('historico-tbody');
        if (!tbody) return;

        // Buscar OS do cliente
        const todasOS = window.storage.getOS();
        const osCliente = todasOS.filter(os => os.clienteId === clienteId);

        // Calcular estatísticas
        const totalOS = osCliente.length;
        const osPendentes = osCliente.filter(os => os.status !== 'concluido').length;
        const valorTotal = osCliente.reduce((acc, os) => acc + (os.valorTotal || 0), 0);

        // Atualizar badges de estatísticas
        document.getElementById('stat-total-os').textContent = totalOS;
        document.getElementById('stat-pendente-os').textContent = osPendentes;
        document.getElementById('stat-valor-total').textContent = Utils.formatCurrency(valorTotal);

        // Limpar tabela
        tbody.innerHTML = '';

        if (osCliente.length === 0) {
            tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
            Nenhuma ordem de serviço encontrada para este cliente
          </td>
        </tr>
      `;
            return;
        }

        // Renderizar histórico (ordenar por data, mais recente primeiro)
        osCliente.sort((a, b) => new Date(b.dataAbertura) - new Date(a.dataAbertura));

        osCliente.forEach(os => {
            // Determinar status de pagamento
            let pagamentoHtml = '';
            const valorPago = os.valorPago || 0;
            const valorTotal = os.valorTotal || 0;

            if (valorPago >= valorTotal) {
                pagamentoHtml = '<span class="pagamento-status pagamento-pago"><i class="fas fa-check-circle"></i> Pago</span>';
            } else if (valorPago > 0) {
                pagamentoHtml = '<span class="pagamento-status pagamento-parcial"><i class="fas fa-clock"></i> Parcial</span>';
            } else {
                pagamentoHtml = '<span class="pagamento-status pagamento-pendente"><i class="fas fa-exclamation-circle"></i> Pendente</span>';
            }

            // Status da OS
            let statusClass = 'status-pending';
            let statusText = 'Pendente';
            if (os.status === 'concluido') {
                statusClass = 'status-done';
                statusText = 'Concluído';
            } else if (os.status === 'em_andamento') {
                statusClass = 'status-progress';
                statusText = 'Em Andamento';
            } else if (os.status === 'pronto') {
                statusClass = 'status-done';
                statusText = 'Pronto';
            } else if (os.status === 'aguardando_pecas') {
                statusClass = 'status-pending';
                statusText = 'Aguardando Peças';
            } else if (os.status === 'cancelado') {
                statusClass = 'status-pending';
                statusText = 'Cancelado';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><strong>#${os.numero || '-'}</strong></td>
        <td>${Utils.formatDate(os.dataAbertura)}</td>
        <td>${os.veiculoModelo || '-'} <br><small style="color:#64748b;">${os.veiculoPlaca || ''}</small></td>
        <td><strong>${Utils.formatCurrency(valorTotal)}</strong></td>
        <td>${pagamentoHtml}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-primary btn-sm btn-ver-os-historico" data-os-id="${os.id}">
            <i class="fas fa-eye"></i> Ver OS
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Adicionar event listeners aos botões "Ver OS"
        tbody.querySelectorAll('.btn-ver-os-historico').forEach(btn => {
            btn.addEventListener('click', () => {
                const osId = btn.getAttribute('data-os-id');
                // Fechar modal de detalhes do cliente
                this.closeDetalhes();
                // Abrir modal de detalhes da OS
                if (window.OS && window.OS.openDetalhes) {
                    setTimeout(() => {
                        window.OS.openDetalhes(osId);
                    }, 300);
                }
            });
        });
    },


    handleSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('cliente-id').value;
        const clienteData = {
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

        if (id) {
            // Atualizar
            window.storage.updateCliente(id, clienteData);
            Utils.showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            // Criar
            window.storage.addCliente(clienteData);
            Utils.showToast('Cliente cadastrado com sucesso!', 'success');
        }

        this.closeModal();
        this.render();
    },

    delete(id) {
        const cliente = window.storage.getClienteById(id);
        if (!cliente) return;

        if (confirm(`Deseja realmente excluir o cliente "${cliente.nome}"?`)) {
            window.storage.deleteCliente(id);
            Utils.showToast('Cliente excluído com sucesso!', 'info');
            this.render();
        }
    }
};

window.Clientes = Clientes;
console.log('✅ Módulo Clientes carregado');
