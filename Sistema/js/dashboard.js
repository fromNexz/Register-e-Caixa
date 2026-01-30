// Dashboard System
const Dashboard = {
  data: {
    revenue: 0,
    orders: 0,
    clients: 0,
    products: 0,
    recentOrders: [],
    topProducts: [],
    monthlyRevenue: [],
    orderStatus: {}
  },

  // Initialize dashboard
  init() {
    this.loadData();
    this.renderStats();
    this.renderCharts();
    this.renderTables();
    this.setupFilters();
    this.setupAutoRefresh();
  },

  // Load data from API or local storage
  loadData() {
    // Simulating API call - replace with actual backend call
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        this.data = data;
        this.updateUI();
      })
      .catch(err => {
        console.error('Error loading dashboard data:', err);
        this.loadMockData();
      });
  },

  // Load mock data for testing
  loadMockData() {
    this.data = {
      revenue: 15250.50,
      orders: 127,
      clients: 45,
      products: 89,
      recentOrders: [
        { id: 'ORD001', client: 'João Silva', value: 1250.00, date: '2024-01-15', status: 'completed' },
        { id: 'ORD002', client: 'Maria Santos', value: 850.00, date: '2024-01-14', status: 'pending' },
        { id: 'ORD003', client: 'Pedro Costa', value: 2100.00, date: '2024-01-13', status: 'completed' },
        { id: 'ORD004', client: 'Ana Oliveira', value: 450.00, date: '2024-01-12', status: 'cancelled' }
      ],
      topProducts: [
        { name: 'Serviço A', sales: 45, revenue: 2250.00 },
        { name: 'Serviço B', sales: 32, revenue: 1920.00 },
        { name: 'Produto Premium', sales: 28, revenue: 1680.00 },
        { name: 'Consultoria', sales: 15, revenue: 1500.00 }
      ],
      monthlyRevenue: [
        { month: 'Jan', value: 12500 },
        { month: 'Fev', value: 14200 },
        { month: 'Mar', value: 15250 },
        { month: 'Abr', value: 13800 },
        { month: 'Mai', value: 16500 },
        { month: 'Jun', value: 18200 }
      ],
      orderStatus: {
        completed: 85,
        pending: 32,
        cancelled: 10
      }
    };
    this.updateUI();
  },

  // Update UI with data
  updateUI() {
    this.renderStats();
    if (typeof Chart !== 'undefined') {
      this.renderCharts();
    }
    this.renderTables();
  },

  // Render statistics cards
  renderStats() {
    const statsGrid = document.querySelector('.stats-grid');
    if (!statsGrid) return;

    const stats = [
      { label: 'Receita Total', value: this.formatCurrency(this.data.revenue), icon: '💰', class: 'revenue', change: '+12.5%' },
      { label: 'Ordens', value: this.data.orders, icon: '📋', class: 'orders', change: '+8.2%' },
      { label: 'Clientes', value: this.data.clients, icon: '👥', class: 'clients', change: '+5.1%' },
      { label: 'Produtos', value: this.data.products, icon: '📦', class: 'products', change: '+3.7%' }
    ];

    statsGrid.innerHTML = stats.map(stat => `
      <div class="stat-card ${stat.class}">
        <div class="stat-icon">${stat.icon}</div>
        <div class="stat-value">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
        <div class="stat-change positive">📈 ${stat.change}</div>
      </div>
    `).join('');
  },

  // Render charts
  renderCharts() {
    this.renderRevenueChart();
    this.renderStatusChart();
  },

  // Render revenue chart
  renderRevenueChart() {
    const canvas = document.getElementById('revenueChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    const existingChart = Chart.helpers?.instances?.find(c => c.canvas === canvas);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.data.monthlyRevenue.map(d => d.month),
        datasets: [{
          label: 'Receita Mensal',
          data: this.data.monthlyRevenue.map(d => d.value),
          borderColor: '#27ae60',
          backgroundColor: 'rgba(39, 174, 96, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointBackgroundColor: '#27ae60',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { callback: v => this.formatCurrency(v) }
          }
        }
      }
    });
  },

  // Render status chart
  renderStatusChart() {
    const canvas = document.getElementById('statusChart');
    if (!canvas || typeof Chart === 'undefined') return;

    const ctx = canvas.getContext('2d');
    const existingChart = Chart.helpers?.instances?.find(c => c.canvas === canvas);
    if (existingChart) existingChart.destroy();

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Concluído', 'Pendente', 'Cancelado'],
        datasets: [{
          data: [
            this.data.orderStatus.completed,
            this.data.orderStatus.pending,
            this.data.orderStatus.cancelled
          ],
          backgroundColor: ['#27ae60', '#f39c12', '#e74c3c'],
          borderColor: '#fff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  },

  // Render tables
  renderTables() {
    this.renderRecentOrders();
    this.renderTopProducts();
  },

  // Render recent orders table
  renderRecentOrders() {
    const table = document.querySelector('.orders-table tbody');
    if (!table) return;

    table.innerHTML = this.data.recentOrders.map(order => `
      <tr>
        <td>${order.id}</td>
        <td>${order.client}</td>
        <td>${this.formatCurrency(order.value)}</td>
        <td>${this.formatDate(order.date)}</td>
        <td><span class="status-badge ${order.status}">${this.translateStatus(order.status)}</span></td>
      </tr>
    `).join('');
  },

  // Render top products list
  renderTopProducts() {
    const container = document.querySelector('.products-list');
    if (!container) return;

    container.innerHTML = this.data.topProducts.map((product, idx) => `
      <div class="product-item">
        <div class="product-info">
          <div class="product-name">${idx + 1}. ${product.name}</div>
          <div class="product-sales">${product.sales} vendas</div>
        </div>
        <div class="product-revenue">${this.formatCurrency(product.revenue)}</div>
      </div>
    `).join('');
  },

  // Setup date filters
  setupFilters() {
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const filterBtn = document.getElementById('filterBtn');

    if (filterBtn) {
      filterBtn.addEventListener('click', () => this.applyFilters(startDate?.value, endDate?.value));
    }
  },

  // Apply date filters
  applyFilters(startDate, endDate) {
    console.log('Applying filters:', { startDate, endDate });
    // Filter data based on dates
    this.updateUI();
  },

  // Setup auto-refresh
  setupAutoRefresh() {
    // Refresh data every 5 minutes
    setInterval(() => this.loadData(), 5 * 60 * 1000);
  },

  // Utility: Format currency
  formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  },

  // Utility: Format date
  formatDate(date) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
  },

  // Utility: Translate status
  translateStatus(status) {
    const statusMap = {
      'completed': 'Concluído',
      'pending': 'Pendente',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }
};

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  Dashboard.init();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Dashboard;
}
