# 🔧 Oficina Manager

Sistema completo de gestão para oficinas mecânicas, desenvolvido com tecnologias web modernas. Gerencie clientes, ordens de serviço, fluxo de caixa e relatórios de forma simples e eficiente.

![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![IndexedDB](https://img.shields.io/badge/IndexedDB-4479A1?style=for-the-badge&logo=database&logoColor=white)

## 📋 Sobre o Projeto

O **Register-e-Caixa** é uma solução completa para gestão de oficinas mecânicas que funciona 100% no navegador, sem necessidade de servidor. Todos os dados são armazenados localmente usando IndexedDB, garantindo rapidez e funcionamento offline.

### ✨ Funcionalidades Principais

#### 👥 Gestão de Clientes
- Cadastro completo de clientes com dados pessoais e veículos
- Histórico detalhado de ordens de serviço por cliente
- Busca e filtros avançados
- Visualização de estatísticas por cliente

#### 📋 Ordens de Serviço (OS)
- Criação e gerenciamento de ordens de serviço
- Controle de status (Pendente, Em Andamento, Concluído, etc.)
- Registro de diagnósticos, serviços realizados e peças utilizadas
- Sistema de parcelamento integrado
- Cálculo automático de valores (mão de obra + peças)
- Controle de garantia

#### 💰 Controle de Caixa
- Registro de entradas e saídas
- Múltiplas formas de pagamento
- Categorização de movimentações
- Filtros avançados (tipo, categoria, período, status)
- Resumo automático de saldo

#### 📊 Dashboard e Relatórios
- Visão geral com estatísticas do mês
- Gráficos de receita (entradas vs saídas)
- Gráficos de status de ordens de serviço
- Exportação para Excel (XLSX)
- Exportação para PDF

## 🚀 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Estilização moderna e responsiva
- **JavaScript (ES6+)** - Lógica de aplicação
- **IndexedDB** - Banco de dados local no navegador
- **Dexie.js** - Wrapper para IndexedDB (simplifica operações)
- **Chart.js** - Gráficos interativos
- **jsPDF** - Geração de relatórios em PDF
- **SheetJS (xlsx)** - Exportação para Excel
- **Font Awesome** - Ícones

## 📦 Instalação

### Opção 1: Clonar o Repositório

```bash
git clone https://github.com/fromNexz/Register-e-Caixa.git
cd Register-e-Caixa
