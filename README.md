# ConstruManager - Frontend + Backend separados

Projeto organizado em duas aplicações:

- `frontend`: React + Vite
- `backend`: Node.js + Express + Prisma + PostgreSQL

## Estrutura

```txt
.
├── frontend/
└── backend/
```

## Subir ambiente completo (primeira integração)

### 1) Backend + banco

```bash
cd backend
cp .env.example .env
docker compose up -d
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

API padrão: `http://localhost:3001`

### 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend padrão: `http://localhost:5173`

## Integração Frontend x Backend

Status atual: **completa para primeira fase**.

- Frontend e backend estão desacoplados por pasta/projeto.
- Frontend consome API por helper (`apiFetch`) e suporta:
  - URL relativa (`/api`) para desenvolvimento com proxy;
  - URL absoluta via `VITE_API_URL` para deploy separado.
- Enums foram alinhados com o frontend via código (roles, status de venda e métodos de pagamento).
- Backend mantém contrato esperado pelo frontend nos endpoints:
  - `POST /api/login`
  - `GET|POST|PUT|DELETE /api/clients`
  - `GET|POST|PUT|DELETE /api/products`
  - `GET|POST /api/sales` e `POST /api/sales/:id/cancel`
  - `GET /api/reports/sales-period`
  - `GET /api/reports/top-products`
  - `GET /api/reports/low-stock`

## Backend hardening (feito)

- Validação de payload com **Zod**.
- Tratamento centralizado de erros (422, 404, 409, 500).
- Login com senha em hash (**bcrypt**) em vez de senha em texto puro.
- Seed atualiza/cria usuário admin com hash seguro.
- Transações de venda com validação de estoque.

## Variáveis de ambiente

### `backend/.env`

- `DATABASE_URL`
- `PORT`
- `FRONTEND_ORIGIN`

### `frontend/.env`

- `VITE_API_URL` (opcional)


## Plano executado para resolver os problemas

1. **Eliminar divergência de contrato**: centralização de enums em `shared/enums.ts`.
2. **Aplicar integração por código**: frontend e backend passam a importar os mesmos enums.
3. **Blindar API**: validação de `payment_method` diretamente pelo enum compartilhado.
4. **Garantir regressão zero**: testes automatizados de validação de API (`backend/tests`).

### Checks recomendados

```bash
npm run test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
```
