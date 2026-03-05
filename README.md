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

### 1) Instalar dependências (root + workspaces)

```bash
npm install --workspaces --include-workspace-root
```

### 2) Subir tudo em modo desenvolvimento

```bash
npm run dev:full
```

> O script `dev:full` detecta Docker automaticamente.
> - Se houver Docker, ele sobe o Postgres local.
> - Se não houver Docker, ele segue sem banco local e usa `DATABASE_URL` do `backend/.env`.

Se quiser forçar o modo sem Docker:

```bash
npm run dev:full:nodb
```

## Scripts úteis de DEV

- `npm run dev` → sobe frontend + backend simultaneamente.
- `npm run dev:db` → sobe somente o banco Docker.
- `npm run dev:db:down` → derruba o banco Docker.
- `npm run dev:setup:backend` → garante `backend/.env` + roda `prisma generate + migrate + seed`.
- `npm run dev:full` → banco + setup backend + frontend/backend.
- `npm run dev:full:nodb` → setup backend + frontend/backend (sem Docker).
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
