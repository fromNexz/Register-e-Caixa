// js/os.js
//
//    ATUALIZADO PARA RECEBER INDEXEDDB
//             02/02/2026
// @pedro

if (window.OS) {
    console.warn('[!] OS já foi carregado, pulando redeclaração');
} else {
    window.OS = {

    };
    ('[+] Módulo OS carregado');
}


const OS = {
    initialized: false,
    osAtualId: null,

    init() {
        if (this.initialized) return;

        // === ELEMENTOS DO DOM ===
        const btnNova = document.getElementById('btn-nova-os');
        const btnCancelar = document.getElementById('btn-cancelar-os');
        const form = document.getElementById('form-os');
        const modal = document.getElementById('modal-os');
        const backdrop = modal?.querySelector('.modal__backdrop');

        // === EVENT LISTENERS - MODAL CRIAR/EDITAR ===
        if (btnNova) {
            btnNova.addEventListener('click', () => this.openModal());
        }

        if (btnCancelar) {
            btnCancelar.addEventListener('click', (e) => {
                e.preventDefault();
                this.closeModal();
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeModal());
        }

        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        // === AUTO-CALCULAR VALOR TOTAL ===
        const valorMaoObra = document.getElementById('os-valor-mao-obra');
        const valorPecas = document.getElementById('os-valor-pecas');
        const valorTotal = document.getElementById('os-valor-total');

        if (valorMaoObra && valorPecas && valorTotal) {
            const calcularTotal = () => {
                const maoObra = parseFloat(valorMaoObra.value) || 0;
                const pecas = parseFloat(valorPecas.value) || 0;
                valorTotal.value = (maoObra + pecas).toFixed(2);
            };

            valorMaoObra.addEventListener('input', calcularTotal);
            valorPecas.addEventListener('input', calcularTotal);
        }

        // === AUTO-PREENCHER DADOS DO CLIENTE ===
        const selectCliente = document.getElementById('os-cliente');
        if (selectCliente) {
            selectCliente.addEventListener('change', async () => {
                const clienteId = selectCliente.value;
                if (clienteId) {
                    const cliente = await window.storage.getClienteById(clienteId);
                    if (cliente) {
                        if (cliente.veiculoModelo) {
                            document.getElementById('os-veiculo-modelo').value = cliente.veiculoModelo;
                        }
                        if (cliente.veiculoPlaca) {
                            document.getElementById('os-veiculo-placa').value = cliente.veiculoPlaca;
                        }
                        if (cliente.veiculoAno) {
                            document.getElementById('os-veiculo-ano').value = cliente.veiculoAno;
                        }
                    }
                }
            });
        }

        // === DEFINIR DATA DE HOJE POR PADRÃO ===
        const dataAberturaInput = document.getElementById('os-data-abertura');
        if (dataAberturaInput) {
            dataAberturaInput.value = Utils.getCurrentDate();
        }

        // === FECHAR MODAIS COM TECLA ESC ===
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modalOS = document.getElementById('modal-os');
                const modalDetalhes = document.getElementById('modal-detalhes-os');

                if (modalOS?.classList.contains('is-open')) {
                    this.closeModal();
                }

                if (modalDetalhes?.classList.contains('is-open')) {
                    this.closeDetalhes();
                }
            }
        });

        // === PARCELAMENTO ===
        const formaPagamento = document.getElementById('os-forma-pagamento');
        const parcelamentoContainer = document.getElementById('parcelamento-container');
        const btnGerarParcelas = document.getElementById('btn-gerar-parcelas');

        if (formaPagamento && parcelamentoContainer) {
            formaPagamento.addEventListener('change', () => {
                if (formaPagamento.value === 'parcelado') {
                    parcelamentoContainer.style.display = 'block';
                } else {
                    parcelamentoContainer.style.display = 'none';
                    document.getElementById('parcelas-table-container').style.display = 'none';
                }
            });
        }

        if (btnGerarParcelas) {
            btnGerarParcelas.addEventListener('click', () => {
                this.gerarParcelas();
            });
        }


        this.initialized = true;
        ('[+] Módulo OS inicializado');
    },


    async render() {
        this.init();
        await this.loadClientesSelect();
        await this.renderTabela();
    },

    async loadClientesSelect() {
        const select = document.getElementById('os-cliente');
        if (!select) return;

        const clientes = await window.storage.getClientes();

        
        select.innerHTML = '<option value="">Selecione um cliente</option>';

        
        clientes.forEach(cliente => {
            const option = document.createElement('option');
            option.value = cliente.id;
            option.textContent = `${cliente.nome} ${cliente.veiculoModelo ? '- ' + cliente.veiculoModelo : ''}`;
            select.appendChild(option);
        });
    },

    async renderTabela() {
        const tbody = document.getElementById('os-tbody');
        if (!tbody) return;

        const ordensServico = await window.storage.getOS();
        const clientes = await window.storage.getClientes();

        tbody.innerHTML = '';

        if (ordensServico.length === 0) {
            tbody.innerHTML = `
        <tr class="empty-row">
          <td colspan="7" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
            Nenhuma ordem de serviço cadastrada
          </td>
        </tr>
      `;
            return;
        }

        
        ordensServico.sort((a, b) => (b.numero || 0) - (a.numero || 0));

        ordensServico.forEach(os => {
            const cliente = clientes.find(c => c.id === os.clienteId);

            // Status
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
                statusClass = 'status-badge-atraso';
                statusText = 'Cancelado';
            }

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><strong>#${os.numero || '-'}</strong></td>
        <td>${cliente?.nome || '-'}</td>
        <td>${os.veiculoModelo || '-'} <br><small style="color: #64748b;">${os.veiculoPlaca || ''}</small></td>
        <td>${Utils.formatDate(os.dataAbertura)}</td>
        <td><strong>${Utils.formatCurrency(os.valorTotal)}</strong></td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn btn-detalhes btn-sm" data-id="${os.id}">
            <i class="fas fa-eye"></i>
          </button>
          <button class="btn btn-editar btn-sm" data-id="${os.id}">
            <i class="fas fa-edit"></i>
          </button>
        </td>
      `;
            tbody.appendChild(tr);
        });

        // Event listeners dos botões
        tbody.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                await this.openDetalhes(id);
            });
        });

        tbody.querySelectorAll('.btn-editar').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                const os = await window.storage.getOSById(id);
                if (os) this.openModal(os);
            });
        });
    },

    async openModal(os = null) {
        const modal = document.getElementById('modal-os');
        const titulo = document.getElementById('modal-os-titulo');
        const form = document.getElementById('form-os');

        if (!modal || !form) return;

        
        await this.loadClientesSelect();

        if (os) {
            // Edição
            titulo.innerHTML = '<i class="fas fa-file-invoice"></i> Editar Ordem de Serviço';
            document.getElementById('os-id').value = os.id;
            document.getElementById('os-cliente').value = os.clienteId || '';
            document.getElementById('os-veiculo-modelo').value = os.veiculoModelo || '';
            document.getElementById('os-veiculo-placa').value = os.veiculoPlaca || '';
            document.getElementById('os-veiculo-ano').value = os.veiculoAno || '';
            document.getElementById('os-km').value = os.km || '';
            document.getElementById('os-problema').value = os.problema || '';
            document.getElementById('os-diagnostico').value = os.diagnostico || '';
            document.getElementById('os-servicos').value = os.servicos || '';
            document.getElementById('os-pecas').value = os.pecas || '';
            document.getElementById('os-valor-mao-obra').value = os.valorMaoObra || '';
            document.getElementById('os-valor-pecas').value = os.valorPecas || '';
            document.getElementById('os-valor-total').value = os.valorTotal || '';
            document.getElementById('os-data-abertura').value = os.dataAbertura || '';
            document.getElementById('os-data-previsao').value = os.dataPrevisao || '';
            document.getElementById('os-forma-pagamento').value = os.formaPagamento || '';
            document.getElementById('os-status').value = os.status || 'pendente';
            document.getElementById('os-garantia').value = os.garantia || '';
            document.getElementById('os-observacoes').value = os.observacoes || '';

            // === CARREGAR PARCELAMENTO SE EXISTIR ===
            const parcelamentoContainer = document.getElementById('parcelamento-container');
            const parcelasTableContainer = document.getElementById('parcelas-table-container');

            if (os.formaPagamento === 'parcelado' && os.parcelas && os.parcelas.length > 0) {
                
                if (parcelamentoContainer) {
                    parcelamentoContainer.style.display = 'block';
                }

                
                const numParcelasSelect = document.getElementById('os-num-parcelas');
                if (numParcelasSelect) {
                    numParcelasSelect.value = os.parcelas.length;
                }

                
                const dataPrimeiraInput = document.getElementById('os-data-primeira-parcela');
                if (dataPrimeiraInput && os.parcelas[0]) {
                    dataPrimeiraInput.value = os.parcelas[0].data;
                }

                
                const tbody = document.getElementById('parcelas-tbody');
                if (tbody) {
                    tbody.innerHTML = '';

                    os.parcelas.forEach((parcela, index) => {
                        const tr = document.createElement('tr');
                        tr.innerHTML = `
              <td><strong>${parcela.numero || (index + 1)}/${os.parcelas.length}</strong></td>
              <td>
                <input type="date" class="parcela-data" data-index="${index + 1}" value="${parcela.data || ''}">
              </td>
              <td>
                <input type="text" class="input-control parcela-desc" data-index="${index + 1}" 
                       value="${parcela.descricao || 'Parcela ' + (index + 1)}" style="max-width: 200px;">
              </td>
              <td>
                <select class="parcela-forma" data-index="${index + 1}">
                  <option value="dinheiro" ${parcela.forma === 'dinheiro' ? 'selected' : ''}>Dinheiro</option>
                  <option value="pix" ${parcela.forma === 'pix' ? 'selected' : ''}>PIX</option>
                  <option value="debito" ${parcela.forma === 'debito' ? 'selected' : ''}>Débito</option>
                  <option value="credito" ${parcela.forma === 'credito' ? 'selected' : ''}>Crédito</option>
                  <option value="boleto" ${parcela.forma === 'boleto' ? 'selected' : ''}>Boleto</option>
                </select>
              </td>
              <td>
                <select class="parcela-status" data-index="${index + 1}">
                  <option value="entrada" ${parcela.status === 'entrada' ? 'selected' : ''}>Entrada</option>
                  <option value="pendente" ${parcela.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                  <option value="pago" ${parcela.status === 'pago' ? 'selected' : ''}>Pago</option>
                </select>
              </td>
              <td><strong>R$ ${parcela.valor.toFixed(2)}</strong></td>
            `;
                        tbody.appendChild(tr);
                    });

                    // Atualizar total
                    const totalElement = document.getElementById('parcelas-total');
                    if (totalElement) {
                        totalElement.textContent = Utils.formatCurrency(os.valorTotal || 0);
                    }

                    // Mostrar tabela
                    if (parcelasTableContainer) {
                        parcelasTableContainer.style.display = 'block';
                    }
                }
            } else {
                
                if (parcelamentoContainer) {
                    parcelamentoContainer.style.display = 'none';
                }
                if (parcelasTableContainer) {
                    parcelasTableContainer.style.display = 'none';
                }
            }
        } else {
            // Nova OS
            titulo.innerHTML = '<i class="fas fa-file-invoice"></i> Nova Ordem de Serviço';
            form.reset();
            document.getElementById('os-id').value = '';
            document.getElementById('os-data-abertura').value = Utils.getCurrentDate();
            document.getElementById('os-status').value = 'pendente';

            // Ocultar parcelamento
            const parcelamentoContainer = document.getElementById('parcelamento-container');
            const parcelasTableContainer = document.getElementById('parcelas-table-container');
            if (parcelamentoContainer) {
                parcelamentoContainer.style.display = 'none';
            }
            if (parcelasTableContainer) {
                parcelasTableContainer.style.display = 'none';
            }
        }

        modal.classList.add('is-open');
    },


    closeModal() {
        const modal = document.getElementById('modal-os');
        if (modal) modal.classList.remove('is-open');
    },

    async openDetalhes(osId) {
        this.osAtualId = osId;
        const os = await window.storage.getOSById(osId);

        if (!os) {
            Utils.showToast('OS não encontrada', 'error');
            return;
        }

        const cliente = await window.storage.getClienteById(os.clienteId);

        
        document.getElementById('detalhes-os-numero').textContent = `#${os.numero || '-'}`;

        // Status
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

        const statusBadge = document.getElementById('detalhes-os-status-badge');
        if (statusBadge) {
            statusBadge.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
        }

        // Cliente
        document.getElementById('detalhes-cliente-nome').textContent = cliente?.nome || '-';
        document.getElementById('detalhes-cliente-telefone').textContent = cliente?.telefone || '-';

        // Veículo
        document.getElementById('detalhes-veiculo-modelo').textContent = os.veiculoModelo || '-';
        document.getElementById('detalhes-veiculo-placa').textContent = os.veiculoPlaca || '-';
        document.getElementById('detalhes-veiculo-ano').textContent = os.veiculoAno || '-';
        document.getElementById('detalhes-km').textContent = os.km ? `${os.km} km` : '-';

        // Serviço
        document.getElementById('detalhes-problema').textContent = os.problema || 'Não informado';
        document.getElementById('detalhes-diagnostico').textContent = os.diagnostico || 'Não informado';
        document.getElementById('detalhes-servicos').textContent = os.servicos || 'Não informado';
        document.getElementById('detalhes-pecas').textContent = os.pecas || 'Nenhuma peça informada';

        // Valores
        document.getElementById('detalhes-valor-mao-obra').textContent = Utils.formatCurrency(os.valorMaoObra || 0);
        document.getElementById('detalhes-valor-pecas').textContent = Utils.formatCurrency(os.valorPecas || 0);
        document.getElementById('detalhes-valor-total').textContent = Utils.formatCurrency(os.valorTotal || 0);
        document.getElementById('detalhes-valor-pago').textContent = Utils.formatCurrency(os.valorPago || 0);

        const valorRestante = (os.valorTotal || 0) - (os.valorPago || 0);
        document.getElementById('detalhes-valor-restante').textContent = Utils.formatCurrency(valorRestante);

        // Datas
        document.getElementById('detalhes-data-abertura').textContent = Utils.formatDate(os.dataAbertura);
        document.getElementById('detalhes-data-previsao').textContent = Utils.formatDate(os.dataPrevisao) || 'Não definida';
        document.getElementById('detalhes-forma-pagamento').textContent = this.getFormaPagamentoTexto(os.formaPagamento);
        document.getElementById('detalhes-garantia').textContent = os.garantia ? `${os.garantia} dias` : 'Sem garantia';

        // Observações
        const observacoesSection = document.getElementById('detalhes-observacoes-section');
        const observacoesEl = document.getElementById('detalhes-observacoes');
        if (os.observacoes) {
            observacoesEl.textContent = os.observacoes;
            observacoesSection.style.display = 'block';
        } else {
            observacoesSection.style.display = 'none';
        }

        // Abrir modal PRIMEIRO
        const modal = document.getElementById('modal-detalhes-os');
        if (modal) {
            modal.classList.add('is-open');
        }

        // === ANEXAR EVENT LISTENERS APÓS MODAL ESTAR ABERTO ===
        setTimeout(() => {
            
            const btnFechar = document.getElementById('btn-fechar-detalhes-os');
            if (btnFechar) {
                btnFechar.onclick = () => {
                    this.closeDetalhes();
                };
            }

            // Backdrop clicar fora
            const modalDetalhes = document.getElementById('modal-detalhes-os');
            const backdrop = modalDetalhes?.querySelector('.modal__backdrop');
            if (backdrop) {
                backdrop.onclick = () => {
                    this.closeDetalhes();
                };
            }

            const btnVerCliente = document.getElementById('btn-ver-cliente-da-os');
            if (btnVerCliente) {
                btnVerCliente.onclick = () => {
                    if (os.clienteId) {
                        this.closeDetalhes();
                        if (window.router) {
                            window.router.navigateTo('clientes');
                        }
                        setTimeout(() => {
                            if (window.Clientes && window.Clientes.openDetalhes) {
                                window.Clientes.openDetalhes(os.clienteId);
                            }
                        }, 300);
                    }
                };
            }

            // Botão Editar
            const btnEditar = document.getElementById('btn-editar-os-detalhes');
            if (btnEditar) {
                btnEditar.onclick = () => {

                    
                    const modalDetalhes = document.getElementById('modal-detalhes-os');
                    if (modalDetalhes) {
                        modalDetalhes.classList.remove('is-open');
                    }

                    
                    setTimeout(() => {
                        const modal = document.getElementById('modal-os');
                        const titulo = document.getElementById('modal-os-titulo');
                        const form = document.getElementById('form-os');

                        if (!modal || !form) return;

                        
                        this.loadClientesSelect();

                        
                        titulo.innerHTML = '<i class="fas fa-file-invoice"></i> Editar Ordem de Serviço';
                        document.getElementById('os-id').value = os.id;
                        document.getElementById('os-cliente').value = os.clienteId || '';
                        document.getElementById('os-veiculo-modelo').value = os.veiculoModelo || '';
                        document.getElementById('os-veiculo-placa').value = os.veiculoPlaca || '';
                        document.getElementById('os-veiculo-ano').value = os.veiculoAno || '';
                        document.getElementById('os-km').value = os.km || '';
                        document.getElementById('os-problema').value = os.problema || '';
                        document.getElementById('os-diagnostico').value = os.diagnostico || '';
                        document.getElementById('os-servicos').value = os.servicos || '';
                        document.getElementById('os-pecas').value = os.pecas || '';
                        document.getElementById('os-valor-mao-obra').value = os.valorMaoObra || '';
                        document.getElementById('os-valor-pecas').value = os.valorPecas || '';
                        document.getElementById('os-valor-total').value = os.valorTotal || '';
                        document.getElementById('os-data-abertura').value = os.dataAbertura || '';
                        document.getElementById('os-data-previsao').value = os.dataPrevisao || '';
                        document.getElementById('os-forma-pagamento').value = os.formaPagamento || '';
                        document.getElementById('os-valor-pago').value = os.valorPago || '';
                        document.getElementById('os-status').value = os.status || 'pendente';
                        document.getElementById('os-garantia').value = os.garantia || '';
                        document.getElementById('os-observacoes').value = os.observacoes || '';

                        // Abrir modal
                        modal.classList.add('is-open');
                        ('[+] Modal de edição aberto');

                        // === ANEXAR LISTENERS DIRETAMENTE ===
                        setTimeout(() => {
                            // Botão Cancelar
                            const btnCancelar = document.getElementById('btn-cancelar-os');
                            if (btnCancelar) {
                                btnCancelar.onclick = (e) => {
                                    e.preventDefault();
                                    modal.classList.remove('is-open');
                                };
                            }

                            // Backdrop
                            const backdrop = modal.querySelector('.modal__backdrop');
                            if (backdrop) {
                                backdrop.onclick = () => {
                                    modal.classList.remove('is-open');
                                };
                            }

                            ('[+] Listeners inline anexados ao modal de edição');
                        }, 100);
                    }, 300);
                };
            }

            // Botão Imprimir
            const btnImprimir = document.getElementById('btn-imprimir-os');
            if (btnImprimir) {
                btnImprimir.onclick = () => {
                    Utils.showToast('Função de impressão em desenvolvimento...', 'info');
                };
            }

            ('[+] Event listeners dos botões anexados');
        }, 100);
    },

    closeDetalhes() {
        const modal = document.getElementById('modal-detalhes-os');
        if (modal) modal.classList.remove('is-open');
        this.osAtualId = null;
    },

    getFormaPagamentoTexto(forma) {
        const formas = {
            'dinheiro': 'Dinheiro',
            'pix': 'PIX',
            'debito': 'Cartão de Débito',
            'credito': 'Cartão de Crédito',
            'boleto': 'Boleto',
            'prazo': 'A Prazo'
        };
        return formas[forma] || 'Não informado';
    },

    gerarParcelas() {
        const valorTotal = parseFloat(document.getElementById('os-valor-total').value) || 0;
        const numParcelas = parseInt(document.getElementById('os-num-parcelas').value);
        const dataPrimeira = document.getElementById('os-data-primeira-parcela').value;

        if (valorTotal <= 0) {
            Utils.showToast('Defina o valor total antes de gerar parcelas', 'error');
            return;
        }

        if (!numParcelas) {
            Utils.showToast('Selecione o número de parcelas', 'error');
            return;
        }

        if (!dataPrimeira) {
            Utils.showToast('Defina a data da primeira parcela', 'error');
            return;
        }

        
        const valorParcela = (valorTotal / numParcelas).toFixed(2);
        const tbody = document.getElementById('parcelas-tbody');
        const container = document.getElementById('parcelas-table-container');

        tbody.innerHTML = '';

        
        for (let i = 1; i <= numParcelas; i++) {
           
            const dataParcela = new Date(dataPrimeira);
            dataParcela.setMonth(dataParcela.getMonth() + (i - 1));
            const dataFormatada = dataParcela.toISOString().split('T')[0];

            const tr = document.createElement('tr');
            tr.innerHTML = `
        <td><strong>${i}/${numParcelas}</strong></td>
        <td>
          <input type="date" class="parcela-data" data-index="${i}" value="${dataFormatada}">
        </td>
        <td>
          <input type="text" class="input-control parcela-desc" data-index="${i}" 
                 value="Parcela ${i}/${numParcelas}" style="max-width: 200px;">
        </td>
        <td>
          <select class="parcela-forma" data-index="${i}">
            <option value="dinheiro">Dinheiro</option>
            <option value="pix" selected>PIX</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
            <option value="boleto">Boleto</option>
          </select>
        </td>
        <td>
          <select class="parcela-status" data-index="${i}">
            <option value="entrada" ${i === 1 ? 'selected' : ''}>Entrada</option>
            <option value="pendente" ${i > 1 ? 'selected' : ''}>Pendente</option>
            <option value="pago">Pago</option>
          </select>
        </td>
        <td><strong>R$ ${valorParcela}</strong></td>
      `;
            tbody.appendChild(tr);
        }

        // Atualizar total
        document.getElementById('parcelas-total').textContent = Utils.formatCurrency(valorTotal);

        // Mostrar tabela
        container.style.display = 'block';

        Utils.showToast(`${numParcelas} parcelas geradas com sucesso!`, 'success');
    },


    async handleSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('os-id').value;
        const osData = {
            clienteId: document.getElementById('os-cliente').value,
            veiculoModelo: document.getElementById('os-veiculo-modelo').value.trim(),
            veiculoPlaca: document.getElementById('os-veiculo-placa').value.trim(),
            veiculoAno: document.getElementById('os-veiculo-ano').value.trim(),
            km: document.getElementById('os-km').value,
            problema: document.getElementById('os-problema').value.trim(),
            diagnostico: document.getElementById('os-diagnostico').value.trim(),
            servicos: document.getElementById('os-servicos').value.trim(),
            pecas: document.getElementById('os-pecas').value.trim(),
            valorMaoObra: parseFloat(document.getElementById('os-valor-mao-obra').value) || 0,
            valorPecas: parseFloat(document.getElementById('os-valor-pecas').value) || 0,
            valorTotal: parseFloat(document.getElementById('os-valor-total').value) || 0,
            dataAbertura: document.getElementById('os-data-abertura').value,
            dataPrevisao: document.getElementById('os-data-previsao').value,
            formaPagamento: document.getElementById('os-forma-pagamento').value,
            valorPago: 0, // Será calculado com base nas parcelas ou definido manualmente
            status: document.getElementById('os-status').value,
            garantia: document.getElementById('os-garantia').value,
            observacoes: document.getElementById('os-observacoes').value.trim()
        };

        // === COLETAR DADOS DE PARCELAMENTO ===
        let parcelas = null;
        const formaPagamento = document.getElementById('os-forma-pagamento');

        if (formaPagamento && formaPagamento.value === 'parcelado') {
            const tbody = document.getElementById('parcelas-tbody');

            if (tbody && tbody.children.length > 0) {
                parcelas = [];
                let valorPagoTotal = 0;

                Array.from(tbody.children).forEach((tr, index) => {
                    const dataInput = tr.querySelector('.parcela-data');
                    const descInput = tr.querySelector('.parcela-desc');
                    const formaSelect = tr.querySelector('.parcela-forma');
                    const statusSelect = tr.querySelector('.parcela-status');

                    const valorParcela = parseFloat((osData.valorTotal / tbody.children.length).toFixed(2));
                    const statusParcela = statusSelect ? statusSelect.value : 'pendente';

                    if (statusParcela === 'pago' || statusParcela === 'entrada') {
                        valorPagoTotal += valorParcela;
                    }

                    parcelas.push({
                        numero: index + 1,
                        data: dataInput ? dataInput.value : '',
                        descricao: descInput ? descInput.value : `Parcela ${index + 1}`,
                        forma: formaSelect ? formaSelect.value : 'pix',
                        status: statusParcela,
                        valor: valorParcela
                    });
                });

                osData.parcelas = parcelas;
                osData.numParcelas = parcelas.length;
                osData.valorPago = valorPagoTotal;
            }
        }

        // === SALVAR ===
        if (id) {
            // Atualizar
            await window.storage.updateOS(id, osData);
            Utils.showToast('OS atualizada com sucesso!', 'success');
        } else {
            // Criar
            await window.storage.addOS(osData);
            Utils.showToast('OS criada com sucesso!', 'success');
        }

        this.closeModal();
        await this.render();

        // Atualizar dashboard
        if (window.Dashboard) await window.Dashboard.render();
    }

};

window.OS = OS;
('[+] Módulo OS carregado');
