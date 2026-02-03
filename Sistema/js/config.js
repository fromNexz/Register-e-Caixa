// js/config.js
const APP_CONFIG = {
  name: 'Oficina Manager',
  version: '2.0.0',
  storage: {
    keys: {
      CLIENTES: 'om_clientes_v2',
      OS: 'om_os_v2',
      CAIXA: 'om_caixa_v2'
    }
  }
};

window.APP_CONFIG = APP_CONFIG;
('[+] Config carregado');
