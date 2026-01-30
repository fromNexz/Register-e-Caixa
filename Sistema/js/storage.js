// js/storage.js
class StorageManager {
  constructor() {
    this.keys = APP_CONFIG.storage.keys;
    this.init();
  }

  init() {
    this.clientes = this.load(this.keys.CLIENTES) || [];
    this.ordensServico = this.load(this.keys.OS) || [];
    this.movimentosCaixa = this.load(this.keys.CAIXA) || [];
    console.log('📦 Storage inicializado:', {
      clientes: this.clientes.length,
      os: this.ordensServico.length,
      caixa: this.movimentosCaixa.length
    });
  }

  load(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`❌ Erro ao carregar ${key}:`, error);
      return null;
    }
  }

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`❌ Erro ao salvar ${key}:`, error);
      return false;
    }
  }

  saveAll() {
    this.save(this.keys.CLIENTES, this.clientes);
    this.save(this.keys.OS, this.ordensServico);
    this.save(this.keys.CAIXA, this.movimentosCaixa);
  }

  // ==========================================
  // === CLIENTES ===
  // ==========================================
  
  getClientes() {
    return this.clientes;
  }

  getClienteById(id) {
    return this.clientes.find(c => c.id === id);
  }

  addCliente(cliente) {
    cliente.id = this.generateId();
    cliente.idSequencial = this.generateSequentialId('cliente');
    cliente.dataCriacao = new Date().toISOString();
    this.clientes.push(cliente);
    this.saveAll();
    return cliente;
  }

  updateCliente(id, clienteData) {
    const index = this.clientes.findIndex(c => c.id === id);
    if (index !== -1) {
      this.clientes[index] = { ...this.clientes[index], ...clienteData };
      this.saveAll();
      return this.clientes[index];
    }
    return null;
  }

  deleteCliente(id) {
    this.clientes = this.clientes.filter(c => c.id !== id);
    this.saveAll();
  }

  // ==========================================
  // === ORDENS DE SERVIÇO ===
  // ==========================================
  
  getOS() {
    return this.ordensServico;
  }

  getOSById(id) {
    return this.ordensServico.find(os => os.id === id);
  }

  getOSByCliente(clienteId) {
    return this.ordensServico.filter(os => os.clienteId === clienteId);
  }

  addOS(osData) {
    const os = {
      ...osData,
      id: this.generateId(),
      numero: this.getNextOSNumber(),
      dataCriacao: new Date().toISOString()
    };
    
    this.ordensServico.push(os);
    this.saveAll();
    
    // Adicionar entrada no caixa se houver pagamento
    if (os.valorPago > 0) {
      this.addMovimentoCaixa({
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

  updateOS(id, osData) {
    const index = this.ordensServico.findIndex(os => os.id === id);
    if (index !== -1) {
      const osAntiga = this.ordensServico[index];
      const valorPagoAntigo = osAntiga.valorPago || 0;
      const valorPagoNovo = osData.valorPago || 0;
      
      // Atualizar OS
      this.ordensServico[index] = { 
        ...osAntiga, 
        ...osData 
      };
      
      // Se houve mudança no valor pago, registrar no caixa
      if (valorPagoNovo > valorPagoAntigo) {
        const diferenca = valorPagoNovo - valorPagoAntigo;
        this.addMovimentoCaixa({
          tipo: 'entrada',
          descricao: `Pagamento adicional OS #${osAntiga.numero} - ${osData.veiculoModelo || osAntiga.veiculoModelo}`,
          valor: diferenca,
          data: Utils.getCurrentDate(),
          osId: id,
          clienteId: osData.clienteId || osAntiga.clienteId
        });
      }
      
      this.saveAll();
      return this.ordensServico[index];
    }
    return null;
  }

  deleteOS(id) {
    this.ordensServico = this.ordensServico.filter(os => os.id !== id);
    // Remover também movimentações relacionadas
    this.movimentosCaixa = this.movimentosCaixa.filter(m => m.osId !== id);
    this.saveAll();
  }

  getNextOSNumber() {
    if (this.ordensServico.length === 0) return 1;
    const maxNumero = Math.max(...this.ordensServico.map(os => os.numero || 0));
    return maxNumero + 1;
  }

  // ==========================================
  // === CAIXA ===
  // ==========================================
  
  getMovimentosCaixa() {
    return this.movimentosCaixa;
  }

  addMovimentoCaixa(movimento) {
    movimento.id = this.generateId();
    movimento.dataCriacao = new Date().toISOString();
    this.movimentosCaixa.push(movimento);
    this.saveAll();
    return movimento;
  }

  deleteMovimentoCaixa(id) {
    this.movimentosCaixa = this.movimentosCaixa.filter(m => m.id !== id);
    this.saveAll();
  }

  getSaldoCaixa() {
    let entradas = 0;
    let saidas = 0;
    
    this.movimentosCaixa.forEach(m => {
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
  
  getEstatisticas() {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();

    // OS do mês
    const osDoMes = this.ordensServico.filter(os => {
      if (!os.dataAbertura) return false;
      const dataOS = new Date(os.dataAbertura);
      return dataOS.getMonth() === mesAtual && dataOS.getFullYear() === anoAtual;
    });

    const osConcluidas = osDoMes.filter(os => os.status === 'concluido').length;
    const osPendentes = this.ordensServico.filter(os => 
      os.status !== 'concluido' && os.status !== 'cancelado'
    ).length;

    // Receita do mês
    const receitaMes = this.movimentosCaixa
      .filter(m => {
        if (m.tipo !== 'entrada' || !m.data) return false;
        const dataMovimento = new Date(m.data);
        return dataMovimento.getMonth() === mesAtual && dataMovimento.getFullYear() === anoAtual;
      })
      .reduce((acc, m) => acc + (m.valor || 0), 0);

    // Novos clientes do mês
    const novosClientes = this.clientes.filter(c => {
      if (!c.dataCriacao) return false;
      const dataCriacao = new Date(c.dataCriacao);
      return dataCriacao.getMonth() === mesAtual && dataCriacao.getFullYear() === anoAtual;
    }).length;

    return {
      receitaMes,
      osConcluidas,
      novosClientes,
      osPendentes,
      totalClientes: this.clientes.length,
      totalOS: this.ordensServico.length
    };
  }

  // ==========================================
  // === UTILITÁRIOS ===
  // ==========================================
  
  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSequentialId(type) {
    if (type === 'cliente') {
      const nums = this.clientes
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
  
  exportarDados() {
    const dados = {
      clientes: this.clientes,
      ordensServico: this.ordensServico,
      movimentosCaixa: this.movimentosCaixa,
      dataExportacao: new Date().toISOString(),
      versao: APP_CONFIG.version
    };
    
    return JSON.stringify(dados, null, 2);
  }

  importarDados(jsonString) {
    try {
      const dados = JSON.parse(jsonString);
      
      if (dados.clientes) this.clientes = dados.clientes;
      if (dados.ordensServico) this.ordensServico = dados.ordensServico;
      if (dados.movimentosCaixa) this.movimentosCaixa = dados.movimentosCaixa;
      
      this.saveAll();
      return true;
    } catch (error) {
      console.error('❌ Erro ao importar dados:', error);
      return false;
    }
  }

  limparTodosDados() {
    if (confirm('⚠️ ATENÇÃO! Isso irá apagar TODOS os dados do sistema. Tem certeza?')) {
      if (confirm('Última confirmação: Todos os clientes, OS e movimentações serão perdidos!')) {
        this.clientes = [];
        this.ordensServico = [];
        this.movimentosCaixa = [];
        this.saveAll();
        console.log('🗑️ Todos os dados foram removidos');
        return true;
      }
    }
    return false;
  }
}

// Inicializar storage global
window.storage = new StorageManager();
console.log('✅ Storage Manager pronto');
