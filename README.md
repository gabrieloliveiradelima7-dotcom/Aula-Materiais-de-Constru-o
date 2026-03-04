# ConstruManager - Frontend + Backend separados

Projeto reorganizado em duas pastas:

- `frontend`: aplicação React + Vite.
- `backend`: API Node.js (Express) com Prisma + PostgreSQL.

## Estrutura

```txt
.
├── frontend/
└── backend/
```

## Backend (Node + Prisma + Postgres)

### 1) Subir banco com Docker

```bash
cd backend
docker compose up -d
```

### 2) Configurar variáveis de ambiente

```bash
cp .env.example .env
```

### 3) Instalar dependências e migrar

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4) Rodar API

```bash
npm run dev
```

API padrão: `http://localhost:3001`

## Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend padrão: `http://localhost:5173`

O frontend usa proxy de `/api` para o backend (`http://localhost:3001` por padrão).
