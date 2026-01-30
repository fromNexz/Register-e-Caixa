// js/caixa.js
if (window.Caixa) {
  console.warn('⚠️ Caixa já foi carregado, pulando redeclaração');
} else {
  window.Caixa = {
    initialized: false,

    init() {
      if (this.initialized) return;

      const btnEntrada = document.getElementById('btn-entrada');
      const btnSaida = document.getElementById('btn-saida');

      if (btnEntrada) {
        btnEntrada.addEventListener('click', () => {
          this.abrirModalMovimento('entrada');
        });
      }

      if (btnSaida) {
        btnSaida.addEventListener('click', () => {
          this.abrirModalMovimento('saida');
        });
      }

      this.initialized = true;
      console.log('✅ Módulo Caixa inicializado');
    },

    render() {
      this.init();
      this.renderResumo();
      this.renderTabela();
    },

    renderResumo() {
      const saldoInfo = window.storage.getSaldoCaixa();

      const elEntradas = document.getElementById('caixa-total-entradas');
      const elSaidas = document.getElementById('caixa-total-saidas');
      const elSaldo = document.getElementById('caixa-saldo');

      if (elEntradas) elEntradas.textContent = Utils.formatCurrency(saldoInfo.entradas);
      if (elSaidas) elSaidas.textContent = Utils.formatCurrency(saldoInfo.saidas);
      if (elSaldo) {
        elSaldo.textContent = Utils.formatCurrency(saldoInfo.saldo);
        // Colorir o saldo
        if (saldoInfo.saldo > 0) {
          elSaldo.style.color = '#10b981';
        } else if (saldoInfo.saldo < 0) {
          elSaldo.style.color = '#ef4444';
        } else {
          elSaldo.style.color = '#64748b';
        }
      }
    },

    renderTabela() {
      const tbody = document.getElementById('caixa-tbody');
      if (!tbody) return;

      const movimentos = window.storage.getMovimentosCaixa();

      tbody.innerHTML = '';

      if (movimentos.length === 0) {
        tbody.innerHTML = `
          <tr class="empty-row">
            <td colspan="4" style="text-align: center; padding: 2rem; color: #64748b; font-style: italic;">
              Nenhuma movimentação registrada
            </td>
          </tr>
        `;
        return;
      }

      // Ordenar por data (mais recente primeiro)
      movimentos.sort((a, b) => new Date(b.data) - new Date(a.data));

      movimentos.forEach(m => {
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
            ${m.descricao}
            ${m.osId ? `<br><small style="color: #64748b;">Vinculado a OS</small>` : ''}
          </td>
          <td style="color: ${m.tipo === 'entrada' ? '#10b981' : '#ef4444'}; font-weight: 600;">
            ${m.tipo === 'entrada' ? '+' : '-'} ${Utils.formatCurrency(m.valor)}
          </td>
        `;
        tbody.appendChild(tr);
      });
    },

    abrirModalMovimento(tipo) {
      const descricao = prompt(`Digite a descrição da ${tipo}:`);
      if (!descricao) return;

      const valorStr = prompt(`Digite o valor (R$):`);
      if (!valorStr) return;

      const valor = parseFloat(valorStr.replace(',', '.'));
      if (isNaN(valor) || valor <= 0) {
        Utils.showToast('Valor inválido!', 'error');
        return;
      }

      window.storage.addMovimentoCaixa({
        tipo: tipo,
        descricao: descricao,
        valor: valor,
        data: Utils.getCurrentDate()
      });

      Utils.showToast(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`, 'success');
      this.render();
      
      // Atualizar dashboard
      if (window.Dashboard) window.Dashboard.render();
    }
  };

  console.log('✅ Módulo Caixa carregado');
}
