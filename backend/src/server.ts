import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: FRONTEND_ORIGIN }));
app.use(express.json());

// Auth
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  const user = await prisma.user.findFirst({
    where: { username, password },
    select: { id: true, username: true, role: true },
  });

  if (!user) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  return res.json(user);
});

// Clients
app.get('/api/clients', async (_req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
  return res.json(clients.map((client: any) => ({ ...client, created_at: client.createdAt })));
});

app.post('/api/clients', async (req, res) => {
  try {
    const created = await prisma.client.create({ data: req.body });
    return res.json({ id: created.id });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.put('/api/clients/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.client.update({ where: { id }, data: req.body });
  return res.json({ success: true });
});

app.delete('/api/clients/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.client.delete({ where: { id } });
  return res.json({ success: true });
});

// Products
app.get('/api/products', async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { name: 'asc' } });
  return res.json(products.map((product: any) => ({ ...product, created_at: product.createdAt })));
});

app.post('/api/products', async (req, res) => {
  try {
    const created = await prisma.product.create({ data: req.body });
    return res.json({ id: created.id });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.update({ where: { id }, data: req.body });
  return res.json({ success: true });
});

app.delete('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  await prisma.product.delete({ where: { id } });
  return res.json({ success: true });
});

// Sales
app.get('/api/sales', async (_req, res) => {
  const sales = await prisma.sale.findMany({
    include: { client: true },
    orderBy: { createdAt: 'desc' },
  });

  return res.json(
    sales.map((sale: any) => ({
      id: sale.id,
      client_id: sale.clientId,
      client_name: sale.client.name,
      user_id: sale.userId,
      total: sale.total,
      discount: sale.discount,
      payment_method: sale.paymentMethod,
      status: sale.status,
      created_at: sale.createdAt,
    })),
  );
});

app.post('/api/sales', async (req, res) => {
  const { client_id, user_id, items, total, discount, payment_method } = req.body;

  try {
    const saleId = await prisma.$transaction(async (tx: any) => {
      const sale = await tx.sale.create({
        data: {
          clientId: client_id,
          userId: user_id,
          total,
          discount,
          paymentMethod: payment_method,
        },
      });

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.product_id },
          select: { stock: true },
        });

        if (!product || product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto ID ${item.product_id}`);
        }

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            productId: item.product_id,
            quantity: item.quantity,
            unitPrice: item.unit_price,
            subtotal: item.subtotal,
          },
        });

        await tx.product.update({
          where: { id: item.product_id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return sale.id;
    });

    return res.json({ id: saleId });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

app.post('/api/sales/:id/cancel', async (req, res) => {
  const saleId = Number(req.params.id);

  await prisma.$transaction(async (tx: any) => {
    const sale = await tx.sale.findUnique({ where: { id: saleId } });
    if (!sale || sale.status === 'cancelada') {
      return;
    }

    const items = await tx.saleItem.findMany({ where: { saleId } });

    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { increment: item.quantity } },
      });
    }

    await tx.sale.update({ where: { id: saleId }, data: { status: 'cancelada' } });
  });

  return res.json({ success: true });
});

// Reports
app.get('/api/reports/sales-period', async (req, res) => {
  const { start, end } = req.query as { start?: string; end?: string };

  if (!start || !end) {
    return res.status(400).json({ error: 'Parâmetros start e end são obrigatórios' });
  }

  const report = await prisma.$queryRaw<Array<{ date: Date; total_revenue: number; sales_count: bigint }>>`
    SELECT DATE(created_at) as date, SUM(total) as total_revenue, COUNT(*) as sales_count
    FROM sales
    WHERE created_at BETWEEN ${new Date(start)} AND ${new Date(end)}
      AND status = 'concluída'
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;

  return res.json(
    report.map((row: any) => ({
      date: row.date,
      total_revenue: row.total_revenue,
      sales_count: Number(row.sales_count),
    })),
  );
});

app.get('/api/reports/top-products', async (_req, res) => {
  const report = await prisma.$queryRaw<Array<{ name: string; total_sold: bigint }>>`
    SELECT p.name, SUM(si.quantity) as total_sold
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    JOIN sales s ON si.sale_id = s.id
    WHERE s.status = 'concluída'
    GROUP BY p.id
    ORDER BY total_sold DESC
    LIMIT 10
  `;

  return res.json(report.map((row: any) => ({ ...row, total_sold: Number(row.total_sold) })));
});

app.get('/api/reports/low-stock', async (_req, res) => {
  const report = await prisma.product.findMany({
    where: { stock: { lt: 10 } },
    orderBy: { stock: 'asc' },
  });

  return res.json(report.map((product: any) => ({ ...product, created_at: product.createdAt })));
});

app.get('/api/health', async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
