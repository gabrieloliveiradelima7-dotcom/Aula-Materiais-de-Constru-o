import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/server';

const prismaStub = {
  user: { findUnique: async () => null },
  client: {},
  product: {},
  sale: {},
  saleItem: {},
  $transaction: async () => 0,
  $queryRaw: async () => [],
} as any;

const app = createApp(prismaStub);

test('POST /api/sales rejects payment_method outside enum with 422', async () => {
  const response = await request(app).post('/api/sales').send({
    client_id: 1,
    user_id: 1,
    items: [{ product_id: 1, quantity: 1, unit_price: 10, subtotal: 10 }],
    total: 10,
    discount: 0,
    payment_method: 'credito',
  });

  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'Payload inválido');
});

test('GET /api/reports/sales-period requires start and end query params', async () => {
  const response = await request(app).get('/api/reports/sales-period?start=2026-01-01');

  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'Payload inválido');
});

test('POST /api/sales/:id/cancel rejects invalid id', async () => {
  const response = await request(app).post('/api/sales/abc/cancel');

  assert.equal(response.status, 422);
  assert.equal(response.body.error, 'Payload inválido');
});
