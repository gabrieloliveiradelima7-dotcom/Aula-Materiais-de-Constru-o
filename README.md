# ConstruManager - Frontend + Backend separados

Projeto organizado em duas aplicações:

- `frontend`: React + Vite
- `backend`: Node.js + Express + Prisma + PostgreSQL

## Estrutura

```txt
.
├── frontend/
├── backend/
└── shared/
```

## Rodar em DEV (fluxo recomendado)

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar ambiente backend

```bash
cp backend/.env.example backend/.env
```

### 3) Subir tudo em modo desenvolvimento

```bash
npm run dev:full
```

Esse comando:

1. Sobe o PostgreSQL via Docker (`dev:db`);
2. Gera client Prisma + aplica migração + seed (`dev:setup`);
3. Inicia backend e frontend juntos (`dev`).

## Scripts úteis de DEV

- `npm run dev` → sobe frontend + backend simultaneamente.
- `npm run dev:db` → sobe somente o banco.
- `npm run dev:db:down` → derruba o banco.
- `npm run dev:setup` → prepara backend (db + prisma + seed).
- `npm run dev:frontend` → sobe só o frontend.
- `npm run dev:backend` → sobe só o backend.

## Endereços padrão

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

## Integração Frontend x Backend

Status atual: **completa para primeira fase**.

- Frontend e backend estão desacoplados por pasta/projeto.
- Frontend consome API por helper (`apiFetch`) e suporta:
  - URL relativa (`/api`) para desenvolvimento com proxy;
  - URL absoluta via `VITE_API_URL` para deploy separado.
- Enums estão centralizados em `shared/enums.ts` e usados por frontend e backend.
- Backend mantém contrato esperado pelo frontend nos endpoints:
  - `POST /api/login`
  - `GET|POST|PUT|DELETE /api/clients`
  - `GET|POST|PUT|DELETE /api/products`
  - `GET|POST /api/sales` e `POST /api/sales/:id/cancel`
  - `GET /api/reports/sales-period`
  - `GET /api/reports/top-products`
  - `GET /api/reports/low-stock`

## Checks recomendados

```bash
npm run test --workspace backend
npm run build --workspace backend
npm run lint --workspace frontend
npm run build --workspace frontend
```
