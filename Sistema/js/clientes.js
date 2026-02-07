// js/clientes.js 
//
// ATUALIZADO PARA INDEXEDDB 
//        2/02/2026
// @pedro

if (window.Clientes) {
    console.warn('[!] Clientes já foi carregado, pulando redeclaração');
} else {
    window.Clientes = {
        initialized: false,
        clienteAtualId: null,
    };
    ('[+] Módulo Clientes carregado');
}

const Clientes = {
    initialized: false,
    clienteAtualId: null,
    veiculosTemp: [],


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
        const btnAdicionarVeiculo = document.getElementById('btn-adicionar-veiculo');

        if (btnAdicionarVeiculo) {
            btnAdicionarVeiculo.addEventListener('click', () => this.adicionarVeiculo());
        }

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
            btnEditarDoDetalhe.addEventListener('click', async () => {
                const cliente = await window.storage.getClienteById(this.clienteAtualId);
                if (cliente) {
                    this.closeDetalhes();
                    await this.openModal(cliente);
                }
            });
        }

        if (btnNovaOsDoDetalhe) {
            btnNovaOsDoDetalhe.addEventListener('click', async () => {
                ('[=] Nova OS do detalhe clicado');


                this.closeDetalhes();


                if (window.router) {
                    window.router.navigateTo('os');
                }


                setTimeout(() => {
                    if (window.OS && window.OS.openModal) {

                        window.OS.openModal();


                        setTimeout(() => {
                            const selectCliente = document.getElementById('os-cliente');
                            if (selectCliente) {
                                selectCliente.value = this.clienteAtualId;

                                selectCliente.dispatchEvent(new Event('change'));
                            }
                        }, 100);
                    }
                }, 400);
            });
        }

        this.initialized = true;
        ('[+] Módulo Clientes inicializado');
    },

    async render() {
        this.init();

        const tbody = document.getElementById('clientes-tbody');
        const searchTerm = document.getElementById('clientes-busca')?.value.toLowerCase() || '';

        if (!tbody) return;

        const clientes = await window.storage.getClientes();

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
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await this.openDetalhes(id);
            });
        });

        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const cliente = await window.storage.getClienteById(id);
                if (cliente) this.openModal(cliente);
            });
        });

        tbody.querySelectorAll('.btn-danger').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await this.delete(id);
            });
        });
    },

    async openModal(cliente = null) {
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
            document.getElementById('cliente-observacoes').value = cliente.observacoes || '';


            this.veiculosTemp = cliente.veiculos || [];


            if (!cliente.veiculos && (cliente.veiculoModelo || cliente.veiculoPlaca)) {
                this.veiculosTemp = [{
                    id: Date.now(),
                    modelo: cliente.veiculoModelo || '',
                    ano: cliente.veiculoAno || '',
                    placa: cliente.veiculoPlaca || ''
                }];
            }

            this.renderVeiculosLista();
        } else {
            titulo.textContent = 'Novo Cliente';
            form.reset();
            document.getElementById('cliente-id').value = '';
            this.veiculosTemp = [];
            this.renderVeiculosLista();
        }

        modal.classList.add('is-open');
    },

    closeModal() {
        const modal = document.getElementById('modal-cliente');
        if (modal) modal.classList.remove('is-open');
    },

    async openDetalhes(clienteId) {
        const cliente = await window.storage.getClienteById(clienteId);
        if (!cliente) {
            Utils.showToast('Cliente não encontrado', 'error');
            return;
        }

        // Salvar ID do cliente para edição posterior
        this.clienteDetalhesId = clienteId;

        const modal = document.getElementById('modal-detalhes-cliente');
        if (!modal) {
            console.error('[X] Modal de detalhes não encontrado!');
            return;
        }

        // Preencher informações básicas
        const elNome = document.getElementById('detalhe-nome');
        const elTelefone = document.getElementById('detalhe-telefone');
        const elDocumento = document.getElementById('detalhe-documento');
        const elEmail = document.getElementById('detalhe-email');
        const elEndereco = document.getElementById('detalhe-endereco');
        const elObservacoes = document.getElementById('detalhe-observacoes');

        if (elNome) elNome.textContent = cliente.nome || '-';
        if (elTelefone) elTelefone.textContent = cliente.telefone || '-';
        if (elDocumento) elDocumento.textContent = cliente.documento || '-';
        if (elEmail) elEmail.textContent = cliente.email || '-';
        if (elEndereco) elEndereco.textContent = cliente.endereco || '-';
        if (elObservacoes) elObservacoes.textContent = cliente.observacoes || 'Sem observações';

        // 🆕 RENDERIZAR VEÍCULOS
        const elVeiculos = document.getElementById('detalhe-veiculos');
        if (elVeiculos) {
            const veiculos = cliente.veiculos || [];

            // Manter compatibilidade com formato antigo
            if (veiculos.length === 0 && cliente.veiculoModelo) {
                veiculos.push({
                    modelo: cliente.veiculoModelo,
                    ano: cliente.veiculoAno,
                    placa: cliente.veiculoPlaca
                });
            }

            if (veiculos.length > 0) {
                elVeiculos.innerHTML = veiculos.map((veiculo, index) => `
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; border: 1px solid #e9ecef; transition: all 0.2s ease;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
                    CARRO ${index + 1}
                    </span>
                    <strong style="font-size: 1.15rem; color: #2c3e50;">${veiculo.modelo}</strong>
                </div>
                <div style="display: flex; gap: 1.5rem; font-size: 0.95rem; color: #6c757d; padding-left: 0.5rem;">
                    ${veiculo.ano ? `<span><i class="fas fa-calendar" style="margin-right: 0.4rem; color: #667eea;"></i><strong>Ano:</strong> ${veiculo.ano}</span>` : ''}
                    ${veiculo.placa ? `<span><i class="fas fa-car" style="margin-right: 0.4rem; color: #667eea;"></i><strong>Placa:</strong> ${veiculo.placa.toUpperCase()}</span>` : ''}
                </div>
                </div>
            `).join('');
                    } else {
                        elVeiculos.innerHTML = `
                <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 8px; border: 2px dashed #dee2e6;">
                <i class="fas fa-car" style="font-size: 3rem; color: #ced4da; margin-bottom: 1rem;"></i>
                <p style="color: #6c757d; margin: 0; font-style: italic;">Nenhum veículo cadastrado</p>
                </div>
            `;
            }
        }

        // Renderizar histórico de OS
        await this.renderHistorico(clienteId);

        modal.classList.add('is-open');
        console.log('[✓] Modal de detalhes aberto para:', cliente.nome);
    },

    closeDetalhes() {
        const modal = document.getElementById('modal-detalhes-cliente');
        if (modal) modal.classList.remove('is-open');
        this.clienteAtualId = null;
    },

    editarCliente() {
        this.closeDetalhes();
        if (this.clienteDetalhesId) {
            window.storage.getClienteById(this.clienteDetalhesId).then(cliente => {
                if (cliente) {
                    this.openModal(cliente);
                }
            });
        }
    },

    async renderHistorico(clienteId) {
        const tbody = document.getElementById('historico-tbody');
        if (!tbody) return;

        // Buscar OS do cliente
        const todasOS = await window.storage.getOS();
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


    async handleSubmit(e) {
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
            observacoes: document.getElementById('cliente-observacoes').value.trim(),
            veiculos: this.veiculosTemp
        };

        if (this.veiculosTemp.length > 0) {
            clienteData.veiculoModelo = this.veiculosTemp[0].modelo || '';
            clienteData.veiculoAno = this.veiculosTemp[0].ano || '';
            clienteData.veiculoPlaca = this.veiculosTemp[0].placa || '';
        }

        if (id) {
            // Atualizar
            await window.storage.updateCliente(id, clienteData);
            Utils.showToast('Cliente atualizado com sucesso!', 'success');
        } else {
            // Criar
            await window.storage.addCliente(clienteData);
            Utils.showToast('Cliente cadastrado com sucesso!', 'success');
        }

        this.closeModal();
        this.veiculosTemp = [];
        await this.render();
    },

    async delete(id) {
        abrirModalConfirmacaoExclusao(id, 'cliente');
    },

    adicionarVeiculo() {
        const modelo = document.getElementById('cliente-veiculo-modelo')?.value.trim();
        const ano = document.getElementById('cliente-veiculo-ano')?.value.trim();
        const placa = document.getElementById('cliente-veiculo-placa')?.value.trim();

        if (!modelo) {
            Utils.showToast('Informe o modelo do veículo', 'error');
            return;
        }

        const veiculo = {
            id: Date.now(),
            modelo: modelo,
            ano: ano,
            placa: placa
        };

        this.veiculosTemp.push(veiculo);
        this.renderVeiculosLista();

        // Limpar campos
        document.getElementById('cliente-veiculo-modelo').value = '';
        document.getElementById('cliente-veiculo-ano').value = '';
        document.getElementById('cliente-veiculo-placa').value = '';

        Utils.showToast('Veículo adicionado!', 'success');
        console.log('[✓] Veículo adicionado:', veiculo);
    },


    removerVeiculo(veiculoId) {
        this.veiculosTemp = this.veiculosTemp.filter(v => v.id !== veiculoId);
        this.renderVeiculosLista();
        Utils.showToast('Veículo removido', 'info');
        console.log('[✓] Veículo removido:', veiculoId);
    },


    renderVeiculosLista() {
        const lista = document.getElementById('veiculos-lista');
        if (!lista) return;

        lista.innerHTML = '';

        if (this.veiculosTemp.length === 0) {
            lista.innerHTML = '<p style="color: #64748b; font-style: italic; text-align: center; padding: 1rem;">Nenhum veículo adicionado</p>';
            return;
        }

        this.veiculosTemp.forEach((veiculo, index) => {
            const div = document.createElement('div');
            div.className = 'veiculo-item';
            div.style.cssText = 'background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center; border: 1px solid #e9ecef;';

            div.innerHTML = `
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <span style="background: #667eea; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 600;">
              CARRO ${index + 1}
            </span>
            <strong style="font-size: 1.1rem; color: #2c3e50;">${veiculo.modelo}</strong>
          </div>
          <div style="display: flex; gap: 1rem; font-size: 0.9rem; color: #6c757d; margin-top: 0.5rem;">
            ${veiculo.ano ? `<span><i class="fas fa-calendar" style="margin-right: 0.25rem;"></i>${veiculo.ano}</span>` : ''}
            ${veiculo.placa ? `<span><i class="fas fa-car" style="margin-right: 0.25rem;"></i>${veiculo.placa}</span>` : ''}
          </div>
        </div>
        <button class="btn btn-danger btn-sm" onclick="window.Clientes.removerVeiculo(${veiculo.id})" style="padding: 0.5rem 0.75rem;">
          <i class="fas fa-trash"></i>
        </button>
      `;

            lista.appendChild(div);
        });
    }
};

window.Clientes = Clientes;
('✅ Módulo Clientes carregado');
