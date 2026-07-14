import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import 'dotenv/config';

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

const { default: app } = await import('../src/app.js');
const { pool, initializeDatabase, resetDatabase } = await import('../src/config/db.js');

function authHeader(userId = 1) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { Authorization: `Bearer ${token}` };
}

async function createUser(email, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
    [email, hashedPassword]
  );

  return result.rows[0];
}

async function createAddress(userId, address = {}) {
  const result = await pool.query(
    'INSERT INTO addresses (user_id, street, city, state, zip) VALUES ($1, $2, $3, $4, $5) RETURNING *',
    [userId, address.street || 'Rua Teste', address.city || 'São Paulo', address.state || 'SP', address.zip || '01000']
  );

  return result.rows[0];
}

test.before(async () => {
  if (!process.env.DATABASE_URL_TEST && !process.env.DATABASE_URL) {
    throw new Error('Defina DATABASE_URL_TEST ou DATABASE_URL antes de rodar os testes.');
  }

  await initializeDatabase();
});

test.beforeEach(async () => {
  await resetDatabase();
});

test('POST /user should register a user successfully', async () => {
  const response = await request(app)
    .post('/user')
    .send({ email: 'Test@Example.com', password: '123456' });

  assert.equal(response.status, 201);
  assert.deepEqual(response.body, { id: 1, email: 'test@example.com' });
});

test('POST /user should reject missing fields', async () => {
  const response = await request(app).post('/user').send({ email: 'a@b.com' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Email e senha são obrigatórios' });
});

test('POST /user should reject invalid email', async () => {
  const response = await request(app).post('/user').send({ email: 'invalid', password: '123456' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Email inválido' });
});

test('POST /user should reject duplicate email', async () => {
  await createUser('duplicate@example.com', '123456');

  const response = await request(app)
    .post('/user')
    .send({ email: 'duplicate@example.com', password: '123456' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Usuário já existe' });
});

test('POST /login should return a token for valid credentials', async () => {
  await createUser('test@example.com', '123456');

  const response = await request(app)
    .post('/login')
    .send({ email: 'test@example.com', password: '123456' });

  assert.equal(response.status, 200);
  assert.ok(response.body.token);

  const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
  assert.equal(decoded.id, 1);
});

test('POST /login should reject missing fields', async () => {
  const response = await request(app).post('/login').send({ email: 'a@b.com' });

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Email e senha são obrigatórios' });
});

test('POST /login should reject invalid credentials', async () => {
  const response = await request(app)
    .post('/login')
    .send({ email: 'missing@example.com', password: '123456' });

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { error: 'Credenciais inválidas' });
});

test('GET /addresses should require authentication', async () => {
  const response = await request(app).get('/addresses');

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { error: 'Token não informado' });
});

test('POST /addresses should create an address for an authenticated user', async () => {
  const user = await createUser('user@example.com', '123456');

  const response = await request(app)
    .post('/addresses')
    .set(authHeader(user.id))
    .send({ street: 'Rua A', city: 'São Paulo', state: 'SP', zip: '01000' });

  assert.equal(response.status, 201);
  assert.equal(response.body.user_id, user.id);
  assert.equal(response.body.street, 'Rua A');
});

test('POST /addresses should reject empty body', async () => {
  const user = await createUser('user2@example.com', '123456');

  const response = await request(app)
    .post('/addresses')
    .set(authHeader(user.id))
    .send({});

  assert.equal(response.status, 400);
  assert.deepEqual(response.body, { error: 'Dados do endereço obrigatórios' });
});

test('GET /addresses should return the user addresses', async () => {
  const user = await createUser('user3@example.com', '123456');
  await createAddress(user.id, { street: 'Rua B', city: 'Campinas', state: 'SP', zip: '13000' });

  const response = await request(app).get('/addresses').set(authHeader(user.id));

  assert.equal(response.status, 200);
  assert.equal(response.body.addresses.length, 1);
  assert.equal(response.body.addresses[0].street, 'Rua B');
});

test('PUT /addresses/:id should update an address owned by the user', async () => {
  const user = await createUser('user4@example.com', '123456');
  const address = await createAddress(user.id, { street: 'Rua Antiga', city: 'São Paulo', state: 'SP', zip: '01000' });

  const response = await request(app)
    .put(`/addresses/${address.id}`)
    .set(authHeader(user.id))
    .send({ street: 'Rua Nova' });

  assert.equal(response.status, 200);
  assert.equal(response.body.street, 'Rua Nova');
});

test('PUT /addresses/:id should return 404 for a missing address', async () => {
  const user = await createUser('user5@example.com', '123456');

  const response = await request(app)
    .put('/addresses/999')
    .set(authHeader(user.id))
    .send({ street: 'Rua Nova' });

  assert.equal(response.status, 404);
  assert.deepEqual(response.body, { error: 'Endereço não encontrado' });
});

test('PUT /addresses/:id should return 403 when the user is not the owner', async () => {
  const owner = await createUser('owner@example.com', '123456');
  const otherUser = await createUser('other@example.com', '123456');
  const address = await createAddress(owner.id, { street: 'Rua X', city: 'São Paulo', state: 'SP', zip: '01000' });

  const response = await request(app)
    .put(`/addresses/${address.id}`)
    .set(authHeader(otherUser.id))
    .send({ street: 'Rua Nova' });

  assert.equal(response.status, 403);
  assert.deepEqual(response.body, { error: 'Acesso negado' });
});

test('DELETE /addresses/:id should remove an address owned by the user', async () => {
  const user = await createUser('user6@example.com', '123456');
  const address = await createAddress(user.id, { street: 'Rua Delete', city: 'São Paulo', state: 'SP', zip: '01000' });

  const response = await request(app).delete(`/addresses/${address.id}`).set(authHeader(user.id));

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, { message: 'Endereço removido com sucesso' });
});

test('POST /addresses/:id/share should return a share URL', async () => {
  const user = await createUser('user7@example.com', '123456');
  const address = await createAddress(user.id, { street: 'Rua Share', city: 'São Paulo', state: 'SP', zip: '01000' });

  const response = await request(app)
    .post(`/addresses/${address.id}/share`)
    .set(authHeader(user.id))
    .send({ expiresIn: '1h' });

  assert.equal(response.status, 200);
  assert.ok(response.body.url.includes('/shared/'));
});

test('GET /shared/:token should return the address for a valid token', async () => {
  const user = await createUser('user8@example.com', '123456');
  const address = await createAddress(user.id, { street: 'Rua Compartilhada', city: 'São Paulo', state: 'SP', zip: '01000' });
  const token = jwt.sign({ address_id: address.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const response = await request(app).get(`/shared/${token}`);

  assert.equal(response.status, 200);
  assert.equal(response.body.street, 'Rua Compartilhada');
});

test('GET /shared/:token should reject an invalid token', async () => {
  const response = await request(app).get('/shared/not-a-token');

  assert.equal(response.status, 401);
  assert.deepEqual(response.body, { error: 'Token inválido' });
});