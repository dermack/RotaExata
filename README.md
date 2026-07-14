# RotaExata - API de Gerenciamento de Endereços

Backend Node.js com Express e PostgreSQL para gerenciar endereços com autenticação JWT.

## Pré-requisitos

### Opção 1: Rodar Local
- Node.js 16+ (https://nodejs.org)
- PostgreSQL 12+ (https://www.postgresql.org/download)

### Opção 2: Rodar com Docker
- Docker Desktop (https://www.docker.com/products/docker-desktop)

## Instalação do Zero

### 1. Clonar o Repositório
```bash
git clone <url-do-repo>
cd rotaexata
```

### 2. Instalar Dependências
```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

**Para desenvolvimento local:**
```bash
cp .env.example .env
# Edite .env com suas credenciais PostgreSQL
```

**Conteúdo do `.env` para local:**
```
PORT=3000
DATABASE_URL=postgresql://postgres:sua_senha@localhost:5432/rotaexata
DATABASE_URL_TEST=postgresql://postgres:sua_senha@localhost:5432/rotaexata_test
JWT_SECRET=supersecret
NODE_ENV=development
```

---

## Executando Localmente

### 1. Criar Banco de Dados
```bash
# Abra o terminal PostgreSQL (psql)
psql -U postgres

# Dentro do psql, execute:
CREATE DATABASE rotaexata;
CREATE DATABASE rotaexata_test;
\q
```

### 2. Iniciar Servidor
```bash
npm start
# Servidor rodará em http://localhost:3000
```

### 3. Modo Desenvolvimento (com reload automático)
```bash
npm run dev
```

### 4. Rodar Testes
```bash
npm test
```

---

## Executando com Docker

### 1. Build e Start
```bash
docker-compose up --build
```

Isso vai:
- Criar container PostgreSQL em `localhost:5432`
- Criar container Node.js em `localhost:3000`
- Inicializar banco e tabelas automaticamente

### 2. Ver Logs
```bash
docker logs rotaexata-app
docker logs rotaexata-db
```

### 3. Parar Containers
```bash
# Parar e manter dados
docker-compose down

# Parar e deletar dados
docker-compose down -v
```

### 4. Reiniciar
```bash
docker-compose up
```

---

## Endpoints da API

### Autenticação

**Registrar novo usuário:**
```bash
POST /user
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```
Response: `201`
```json
{
  "id": 1,
  "email": "usuario@example.com"
}
```

**Fazer login:**
```bash
POST /login
Content-Type: application/json

{
  "email": "usuario@example.com",
  "password": "senha123"
}
```
Response: `200`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Endereços (Requer autenticação)

Use o token JWT no header:
```
Authorization: Bearer SEU_TOKEN_AQUI
```

**Criar endereço:**
```bash
POST /addresses
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "street": "Rua A",
  "city": "São Paulo",
  "state": "SP",
  "zip": "01310-100"
}
```

**Listar endereços (com busca opcional):**
```bash
GET /addresses?search=rua
Authorization: Bearer TOKEN
```

**Atualizar endereço:**
```bash
PUT /addresses/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "street": "Rua B",
  "city": "Rio de Janeiro",
  "state": "RJ",
  "zip": "20040020"
}
```

**Deletar endereço:**
```bash
DELETE /addresses/:id
Authorization: Bearer TOKEN
```

**Compartilhar endereço (gerar link público):**
```bash
POST /addresses/:id/share
Authorization: Bearer TOKEN
```
Response:
```json
{
  "id": 1,
  "public_code": "abc123xyz"
}
```

**Acessar endereço compartilhado (sem autenticação):**
```bash
GET /addresses/shared/:public_code
```

---

## Códigos de Erro

| Código | Significado |
|--------|------------|
| 400 | Bad Request - Dados inválidos |
| 401 | Unauthorized - Token inválido ou não autenticado |
| 403 | Forbidden - Sem permissão para acessar recurso |
| 404 | Not Found - Recurso não encontrado |
| 500 | Internal Server Error - Erro do servidor |

---

## Estrutura do Projeto

```
src/
├── app.js                 # Configuração Express
├── server.js              # Entrada principal
├── config/
│   └── db.js              # Pool PostgreSQL e inicialização
├── controllers/
│   ├── addressController.js
│   └── authController.js
├── middlewares/
│   ├── addressMiddleware.js
│   └── authMiddleware.js
├── repositories/
│   ├── addressRepository.js
│   └── userRepository.js
└── routes/
    ├── addressRoutes.js
    ├── authRoutes.js
    └── index.js

tests/
└── integration.test.js    # Suite de testes

docker-compose.yml         # Configuração Docker
Dockerfile                 # Build da imagem Node
.env                       # Variáveis de ambiente
package.json               # Dependências e scripts
```

---

## Dependências Principais

- **express**: Framework web
- **pg**: Driver PostgreSQL
- **jsonwebtoken**: Autenticação JWT
- **bcrypt**: Hash de senhas
- **cors**: Controle CORS
- **dotenv**: Variáveis de ambiente

---

## Scripts Disponíveis

```bash
npm start          # Iniciar servidor (produção)
npm run dev        # Iniciar com nodemon (desenvolvimento)
npm test           # Rodar testes (requer DATABASE_URL_TEST)
```

---

## Troubleshooting

### Porta 3000 já em uso
```bash
# Mudar porta no .env
PORT=3001
```

### Erro de conexão PostgreSQL local
```bash
# Verificar se PostgreSQL está rodando
# Windows: Services > PostgreSQL
# macOS: brew services start postgresql
# Linux: sudo service postgresql start
```

### Container Docker não consegue conectar ao banco
```bash
# Reiniciar containers
docker-compose down -v
docker-compose up --build
```

### Erro "relation users does not exist"
O servidor fez restart mas as tabelas não foram criadas. Isso é resolvido automaticamente, mas se persistir:
```bash
docker-compose down -v
docker-compose up
```

---

## Licença

MIT
