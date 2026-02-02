// /js/relatorios.js
//
//       ATUALIZADO PARA RECEBER INDEXEDDB
//                 02/02/2026 
//@pedro

window.Relatorios = {
    chartReceita: null,
    chartStatus: null,

    async init() {
        ("[+] Relatórios inicializado");
        await  this.updateDashboardCards();
        await this.renderCharts();
    },

    async updateDashboardCards() {
        // CORREÇÃO: Usando window.storage oficial
        const transacoes = await window.storage.getMovimentosCaixa() || [];
        const ordens = await window.storage.getOS() || [];
        const clientes = await window.storage.getClientes() || [];

        const hoje = new Date();
        const mes = hoje.getMonth();
        const ano = hoje.getFullYear();

        const receita = transacoes
            .filter(t => {
                const d = new Date(t.data);
                return t.tipo === 'entrada' && t.status === 'confirmado' && d.getMonth() === mes && d.getFullYear() === ano;
            })
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        // Atualiza os cards do dashboard principal
        const elReceita = document.getElementById('dash-receita');
        if (elReceita) elReceita.textContent = Utils.formatCurrency(receita);
        
        const elOsConcluidas = document.getElementById('dash-os-concluidas');
        if (elOsConcluidas) elOsConcluidas.textContent = ordens.filter(o => o.status === 'concluido').length;
        
        const elClientes = document.getElementById('dash-novos-clientes');
        if (elClientes) elClientes.textContent = clientes.length;
        
        const elOsPendentes = document.getElementById('dash-os-pendentes');
        if (elOsPendentes) elOsPendentes.textContent = ordens.filter(o => o.status === 'pendente' || o.status === 'em_andamento').length;
    },

    async renderCharts() {
        const resCtx = document.getElementById('chartReceita');
        const staCtx = document.getElementById('chartStatus');
        if (!resCtx || !staCtx) return;

        if (this.chartReceita) this.chartReceita.destroy();
        if (this.chartStatus) this.chartStatus.destroy();

        const caixa = await window.storage.getMovimentosCaixa() || [];
        const os = await window.storage.getOS() || [];

        this.chartReceita = new Chart(resCtx, {
            type: 'bar',
            data: {
                labels: ['Geral'],
                datasets: [
                    { label: 'Entradas', data: [caixa.filter(t => t.tipo === 'entrada').reduce((a, b) => a + parseFloat(b.valor || 0), 0)], backgroundColor: '#2ecc71' },
                    { label: 'Saídas', data: [caixa.filter(t => t.tipo === 'saida').reduce((a, b) => a + parseFloat(b.valor || 0), 0)], backgroundColor: '#e74c3c' }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

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

    async exportarExcel() {
        if (typeof XLSX === 'undefined') return alert('Biblioteca Excel não carregada');
        const dados = await window.storage.getMovimentosCaixa() || [];
        const ws = XLSX.utils.json_to_sheet(dados);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Caixa");
        XLSX.writeFile(wb, "Relatorio_Oficina.xlsx");
    },

    async exportarPDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) return alert('Biblioteca PDF não carregada');
        const doc = new jsPDF();
        doc.text("Relatório de Caixa", 10, 10);
        const dados = (await window.storage.getMovimentosCaixa() || []).map(t => [t.data, t.descricao, t.valor]);
        doc.autoTable({ head: [['Data', 'Descrição', 'Valor']], body: dados });
        doc.save("Relatorio_Oficina.pdf");
    }
};
