// js/storage.js - Versão IndexedDB com Dexie

// Inicializar banco de dados IndexedDB
const db = new Dexie('OficinaManagerDB');

// Definir schema
db.version(1).stores({
  clientes: '++id, idSequencial, nome, cpf, telefone, dataCriacao',
  ordensServico: '++id, numero, clienteId, status, dataAbertura, dataCriacao',
  movimentosCaixa: '++id, tipo, osId, clienteId, data, dataCriacao'
});

class StorageManager {
  constructor() {
    this.keys = APP_CONFIG.storage.keys;
    this.init();
  }

  async init() {
    try {
      // Verificar se precisa migrar dados do localStorage
      await this.migrarDoLocalStorage();
      
      const clientes = await db.clientes.count();
      const os = await db.ordensServico.count();
      const caixa = await db.movimentosCaixa.count();
      
      console.log('[+] Storage IndexedDB inicializado:', {
        clientes,
        os,
        caixa
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar IndexedDB:', error);
    }
  }

  async migrarDoLocalStorage() {
    
    const count = await db.clientes.count();
    if (count > 0) return; 

    try {
      const clientesAntigos = JSON.parse(localStorage.getItem(this.keys.CLIENTES) || '[]');
      const osAntigas = JSON.parse(localStorage.getItem(this.keys.OS) || '[]');
      const caixaAntigo = JSON.parse(localStorage.getItem(this.keys.CAIXA) || '[]');

      if (clientesAntigos.length > 0 || osAntigas.length > 0 || caixaAntigo.length > 0) {
        console.log('[=] Migrando dados do localStorage para IndexedDB...');
        
        if (clientesAntigos.length > 0) {
          await db.clientes.bulkAdd(clientesAntigos);
        }
        if (osAntigas.length > 0) {
          await db.ordensServico.bulkAdd(osAntigas);
        }
        if (caixaAntigo.length > 0) {
          await db.movimentosCaixa.bulkAdd(caixaAntigo);
        }

        console.log('[+] Migração concluída!');
        
        // Opcional: limpar localStorage antigo
        // localStorage.removeItem(this.keys.CLIENTES);
        // localStorage.removeItem(this.keys.OS);
        // localStorage.removeItem(this.keys.CAIXA);
      }
    } catch (error) {
      console.log('[ℹ] Nenhum dado antigo para migrar');
    }
  }

  // ==========================================
  // === CLIENTES ===
  // ==========================================
  
  async getClientes() {
    return await db.clientes.toArray();
  }

  async getClienteById(id) {
    return await db.clientes.get(id);
  }

  async addCliente(cliente) {
    cliente.id = this.generateId();
    cliente.idSequencial = await this.generateSequentialId('cliente');
    cliente.dataCriacao = new Date().toISOString();
    
    await db.clientes.add(cliente);
    return cliente;
  }

  async updateCliente(id, clienteData) {
    const cliente = await db.clientes.get(id);
    if (cliente) {
      const clienteAtualizado = { ...cliente, ...clienteData };
      await db.clientes.put(clienteAtualizado);
      return clienteAtualizado;
    }
    return null;
  }

  async deleteCliente(id) {
    await db.clientes.delete(id);
  }

  // ==========================================
  // === ORDENS DE SERVIÇO ===
  // ==========================================
  
  async getOS() {
    return await db.ordensServico.toArray();
  }

  async getOSById(id) {
    return await db.ordensServico.get(id);
  }

  async getOSByCliente(clienteId) {
    return await db.ordensServico.where('clienteId').equals(clienteId).toArray();
  }

  async addOS(osData) {
    const os = {
      ...osData,
      id: this.generateId(),
      numero: await this.getNextOSNumber(),
      dataCriacao: new Date().toISOString()
    };
    
    await db.ordensServico.add(os);
    
    
    if (os.valorPago > 0) {
      await this.addMovimentoCaixa({
        tipo: 'entrada',
        descricao: `Pagamento OS #${os.numero} - ${os.veiculoModelo}`,
        valor: os.valorPago,
        data: os.dataAbertura,
        osId: os.id,
        clienteId: os.clienteId
      });
    }
    
    return os;
  }

  async updateOS(id, osData) {
    const osAntiga = await db.ordensServico.get(id);
    
    if (osAntiga) {
      const valorPagoAntigo = osAntiga.valorPago || 0;
      const valorPagoNovo = osData.valorPago || 0;
      
      
      const osAtualizada = { ...osAntiga, ...osData };
      await db.ordensServico.put(osAtualizada);
      
      
      if (valorPagoNovo > valorPagoAntigo) {
        const diferenca = valorPagoNovo - valorPagoAntigo;
        await this.addMovimentoCaixa({
          tipo: 'entrada',
          descricao: `Pagamento adicional OS #${osAntiga.numero} - ${osData.veiculoModelo || osAntiga.veiculoModelo}`,
          valor: diferenca,
          data: Utils.getCurrentDate(),
          osId: id,
          clienteId: osData.clienteId || osAntiga.clienteId
        });
      }
      
      return osAtualizada;
    }
    return null;
  }

  async deleteOS(id) {
    await db.ordensServico.delete(id);
    
    await db.movimentosCaixa.where('osId').equals(id).delete();
  }

  async getNextOSNumber() {
    const todasOS = await db.ordensServico.toArray();
    if (todasOS.length === 0) return 1;
    const maxNumero = Math.max(...todasOS.map(os => os.numero || 0));
    return maxNumero + 1;
  }

  // ==========================================
  // === CAIXA ===
  // ==========================================
  
  async getMovimentosCaixa() {
    return await db.movimentosCaixa.toArray();
  }

  async addMovimentoCaixa(movimento) {
    movimento.id = this.generateId();
    movimento.dataCriacao = new Date().toISOString();
    await db.movimentosCaixa.add(movimento);
    return movimento;
  }

  async deleteMovimentoCaixa(id) {
    await db.movimentosCaixa.delete(id);
  }

  async getSaldoCaixa() {
    const movimentos = await db.movimentosCaixa.toArray();
    let entradas = 0;
    let saidas = 0;
    
    movimentos.forEach(m => {
      if (m.tipo === 'entrada') {
        entradas += m.valor || 0;
      } else {
        saidas += m.valor || 0;
      }
    });
    
    return {
      entradas,
      saidas,
      saldo: entradas - saidas
    };
  }

  // ==========================================
  // === ESTATÍSTICAS ===
  // ==========================================
  
  async getEstatisticas() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    const todasOS = await db.ordensServico.toArray();
    const todosClientes = await db.clientes.toArray();
    const movimentos = await db.movimentosCaixa.toArray();

    // OS do mês
    const osDoMes = todasOS.filter(os => {
      if (!os.dataAbertura) return false;
      const dataOS = new Date(os.dataAbertura);
      return dataOS.getMonth() === mesAtual && dataOS.getFullYear() === anoAtual;
    });

    const osConcluidas = osDoMes.filter(os => os.status === 'concluido').length;
    const osPendentes = todasOS.filter(os => 
      os.status !== 'concluido' && os.status !== 'cancelado'
    ).length;

    // Receita do mês
    const receitaMes = movimentos
      .filter(m => {
        if (m.tipo !== 'entrada' || !m.data) return false;
        const dataMovimento = new Date(m.data);
        return dataMovimento.getMonth() === mesAtual && dataMovimento.getFullYear() === anoAtual;
      })
      .reduce((acc, m) => acc + (m.valor || 0), 0);

    // Novos clientes do mês
    const novosClientes = todosClientes.filter(c => {
      if (!c.dataCriacao) return false;
      const dataCriacao = new Date(c.dataCriacao);
      return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual;
    }).length;

    return {
      receitaMes,
      osConcluidas,
      novosClientes,
      osPendentes,
      totalClientes: todosClientes.length,
      totalOS: todasOS.length
    };
  }

  // ==========================================
  // === UTILITÁRIOS ===
  // ==========================================
  
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async generateSequentialId(type) {
    if (type === 'cliente') {
      const clientes = await db.clientes.toArray();
      const nums = clientes
        .map(c => {
          const match = c.idSequencial?.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        })
        .filter(n => !isNaN(n));
      
      const nextNum = nums.length > 0 ? Math.max(...nums) + 1 : 1;
      return `#${String(nextNum).padStart(3, '0')}`;
    }
    return '#001';
  }

  // ==========================================
  // === BACKUP E RESTAURAÇÃO ===
  // ==========================================
  
  async exportarDados() {
    const clientes = await db.clientes.toArray();
    const ordensServico = await db.ordensServico.toArray();
    const movimentosCaixa = await db.movimentosCaixa.toArray();
    
    const dados = {
      clientes,
      ordensServico,
      movimentosCaixa,
      dataExportacao: new Date().toISOString(),
      versao: APP_CONFIG.version
    };
    
    return JSON.stringify(dados, null, 2);
  }

  async importarDados(jsonString) {
    try {
      const dados = JSON.parse(jsonString);
      
      if (dados.clientes) {
        await db.clientes.clear();
        await db.clientes.bulkAdd(dados.clientes);
      }
      if (dados.ordensServico) {
        await db.ordensServico.clear();
        await db.ordensServico.bulkAdd(dados.ordensServico);
      }
      if (dados.movimentosCaixa) {
        await db.movimentosCaixa.clear();
        await db.movimentosCaixa.bulkAdd(dados.movimentosCaixa);
      }
      
      return true;
    } catch (error) {
      console.error('[X] Erro ao importar dados:', error);
      return false;
    }
  }

  async limparTodosDados() {
    if (confirm('[!] ATENÇÃO! Isso irá apagar TODOS os dados do sistema. Tem certeza?')) {
      if (confirm('Última confirmação: Todos os clientes, OS e movimentações serão perdidos!')) {
        await db.clientes.clear();
        await db.ordensServico.clear();
        await db.movimentosCaixa.clear();
        console.log('[-] Todos os dados foram removidos');
        return true;
      }
    }
    return false;
  }
}

// Inicializar storage global de forma assíncrona
(async () => {
  window.storage = new StorageManager();
  await window.storage.init();
  console.log('[+] Storage Manager pronto (IndexedDB)');
})();
