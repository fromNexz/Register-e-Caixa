/**
 * Módulo de Relatórios - Oficina Manager
 */
window.Relatorios = {
    chartReceita: null,
    chartStatus: null,

    init() {
        console.log(\"Relatórios carregado\");
        this.updateDashboardCards();
        this.renderCharts();
    },

    updateDashboardCards() {
        const transacoes = Storage.get('caixa') || [];
        const ordens = Storage.get('os') || [];
        const clientes = Storage.get('clientes') || [];

        const hoje = new Date();
        const mes = hoje.getMonth();
        const ano = hoje.getFullYear();

        const receita = transacoes
            .filter(t => {
                const d = new Date(t.data);
                return t.tipo === 'entrada' && t.status === 'confirmado' && d.getMonth() === mes && d.getFullYear() === ano;
            })
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        const cards = document.querySelectorAll('.card-value');
        if (cards.length >= 4) {
            cards[0].textContent = Utils.formatCurrency(receita);
            cards[1].textContent = ordens.filter(o => o.status === 'concluido').length;
            cards[2].textContent = clientes.length;
            cards[3].textContent = ordens.filter(o => o.status === 'pendente').length;
        }
    },

    renderCharts() {
        const resCtx = document.getElementById('chartReceita');
        const staCtx = document.getElementById('chartStatus');
        if (!resCtx || !staCtx) return;

        if (this.chartReceita) this.chartReceita.destroy();
        if (this.chartStatus) this.chartStatus.destroy();

        const caixa = Storage.get('caixa') || [];
        const os = Storage.get('os') || [];

        // Gráfico de Barras
        this.chartReceita = new Chart(resCtx, {
            type: 'bar',
            data: {
                labels: ['Mês Atual'],
                datasets: [
                    { label: 'Entradas', data: [caixa.filter(t => t.tipo === 'entrada').reduce((a, b) => a + parseFloat(b.valor || 0), 0)], backgroundColor: '#2ecc71' },
                    { label: 'Saídas', data: [caixa.filter(t => t.tipo === 'saida').reduce((a, b) => a + parseFloat(b.valor || 0), 0)], backgroundColor: '#e74c3c' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // Gráfico de Rosca
        this.chartStatus = new Chart(staCtx, {
            type: 'doughnut',
            data: {
                labels: ['Pendente', 'Concluído'],
                datasets: [{
                    data: [os.filter(o => o.status === 'pendente').length, os.filter(o => o.status === 'concluido').length],
                    backgroundColor: ['#f1c40f', '#2ecc71']
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    },

    exportarExcel() {
        if (typeof XLSX === 'undefined') return alert('Biblioteca Excel não carregada');
        const dados = Storage.get('caixa') || [];
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, \"Caixa\");
        XLSX.writeFile(wb, \"Relatorio_Oficina.xlsx\");
    },

    exportarPDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) return alert('Biblioteca PDF não carregada');
        const doc = new jsPDF();
        doc.text(\"Relatório de Caixa\", 10, 10);
        const dados = (Storage.get('caixa') || []).map(t => [t.data, t.descricao, t.valor]);
        doc.autoTable({ head: [['Data', 'Descrição', 'Valor']], body: dados });
        doc.save(\"Relatorio_Oficina.pdf\");
    }
};
