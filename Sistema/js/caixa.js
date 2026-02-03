// js/caixa.js
//
//   ATUALIZADO PARA RECEBER INDEXEDDB
//            02/02/2026
// @pedro

if (window.Caixa) {
  console.warn('[!] Caixa já foi carregado, pulando redeclaração');
} else {
  window.Caixa = {
    initialized: false,
    tipoAtual: null,

    init() {
      // === TOGGLE FILTROS ===
      const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
      const filtrosContainer = document.getElementById('filtros-container');

      if (btnToggleFiltros && filtrosContainer) {
        btnToggleFiltros.addEventListener('click', () => {

          const isVisible = filtrosContainer.style.display === 'block';

          if (isVisible) {
            filtrosContainer.style.display = 'none';
            btnToggleFiltros.classList.remove('ativo');
          } else {
            filtrosContainer.style.display = 'block';
            btnToggleFiltros.classList.add('ativo');
          }
        });
      } else {
        console.error('[X] Botão ou container de filtros NÃO encontrado!', {
          btnToggleFiltros,
          filtrosContainer
        });
      }

      if (this.initialized) return;

      const btnEntrada = document.getElementById('btn-entrada');
      const btnSaida = document.getElementById('btn-saida');
      const btnFechar = document.getElementById('btn-fechar-modal-caixa');
      const btnCancelar = document.getElementById('btn-cancelar-caixa');
      const form = document.getElementById('form-caixa');
      const modal = document.getElementById('modal-caixa');
      const backdrop = modal?.querySelector('.modal__backdrop');

      // Event listeners
      if (btnEntrada) {
        btnEntrada.addEventListener('click', async () => await this.abrirModal('entrada'));
      }

      if (btnSaida) {
        btnSaida.addEventListener('click', async () => await this.abrirModal('saida'));
      }

      if (btnFechar) {
        btnFechar.addEventListener('click', async () => await this.fecharModal());
      }

      if (btnCancelar) {
        btnCancelar.addEventListener('click', async () => await this.fecharModal());
      }

      if (backdrop) {
        backdrop.addEventListener('click', async () => await this.fecharModal());
      }

      if (form) {
        form.addEventListener('submit', async (e) => await this.handleSubmit(e));
      }

      // === FILTROS ===
      const caixaBusca = document.getElementById('caixa-busca');
      const filtroTipo = document.getElementById('filtro-tipo');
      const filtroCategoria = document.getElementById('filtro-categoria');
      const filtroStatus = document.getElementById('filtro-status');
      const filtroFormaPagamento = document.getElementById('filtro-forma-pagamento');
      const filtroDataInicio = document.getElementById('filtro-data-inicio');
      const filtroDataFim = document.getElementById('filtro-data-fim');
      const btnLimparFiltros = document.getElementById('btn-limpar-filtros');

      if (caixaBusca) {
        caixaBusca.addEventListener('input', () => this.renderTabela());
      }

      if (filtroTipo) {
        filtroTipo.addEventListener('change', () => this.renderTabela());
      }

      if (filtroCategoria) {
        filtroCategoria.addEventListener('change', () => this.renderTabela());
      }

      if (filtroStatus) {
        filtroStatus.addEventListener('change', () => this.renderTabela());
      }

      if (filtroFormaPagamento) {
        filtroFormaPagamento.addEventListener('change', () => this.renderTabela());
      }

      if (filtroDataInicio) {
        filtroDataInicio.addEventListener('change', () => this.renderTabela());
      }

      if (filtroDataFim) {
        filtroDataFim.addEventListener('change', () => this.renderTabela());
      }

      if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', () => this.limparFiltros());
      }

      
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modalElement = document.getElementById('modal-caixa');
          if (modalElement?.classList.contains('is-open')) {
            this.fecharModal();
          }
        }
      });

      this.initialized = true;
      ('[+] Módulo Caixa inicializado');
    },

    async render() {
      this.init();
      await this.renderResumo();
      await this.renderTabela();
    },

    abrirModal(tipo) {
      this.tipoAtual = tipo;
      const modal = document.getElementById('modal-caixa');
      const titulo = document.getElementById('modal-caixa-titulo');
      const form = document.getElementById('form-caixa');
      const inputTipo = document.getElementById('caixa-tipo');

      if (!modal || !form) return;

      
      form.reset();

     
      inputTipo.value = tipo;

      
      if (tipo === 'entrada') {
        titulo.innerHTML = '<i class="fas fa-arrow-down"></i> Nova Entrada';
        document.getElementById('caixa-categoria').value = 'venda_os';
      } else {
        titulo.innerHTML = '<i class="fas fa-arrow-up"></i> Nova Saída';
        document.getElementById('caixa-categoria').value = 'fornecedor';
      }

      
      document.getElementById('caixa-data').value = Utils.getCurrentDate();
      document.getElementById('caixa-status').value = 'confirmado';

      
      modal.classList.add('is-open');
    },

    fecharModal() {
      const modal = document.getElementById('modal-caixa');
      if (modal) modal.classList.remove('is-open');
      this.tipoAtual = null;
    },

    async renderResumo() {
      const saldoInfo = await window.storage.getSaldoCaixa();

      const elEntradas = document.getElementById('caixa-total-entradas');
      const elSaidas = document.getElementById('caixa-total-saidas');
      const elSaldo = document.getElementById('caixa-saldo');

      if (elEntradas) elEntradas.textContent = Utils.formatCurrency(saldoInfo.entradas);
      if (elSaidas) elSaidas.textContent = Utils.formatCurrency(saldoInfo.saidas);
      if (elSaldo) {
        elSaldo.textContent = Utils.formatCurrency(saldoInfo.saldo);
        
        if (saldoInfo.saldo > 0) {
          elSaldo.style.color = '#10b981';
        } else if (saldoInfo.saldo < 0) {
          elSaldo.style.color = '#ef4444';
        } else {
          elSaldo.style.color = '#64748b';
        }
      }
    },

    async renderTabela() {
      const tbody = document.getElementById('caixa-tbody');
      if (!tbody) return;

      const movimentos = await window.storage.getMovimentosCaixa();

      // === APLICAR FILTROS ===
      const busca = document.getElementById('caixa-busca')?.value.toLowerCase() || '';
      const filtroTipo = document.getElementById('filtro-tipo')?.value || '';
      const filtroCategoria = document.getElementById('filtro-categoria')?.value || '';
      const filtroStatus = document.getElementById('filtro-status')?.value || '';
      const filtroFormaPagamento = document.getElementById('filtro-forma-pagamento')?.value || '';
      const filtroDataInicio = document.getElementById('filtro-data-inicio')?.value || '';
      const filtroDataFim = document.getElementById('filtro-data-fim')?.value || '';

      const movimentosFiltrados = movimentos.filter(m => {

        if (busca && !m.descricao.toLowerCase().includes(busca)) return false;

        if (filtroTipo && m.tipo !== filtroTipo) return false;

        if (filtroCategoria && m.categoria !== filtroCategoria) return false;

        if (filtroStatus && m.status !== filtroStatus) return false;

        if (filtroFormaPagamento && m.formaPagamento !== filtroFormaPagamento) return false;

        if (filtroDataInicio && m.data < filtroDataInicio) return false;
        if (filtroDataFim && m.data > filtroDataFim) return false;

        return true;
      });

      tbody.innerHTML = '';

      if (movimentosFiltrados.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="4" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
              ${busca || filtroTipo || filtroCategoria || filtroStatus || filtroFormaPagamento || filtroDataInicio || filtroDataFim
            ? 'Nenhuma movimentação encontrada com os filtros selecionados'
            : 'Nenhuma movimentação registrada'}
            </td>
          </tr>
        `;
        return;
      }


      movimentosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));

      movimentosFiltrados.forEach(m => {
        const tr = document.createElement('tr');

        tr.innerHTML = `
          <td>${Utils.formatDate(m.data)}</td>
          <td>
            <span class="badge badge-${m.tipo === 'entrada' ? 'ok' : 'atraso'}">
              <i class="fas fa-arrow-${m.tipo === 'entrada' ? 'down' : 'up'}"></i>
              ${m.tipo === 'entrada' ? 'Entrada' : 'Saída'}
            </span>
          </td>
          <td>
            <strong>${m.descricao}</strong>
            ${m.categoria ? `<br><small style="color: #64748b;">📂 ${this.getCategoriaTexto(m.categoria)}</small>` : ''}
            ${m.observacoes ? `<br><small style="color: #64748b;">📝 ${m.observacoes}</small>` : ''}
          </td>
          <td style="color: ${m.tipo === 'entrada' ? '#10b981' : '#ef4444'}; font-weight: 600;">
            ${m.tipo === 'entrada' ? '+' : '-'} ${Utils.formatCurrency(m.valor)}
          </td>
        `;
        tbody.appendChild(tr);
      });


      this.atualizarResumoFiltrado(movimentosFiltrados);
    },

    atualizarResumoFiltrado(movimentos) {
      let totalEntradas = 0;
      let totalSaidas = 0;

      movimentos.forEach(m => {
        if (m.tipo === 'entrada') {
          totalEntradas += m.valor;
        } else {
          totalSaidas += m.valor;
        }
      });

      const saldo = totalEntradas - totalSaidas;

      const elEntradas = document.getElementById('caixa-total-entradas');
      const elSaidas = document.getElementById('caixa-total-saidas');
      const elSaldo = document.getElementById('caixa-saldo');

      if (elEntradas) elEntradas.textContent = Utils.formatCurrency(totalEntradas);
      if (elSaidas) elSaidas.textContent = Utils.formatCurrency(totalSaidas);
      if (elSaldo) {
        elSaldo.textContent = Utils.formatCurrency(saldo);
        if (saldo > 0) {
          elSaldo.style.color = '#10b981';
        } else if (saldo < 0) {
          elSaldo.style.color = '#ef4444';
        } else {
          elSaldo.style.color = '#64748b';
        }
      }
    },

    getCategoriaTexto(categoria) {
      const categorias = {
        'venda_os': 'Venda de OS',
        'venda_pecas': 'Venda de Peças',
        'servico': 'Serviço Adicional',
        'devolucao': 'Devolução',
        'outros': 'Outros',
        'fornecedor': 'Fornecedor',
        'funcionarios': 'Funcionários',
        'aluguel': 'Aluguel',
        'utilidades': 'Utilidades'
      };
      return categorias[categoria] || categoria;
    },

    async limparFiltros() {
      document.getElementById('caixa-busca').value = '';
      document.getElementById('filtro-tipo').value = '';
      document.getElementById('filtro-categoria').value = '';
      document.getElementById('filtro-status').value = '';
      document.getElementById('filtro-forma-pagamento').value = '';
      document.getElementById('filtro-data-inicio').value = '';
      document.getElementById('filtro-data-fim').value = '';

      Utils.showToast('Filtros limpos!', 'info');
      await this.renderTabela();
    },

    async handleSubmit(e) {
      e.preventDefault();

      const tipo = document.getElementById('caixa-tipo').value;
      const descricao = document.getElementById('caixa-descricao').value.trim();
      const data = document.getElementById('caixa-data').value;
      const valor = parseFloat(document.getElementById('caixa-valor').value);
      const formaPagamento = document.getElementById('caixa-forma-pagamento').value;
      const categoria = document.getElementById('caixa-categoria').value;
      const status = document.getElementById('caixa-status').value;
      const observacoes = document.getElementById('caixa-observacoes').value.trim();

      // Validações
      if (!descricao) {
        Utils.showToast('Descrição é obrigatória', 'error');
        return;
      }

      if (isNaN(valor) || valor <= 0) {
        Utils.showToast('Valor inválido', 'error');
        return;
      }

      // Criar movimento
      const movimento = {
        tipo: tipo,
        descricao: descricao,
        data: data,
        valor: valor,
        formaPagamento: formaPagamento,
        categoria: categoria,
        status: status,
        observacoes: observacoes
      };

      // Salvar
      await window.storage.addMovimentoCaixa(movimento);

      const tipoTexto = tipo === 'entrada' ? 'Entrada' : 'Saída';
      Utils.showToast(`${tipoTexto} registrada com sucesso!`, 'success');

      this.fecharModal();
      await this.render();

      // Atualizar dashboard
      if (window.Dashboard) window.Dashboard.render();
    }
  };

  ('[+] Módulo Caixa carregado');
}
