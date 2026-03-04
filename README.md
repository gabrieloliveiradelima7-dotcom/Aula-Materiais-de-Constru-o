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

## Status da integração Frontend x Backend

A comunicação está alinhada com o frontend atual:

- Frontend consome os mesmos endpoints já usados na UI (`/api/login`, `/api/clients`, `/api/products`, `/api/sales`, `/api/reports/*`).
- Backend entrega os campos esperados pelo front (por exemplo `created_at`, `client_name`, `payment_method`, `total_sold`).
- Frontend agora suporta ambiente separado com `VITE_API_URL` (sem depender apenas de proxy do Vite).

## Próximos passos recomendados para integração completa (produção)

1. **Autenticação segura**: trocar senha em texto puro por hash (bcrypt) e JWT/sessão.
2. **Validação de payload**: adicionar validação com schema (ex.: Zod) em todas as rotas.
3. **Tratamento padronizado de erros**: middleware para respostas consistentes.
4. **Observabilidade**: logs estruturados e endpoint de health mais completo (db + versão).
5. **CI/CD**: pipeline com `prisma migrate deploy` + build/test automatizados.
