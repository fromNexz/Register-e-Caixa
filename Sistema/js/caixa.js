// js/caixa.js
//
// ATUALIZADO PARA RECEBER INDEXEDDB
// 02/02/2026
// @pedro
// ATUALIZADO: 07/02/2026 - Contabilização mensal adicionada


if (window.Caixa) {
  console.warn('[!] Caixa já foi carregado, pulando redeclaração');
} else {
  window.Caixa = {
    initialized: false,
    tipoAtual: null,
    mesAtual: new Date().toISOString().slice(0, 7), // Formato: YYYY-MM


    async init() {
      // Aguardar DOM estar completamente carregado
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', () => resolve());
        });
      }


      console.log('[+] Iniciando módulo Caixa...');


      // === TOGGLE FILTROS ===
      const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
      const filtrosContainer = document.getElementById('filtros-container');


      if (btnToggleFiltros && filtrosContainer) {
        btnToggleFiltros.addEventListener('click', () => {
          const isVisible = filtrosContainer.style.display === 'block';


          if (isVisible) {
            filtrosContainer.style.display = 'none';
            btnToggleFiltros.classList.remove('ativo');
            console.log('[✓] Filtros ocultados');
          } else {
            filtrosContainer.style.display = 'block';
            btnToggleFiltros.classList.add('ativo');
            console.log('[✓] Filtros exibidos');
          }
        });
        console.log('[✓] Botão de filtros inicializado');
      } else {
        console.error('[X] Botão ou container de filtros NÃO encontrado!', {
          btnToggleFiltros,
          filtrosContainer
        });
      }



      if (this.initialized) {
        console.log('[i] Caixa já foi inicializado, pulando...');
        return;
      }


      // === BOTÕES PRINCIPAIS ===
      const btnEntrada = document.getElementById('btn-entrada');
      const btnSaida = document.getElementById('btn-saida');
      const btnFechar = document.getElementById('btn-fechar-modal-caixa');
      const btnCancelar = document.getElementById('btn-cancelar-caixa');
      const form = document.getElementById('form-caixa');
      const modal = document.getElementById('modal-caixa');
      const backdrop = modal?.querySelector('.modal__backdrop');


      // Garantir que os elementos existem antes de adicionar listeners
      if (btnEntrada) {
        btnEntrada.addEventListener('click', () => this.abrirModal('entrada'));
        console.log('[✓] Botão Entrada inicializado');
      } else {
        console.error('[X] Botão Entrada NÃO encontrado!');
      }


      if (btnSaida) {
        btnSaida.addEventListener('click', () => this.abrirModal('saida'));
        console.log('[✓] Botão Saída inicializado');
      } else {
        console.error('[X] Botão Saída NÃO encontrado!');
      }


      if (btnFechar) {
        btnFechar.addEventListener('click', () => this.fecharModal());
        console.log('[✓] Botão Fechar modal inicializado');
      }


      if (btnCancelar) {
        btnCancelar.addEventListener('click', () => this.fecharModal());
        console.log('[✓] Botão Cancelar inicializado');
      }


      if (backdrop) {
        backdrop.addEventListener('click', () => this.fecharModal());
        console.log('[✓] Backdrop modal inicializado');
      }


      if (form) {
        form.addEventListener('submit', (e) => this.handleSubmit(e));
        console.log('[✓] Formulário de caixa inicializado');
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

      // === BOTÕES DE NAVEGAÇÃO MENSAL ===
      const btnMesAnterior = document.getElementById('btn-mes-anterior');
      const btnMesProximo = document.getElementById('btn-mes-proximo');
      const btnMesAtual = document.getElementById('btn-mes-atual');


      if (btnMesAnterior) {
        btnMesAnterior.addEventListener('click', () => this.mudarMes('anterior'));
        console.log('[✓] Botão Mês Anterior inicializado');
      }


      if (btnMesProximo) {
        btnMesProximo.addEventListener('click', () => this.mudarMes('proximo'));
        console.log('[✓] Botão Mês Próximo inicializado');
      }


      if (btnMesAtual) {
        btnMesAtual.addEventListener('click', () => {
          this.mesAtual = new Date().toISOString().slice(0, 7);
          this.render();
          console.log('[✓] Voltou para o mês atual');
        });
        console.log('[✓] Botão Mês Atual inicializado');
      }


      if (caixaBusca) {
        caixaBusca.addEventListener('input', async () => await this.renderTabela());
        console.log('[✓] Campo de busca inicializado');
      }


      if (filtroTipo) {
        filtroTipo.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Tipo inicializado');
      }


      if (filtroCategoria) {
        filtroCategoria.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Categoria inicializado');
      }


      if (filtroStatus) {
        filtroStatus.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Status inicializado');
      }


      if (filtroFormaPagamento) {
        filtroFormaPagamento.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Forma de Pagamento inicializado');
      }


      if (filtroDataInicio) {
        filtroDataInicio.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Data Início inicializado');
      }


      if (filtroDataFim) {
        filtroDataFim.addEventListener('change', async () => await this.renderTabela());
        console.log('[✓] Filtro Data Fim inicializado');
      }


      if (btnLimparFiltros) {
        btnLimparFiltros.addEventListener('click', async () => await this.limparFiltros());
        console.log('[✓] Botão Limpar Filtros inicializado');
      }


      // Tecla Escape para fechar modal
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          const modalElement = document.getElementById('modal-caixa');
          if (modalElement?.classList.contains('is-open')) {
            this.fecharModal();
          }
        }
      });


      this.initialized = true;
      console.log('[✓] Módulo Caixa inicializado com sucesso!');
    },




    async render() {
      await this.init();
      await this.renderResumo();
      await this.renderResumoMensal();
      await this.renderTabela();
    },


    abrirModal(tipo) {
      this.tipoAtual = tipo;
      const modal = document.getElementById('modal-caixa');
      const titulo = document.getElementById('modal-caixa-titulo');
      const form = document.getElementById('form-caixa');
      const inputTipo = document.getElementById('caixa-tipo');


      if (!modal || !form) {
        console.error('[X] Modal ou formulário NÃO encontrado!');
        return;
      }


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
      console.log(`[✓] Modal de ${tipo} aberto`);
    },


    fecharModal() {
      const modal = document.getElementById('modal-caixa');
      if (modal) {
        modal.classList.remove('is-open');
      }
      this.tipoAtual = null;
      console.log('[✓] Modal fechado');
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

    async renderResumoMensal() {
      const [ano, mes] = this.mesAtual.split('-');
      const movimentos = await window.storage.getMovimentosCaixa();

      // Array de nomes dos meses
      const nomesMeses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

      // Filtrar movimentos do mês selecionado
      const movimentosMes = movimentos.filter(m => {
        const dataMovimento = m.data.slice(0, 7); // YYYY-MM
        return dataMovimento === this.mesAtual;
      });

      let entradas = 0;
      let saidas = 0;

      movimentosMes.forEach(m => {
        if (m.tipo === 'entrada') {
          entradas += m.valor;
        } else {
          saidas += m.valor;
        }
      });

      const saldo = entradas - saidas;

      // Atualizar elementos do DOM
      const elMesAno = document.getElementById('caixa-mes-ano');
      const elEntradasMes = document.getElementById('caixa-entradas-mes');
      const elSaidasMes = document.getElementById('caixa-saidas-mes');
      const elSaldoMes = document.getElementById('caixa-saldo-mes');

      if (elMesAno) {
        elMesAno.textContent = `${nomesMeses[parseInt(mes) - 1]} ${ano}`;
      }

      if (elEntradasMes) elEntradasMes.textContent = Utils.formatCurrency(entradas);
      if (elSaidasMes) elSaidasMes.textContent = Utils.formatCurrency(saidas);
      if (elSaldoMes) {
        elSaldoMes.textContent = Utils.formatCurrency(saldo);
        elSaldoMes.style.color = saldo > 0 ? '#10b981' : saldo < 0 ? '#ef4444' : '#64748b';
      }

      console.log(`[✓] Resumo mensal renderizado: ${nomesMeses[parseInt(mes) - 1]}/${ano}`);
    },

    mudarMes(direcao) {
      const [ano, mes] = this.mesAtual.split('-').map(Number);
      const data = new Date(ano, mes - 1, 1);


      if (direcao === 'anterior') {
        data.setMonth(data.getMonth() - 1);
      } else {
        data.setMonth(data.getMonth() + 1);
      }


      this.mesAtual = data.toISOString().slice(0, 7);
      console.log(`[✓] Mês alterado para: ${this.mesAtual}`);
      this.render();
    },


    async renderTabela() {
      const tbody = document.getElementById('caixa-tbody');
      if (!tbody) return;


      const movimentos = await window.storage.getMovimentosCaixa();

      // Filtrar apenas movimentos do mês atual
      const movimentosMes = movimentos.filter(m => {
        return m.data.slice(0, 7) === this.mesAtual;
      });


      // === APLICAR FILTROS ADICIONAIS ===
      const busca = document.getElementById('caixa-busca')?.value.toLowerCase() || '';
      const filtroTipo = document.getElementById('filtro-tipo')?.value || '';
      const filtroCategoria = document.getElementById('filtro-categoria')?.value || '';
      const filtroStatus = document.getElementById('filtro-status')?.value || '';
      const filtroFormaPagamento = document.getElementById('filtro-forma-pagamento')?.value || '';
      const filtroDataInicio = document.getElementById('filtro-data-inicio')?.value || '';
      const filtroDataFim = document.getElementById('filtro-data-fim')?.value || '';


      const movimentosFiltrados = movimentosMes.filter(m => {
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
                <td colspan="6" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
                    ${busca || filtroTipo || filtroCategoria || filtroStatus || filtroFormaPagamento || filtroDataInicio || filtroDataFim
            ? 'Nenhuma movimentação encontrada com os filtros selecionados'
            : 'Nenhuma movimentação registrada neste mês'}
                </td>
            </tr>
        `;
        return;
      }


      movimentosFiltrados.sort((a, b) => new Date(b.data) - new Date(a.data));


      movimentosFiltrados.forEach(m => {
        const tr = document.createElement('tr');


        const badgeStatus = m.status === 'confirmado'
          ? '<span class="badge badge-ok" style="background: #2ecc71; color: white; font-size: 0.65rem; padding: 0.25rem 0.5rem; margin-top: 0.25rem; display: inline-block; border-radius: 12px;"><i class="fas fa-check-circle" style="margin-right: 0.25rem;"></i>Confirmado</span>'
          : '<span class="badge badge-pendente" style="background: #f39c12; color: white; font-size: 0.65rem; padding: 0.25rem 0.5rem; margin-top: 0.25rem; display: inline-block; border-radius: 12px;"><i class="fas fa-clock" style="margin-right: 0.25rem;"></i>Pendente</span>';



        const botoesAcao = m.status === 'pendente'
          ? `<button class="btn btn-sm btn-primary" onclick="window.Caixa.confirmarMovimento('${m.id}')">
                  <i class="fas fa-check"></i> Confirmar
               </button>`
          : `<button class="btn btn-sm btn-secondary" disabled>
                  <i class="fas fa-check"></i> Confirmado
               </button>`;


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
                <br><small style="color: #64748b;">${badgeStatus}</small>
                ${m.categoria ? `<br><small style="color: #64748b;">📂 ${this.getCategoriaTexto(m.categoria)}</small>` : ''}
                ${m.observacoes ? `<br><small style="color: #64748b;">📝 ${m.observacoes}</small>` : ''}
            </td>
            <td style="color: ${m.tipo === 'entrada' ? '#10b981' : '#ef4444'}; font-weight: 600;">
                ${m.tipo === 'entrada' ? '+' : '-'} ${Utils.formatCurrency(m.valor)}
            </td>
            <td style="text-align: center;">
                <div style="display: flex; gap: 0.3rem; justify-content: center;">
                    <button class="btn btn-sm btn-warning" onclick="window.Caixa.editarMovimento('${m.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="window.Caixa.excluirMovimento('${m.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                    ${botoesAcao}
                </div>
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
    },


    async editarMovimento(id) {
      const movimento = await window.storage.getMovimentoCaixaById(id);


      if (!movimento) {
        Utils.showToast('Movimento não encontrado', 'error');
        return;
      }


      // Preencher formulário
      document.getElementById('caixa-tipo').value = movimento.tipo;
      document.getElementById('caixa-descricao').value = movimento.descricao;
      document.getElementById('caixa-data').value = movimento.data;
      document.getElementById('caixa-valor').value = movimento.valor;
      document.getElementById('caixa-forma-pagamento').value = movimento.formaPagamento;
      document.getElementById('caixa-categoria').value = movimento.categoria;
      document.getElementById('caixa-status').value = movimento.status;
      document.getElementById('caixa-observacoes').value = movimento.observacoes;


      // Salvar ID do movimento sendo editado
      document.getElementById('caixa-id').value = movimento.id;


      // Abrir modal
      this.abrirModal(movimento.tipo);
      console.log(`[✓] Editando movimento ${id}`);
    },


    async confirmarMovimento(id) {
      const movimento = await window.storage.getMovimentoCaixaById(id);


      if (!movimento) {
        Utils.showToast('Movimento não encontrado', 'error');
        return;
      }


      if (movimento.status === 'confirmado') {
        Utils.showToast('Movimento já está confirmado', 'info');
        return;
      }


      if (confirm(`Deseja confirmar este movimento?`)) {
        movimento.status = 'confirmado';
        await window.storage.updateMovimentoCaixa(movimento);
        Utils.showToast('Movimento confirmado com sucesso!', 'success');
        await this.render();
      }
    },


    async excluirMovimento(id) {
      abrirModalConfirmacaoExclusao(id, 'caixa');
    }

  };
  console.log('[+] Módulo Caixa carregado');
}

