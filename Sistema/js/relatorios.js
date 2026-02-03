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
        await this.updateDashboardCards();
        await this.renderCharts();
    },

    async updateDashboardCards() {

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
        const hoje = new Date();

        // Preparar dados formatados
        const dadosFormatados = dados.map(t => ({
            'Data': Utils.formatDate(new Date(t.data)),
            'Tipo': t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída',
            'Descrição': t.descricao || '-',
            'Categoria': t.categoria || '-',
            'Forma de Pagamento': t.formaPagamento || '-',
            'Valor (R$)': parseFloat(t.valor || 0),
            'Status': t.status === 'confirmado' ? '✓ Confirmado' : '⏳ Pendente'
        }));

        // Criar workbook
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(dadosFormatados);

        // Configurar largura das colunas
        ws['!cols'] = [
            { wch: 12 }, // Data
            { wch: 10 }, // Tipo
            { wch: 25 }, // Descrição
            { wch: 15 }, // Categoria
            { wch: 18 }, // Forma de Pagamento
            { wch: 14 }, // Valor
            { wch: 13 }  // Status
        ];

        // Formatar cabeçalho
        const cabecalho = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Forma de Pagamento', 'Valor (R$)', 'Status'];
        cabecalho.forEach((col, idx) => {
            const celula = ws[XLSX.utils.encode_cell({ r: 0, c: idx })];
            if (celula) {
                celula.s = {
                    fill: { fgColor: { rgb: 'FF218088' } }, // Cor verde do Register-e-Caixa
                    font: { bold: true, color: { rgb: 'FFFFFFFF' }, size: 12 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: 'FF000000' } },
                        bottom: { style: 'thin', color: { rgb: 'FF000000' } },
                        left: { style: 'thin', color: { rgb: 'FF000000' } },
                        right: { style: 'thin', color: { rgb: 'FF000000' } }
                    }
                };
            }
        });

        // Formatar dados (números com 2 casas decimais)
        dadosFormatados.forEach((_, idx) => {
            const celula = ws[XLSX.utils.encode_cell({ r: idx + 1, c: 5 })];
            if (celula) {
                celula.z = 'R$ #,##0.00';
                celula.s = {
                    alignment: { horizontal: 'right' },
                    border: {
                        top: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        bottom: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        left: { style: 'thin', color: { rgb: 'FFCCCCCC' } },
                        right: { style: 'thin', color: { rgb: 'FFCCCCCC' } }
                    }
                };
            }
        });

        // Congelar cabeçalho
        ws['!freeze'] = { xSplit: 0, ySplit: 1 };

        // Calcular totais
        const totalEntradas = dados
            .filter(t => t.tipo === 'entrada' && t.status === 'confirmado')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        const totalSaidas = dados
            .filter(t => t.tipo === 'saida' && t.status === 'confirmado')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        const saldo = totalEntradas - totalSaidas;

        // Adicionar linha de totais
        const linhaTotal = dadosFormatados.length + 2;
        ws[XLSX.utils.encode_cell({ r: linhaTotal, c: 4 })] = { v: 'TOTAL ENTRADAS:', s: { font: { bold: true } } };
        ws[XLSX.utils.encode_cell({ r: linhaTotal, c: 5 })] = { v: totalEntradas, z: 'R$ #,##0.00', s: { font: { bold: true }, fill: { fgColor: { rgb: 'FFCCFFCC' } } } };

        const linhaSaidas = linhaTotal + 1;
        ws[XLSX.utils.encode_cell({ r: linhaSaidas, c: 4 })] = { v: 'TOTAL SAÍDAS:', s: { font: { bold: true } } };
        ws[XLSX.utils.encode_cell({ r: linhaSaidas, c: 5 })] = { v: totalSaidas, z: 'R$ #,##0.00', s: { font: { bold: true }, fill: { fgColor: { rgb: 'FFCCCCFF' } } } };

        const linhaSaldo = linhaSaidas + 1;
        ws[XLSX.utils.encode_cell({ r: linhaSaldo, c: 4 })] = { v: 'SALDO:', s: { font: { bold: true, size: 12 } } };
        ws[XLSX.utils.encode_cell({ r: linhaSaldo, c: 5 })] = { v: saldo, z: 'R$ #,##0.00', s: { font: { bold: true, size: 12 }, fill: { fgColor: { rgb: 'FFFFFF99' } } } };

        XLSX.utils.book_append_sheet(wb, ws, "Relatório Caixa");
        XLSX.writeFile(wb, `Relatorio_Caixa_${Utils.formatDate(hoje).replace(/\//g, '-')}.xlsx`);
    },

    async exportarPDF() {
        const { jsPDF } = window.jspdf;
        if (!jsPDF) return alert('Biblioteca PDF não carregada');

        const dados = await window.storage.getMovimentosCaixa() || [];
        const hoje = new Date();

        // Criar documento
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        let yPosition = 15;

        // Cabeçalho com título e data
        doc.setFillColor(33, 128, 141); // Cor do Register-e-Caixa
        doc.rect(0, 0, pageWidth, 25, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont(undefined, 'bold');
        doc.text('OFICINA', 14, 12);

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Relatório de Movimentações - ${Utils.formatDate(hoje)}`, 14, 20);

        doc.setTextColor(0, 0, 0);
        yPosition = 35;

        // Resumo do período
        const totalEntradas = dados
            .filter(t => t.tipo === 'entrada' && t.status === 'confirmado')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        const totalSaidas = dados
            .filter(t => t.tipo === 'saida' && t.status === 'confirmado')
            .reduce((acc, t) => acc + parseFloat(t.valor || 0), 0);

        const saldo = totalEntradas - totalSaidas;

        // Cards de resumo
        doc.setFontSize(11);
        doc.setFont(undefined, 'bold');
        doc.text('Resumo do Período', 14, yPosition);
        yPosition += 8;

        // Card Entradas
        doc.setFillColor(230, 255, 230);
        doc.rect(14, yPosition, 55, 18, 'F');
        doc.setTextColor(39, 174, 96);
        doc.setFontSize(10);
        doc.text('Total de Entradas', 17, yPosition + 5);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(Utils.formatCurrency(totalEntradas), 17, yPosition + 13);

        // Card Saídas
        doc.setFillColor(255, 230, 230);
        doc.rect(75, yPosition, 55, 18, 'F');
        doc.setTextColor(220, 53, 69);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Total de Saídas', 78, yPosition + 5);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(Utils.formatCurrency(totalSaidas), 78, yPosition + 13);

        // Card Saldo
        doc.setFillColor(255, 255, 230);
        doc.rect(136, yPosition, 55, 18, 'F');
        doc.setTextColor(255, 193, 7);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);
        doc.text('Saldo', 139, yPosition + 5);
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(Utils.formatCurrency(saldo), 139, yPosition + 13);

        yPosition += 30;

        // Tabela de movimentações
        const dadosTabela = dados.map(t => [
            Utils.formatDate(new Date(t.data)),
            t.tipo === 'entrada' ? '📥 Entrada' : '📤 Saída',
            t.descricao || '-',
            t.categoria || '-',
            Utils.formatCurrency(parseFloat(t.valor || 0)),
            t.status === 'confirmado' ? '✓' : '⏳'
        ]);

        doc.autoTable({
            head: [['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Status']],
            body: dadosTabela,
            startY: yPosition,
            theme: 'grid',
            headStyles: {
                fillColor: [33, 128, 141],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10,
                alignment: 'center'
            },
            bodyStyles: {
                fontSize: 9,
                textColor: 0
            },
            columnStyles: {
                0: { halign: 'center', cellWidth: 20 },
                1: { halign: 'center', cellWidth: 20 },
                2: { halign: 'left', cellWidth: 50 },
                3: { halign: 'left', cellWidth: 35 },
                4: { halign: 'right', cellWidth: 25 },
                5: { halign: 'center', cellWidth: 15 }
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: 14, right: 14 },
            didDrawPage: (data) => {
                // Rodapé com número de página e data
                const pageSize = doc.internal.pageSize;
                const pageCount = doc.internal.getNumberOfPages();

                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text(
                    `Página ${data.pageNumber} de ${pageCount}`,
                    pageSize.getWidth() / 2,
                    pageSize.getHeight() - 10,
                    { align: 'center' }
                );
                doc.text(
                    `Gerado em ${new Date().toLocaleString('pt-BR')}`,
                    14,
                    pageSize.getHeight() - 10
                );
            }
        });

        doc.save(`Relatorio_Caixa_${Utils.formatDate(hoje).replace(/\//g, '-')}.pdf`);
    }
};
