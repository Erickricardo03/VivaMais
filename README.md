# VivaMais — Produtos Naturais

Sistema completo de gestão para uma loja de produtos naturais: controle de estoque com alertas de validade, ponto de venda (PDV) com frente de caixa, relacionamento com clientes e inteligência de faturamento em tempo real.

Full-stack: **Angular** no frontend e **Spring Boot** no backend, com banco de dados H2 persistido em arquivo local.

## Funcionalidades

- **Dashboard** — faturamento diário, semanal, mensal e anual, com gráfico de evolução, ranking de produtos mais vendidos e alertas críticos de estoque/validade.
- **Estoque & Alertas** — cadastro de produtos (custo, venda, estoque mínimo, validade, lote), ajustes de entrada/saída, e filtros por estoque baixo, produtos vencendo ou já vencidos.
- **PDV (Frente de Caixa)** — venda por código de barras ou busca, carrinho, múltiplas formas de pagamento (Dinheiro, PIX, Cartão de Crédito/Débito), cupom não fiscal, abertura e fechamento de caixa com lançamento de despesas e conferência de sobra/falta.
- **Clientes** — cadastro de clientes, histórico de compras, e identificação automática de clientes inativos (que não compram há X dias) com atalho para reengajamento via WhatsApp.
- **Relatórios de Faturamento** — filtros por período (diário/semanal/mensal/anual/personalizado), custo das mercadorias (CMV), lucro estimado, margem e histórico de vendas com opção de estorno.

## Tecnologias

**Frontend**
- Angular 22 (standalone components, roteamento com lazy loading por tela)
- TypeScript, RxJS
- CSS puro (sem framework de UI), design system próprio

**Backend**
- Java 21 + Spring Boot 3.4
- Spring Data JPA / Hibernate
- Banco de dados H2 (arquivo local, sem necessidade de instalar SGBD)

## Estrutura do projeto

```
VivaMais/
├── backend/     # API REST em Spring Boot
│   └── src/main/java/com/vivamais/
│       ├── model/         # Entidades JPA (Produto, Venda, Cliente, Caixa, ...)
│       ├── repository/    # Repositórios Spring Data
│       ├── service/       # Regras de negócio
│       ├── controller/    # Endpoints REST (/api/...)
│       ├── dto/            # Objetos de requisição/resposta
│       └── bootstrap/     # Carga inicial de dados de exemplo
└── frontend/    # Aplicação Angular
    └── src/app/
        ├── core/           # Serviços, modelos e guards compartilhados
        ├── features/       # Telas: dashboard, estoque, pdv, clientes, relatorios, login
        ├── layout/         # Navbar
        └── shared/         # Componentes visuais reutilizáveis
```

## Como rodar o projeto

### Pré-requisitos

- [Java 21](https://adoptium.net/) ou superior
- [Apache Maven](https://maven.apache.org/) (ou use um `mvn` já instalado)
- [Node.js](https://nodejs.org/) 18+ e npm

### 1. Backend (porta 8080)

```bash
cd backend
mvn spring-boot:run
```

O banco H2 é criado automaticamente em `backend/data/` na primeira execução, já populado com produtos, vendas e clientes de exemplo.

### 2. Frontend (porta 4200)

```bash
cd frontend
npm install
npm start
```

Acesse **http://localhost:4200**.

### Login de acesso

```
Usuário: admin
Senha:   admin
```

## API

A API REST fica disponível em `http://localhost:8080/api`, com os principais grupos de endpoints:

| Recurso | Base | Descrição |
|---|---|---|
| Autenticação | `/api/auth` | Login |
| Produtos | `/api/produtos` | CRUD, alertas de estoque/validade, ajuste de estoque |
| Vendas | `/api/vendas` | Finalizar venda, listar, cancelar |
| Caixa | `/api/caixa` | Abrir/fechar caixa, lançar despesas, histórico |
| Clientes | `/api/clientes` | CRUD, listagem de clientes inativos |
| Dashboard | `/api/dashboard` | Resumo geral e faturamento filtrado por período |

Um console web do banco H2 fica disponível em `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/vivamaisdb`).
