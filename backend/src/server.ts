import 'dotenv/config';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import bcrypt from 'bcryptjs';
import { z, ZodError } from 'zod';
import { PAYMENT_METHODS, SALE_STATUS } from '../../shared/enums';

const PORT = Number(process.env.PORT || 3001);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';

class HttpError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

const asyncHandler =
  (handler: (req: Request, res: Response, next: NextFunction) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };

const idSchema = z.coerce.number().int().positive();
const dateRangeSchema = z.object({
  start: z.string().min(10),
  end: z.string().min(10),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const clientSchema = z.object({
  name: z.string().min(2),
  document: z.string().min(3),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zip: z.string().optional().nullable(),
});

const productSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  price: z.coerce.number().nonnegative(),
  stock: z.coerce.number().int().nonnegative(),
  unit: z.string().optional().nullable(),
});

const saleItemSchema = z.object({
  product_id: z.number().int().positive(),
  quantity: z.number().int().positive(),
  unit_price: z.number().nonnegative(),
  subtotal: z.number().nonnegative(),
});

const saleSchema = z.object({
  client_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  items: z.array(saleItemSchema).min(1),
  total: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  payment_method: z.enum(PAYMENT_METHODS),
});

type SaleInput = z.infer<typeof saleSchema>;

const toClientResponse = (client: {
  createdAt: Date;
  id: number;
  name: string;
  document: string;
  phone: string | null;
  email: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
}) => ({ ...client, created_at: client.createdAt });

const toProductResponse = (product: {
  id: number;
  code: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  stock: number;
  unit: string | null;
  createdAt: Date;
}) => ({ ...product, created_at: product.createdAt });

export function createApp(prisma?: PrismaClient | any) {
  const db = prisma ?? new PrismaClient();
  const app = express();

  app.use(cors({ origin: FRONTEND_ORIGIN }));
  app.use(express.json());

  app.post(
    '/api/login',
    asyncHandler(async (req, res) => {
      const { username, password } = loginSchema.parse(req.body);

      const user = await db.user.findUnique({ where: { username } });
      if (!user) {
        throw new HttpError('Credenciais inválidas', 401);
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new HttpError('Credenciais inválidas', 401);
      }

      res.json({ id: user.id, username: user.username, role: user.role });
    }),
  );

  app.get(
    '/api/clients',
    asyncHandler(async (_req, res) => {
      const clients = await db.client.findMany({ orderBy: { name: 'asc' } });
      res.json(clients.map(toClientResponse));
    }),
  );

  app.post(
    '/api/clients',
    asyncHandler(async (req, res) => {
      const data = clientSchema.parse(req.body);
      const created = await db.client.create({ data });
      res.status(201).json({ id: created.id });
    }),
  );

  app.put(
    '/api/clients/:id',
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const data = clientSchema.parse(req.body);
      await db.client.update({ where: { id }, data });
      res.json({ success: true });
    }),
  );

  app.delete(
    '/api/clients/:id',
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      await db.client.delete({ where: { id } });
      res.json({ success: true });
    }),
  );

  app.get(
    '/api/products',
    asyncHandler(async (_req, res) => {
      const products = await db.product.findMany({ orderBy: { name: 'asc' } });
      res.json(products.map(toProductResponse));
    }),
  );

  app.post(
    '/api/products',
    asyncHandler(async (req, res) => {
      const data = productSchema.parse(req.body);
      const created = await db.product.create({ data });
      res.status(201).json({ id: created.id });
    }),
  );

  app.put(
    '/api/products/:id',
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      const data = productSchema.parse(req.body);
      await db.product.update({ where: { id }, data });
      res.json({ success: true });
    }),
  );

  app.delete(
    '/api/products/:id',
    asyncHandler(async (req, res) => {
      const id = idSchema.parse(req.params.id);
      await db.product.delete({ where: { id } });
      res.json({ success: true });
    }),
  );

  app.get(
    '/api/sales',
    asyncHandler(async (_req, res) => {
      const sales = await db.sale.findMany({
        include: { client: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json(
        sales.map((sale: {
          id: number;
          clientId: number;
          userId: number;
          total: number;
          discount: number;
          paymentMethod: string;
          status: string;
          createdAt: Date;
          client: { name: string };
        }) => ({
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
    }),
  );

  app.post(
    '/api/sales',
    asyncHandler(async (req, res) => {
      const { client_id, user_id, items, total, discount, payment_method }: SaleInput = saleSchema.parse(req.body);

      const saleId = await db.$transaction(async (tx: Prisma.TransactionClient) => {
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
            throw new HttpError(`Estoque insuficiente para o produto ID ${item.product_id}`, 400);
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

      res.status(201).json({ id: saleId });
    }),
  );

  app.post(
    '/api/sales/:id/cancel',
    asyncHandler(async (req, res) => {
      const saleId = idSchema.parse(req.params.id);

      await db.$transaction(async (tx: Prisma.TransactionClient) => {
        const sale = await tx.sale.findUnique({ where: { id: saleId } });
        if (!sale || sale.status === SALE_STATUS[1]) return;

        const items = await tx.saleItem.findMany({ where: { saleId } });
        for (const item of items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }

        await tx.sale.update({ where: { id: saleId }, data: { status: SALE_STATUS[1] } });
      });

      res.json({ success: true });
    }),
  );

  app.get(
    '/api/reports/sales-period',
    asyncHandler(async (req, res) => {
      const { start, end } = dateRangeSchema.parse(req.query);

      const startDate = new Date(`${start}T00:00:00.000Z`);
      const endDate = new Date(`${end}T23:59:59.999Z`);

      const report = await db.$queryRaw<Array<{ date: Date; total_revenue: number | null; sales_count: bigint }>>`
        SELECT DATE(created_at) as date, SUM(total) as total_revenue, COUNT(*) as sales_count
        FROM sales
        WHERE created_at BETWEEN ${startDate} AND ${endDate}
          AND status = 'concluída'
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
      `;

      res.json(
        report.map((row: { date: Date; total_revenue: number | null; sales_count: bigint }) => ({
          date: row.date,
          total_revenue: Number(row.total_revenue || 0),
          sales_count: Number(row.sales_count),
        })),
      );
    }),
  );

  app.get(
    '/api/reports/top-products',
    asyncHandler(async (_req, res) => {
      const report = await db.$queryRaw<Array<{ name: string; total_sold: bigint }>>`
        SELECT p.name, SUM(si.quantity) as total_sold
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.status = 'concluída'
        GROUP BY p.id, p.name
        ORDER BY total_sold DESC
        LIMIT 10
      `;

      res.json(report.map((row: { name: string; total_sold: bigint }) => ({ name: row.name, total_sold: Number(row.total_sold) })));
    }),
  );

  app.get(
    '/api/reports/low-stock',
    asyncHandler(async (_req, res) => {
      const report = await db.product.findMany({
        where: { stock: { lt: 10 } },
        orderBy: { stock: 'asc' },
      });

      res.json(report.map(toProductResponse));
    }),
  );

  app.get(
    '/api/health',
    asyncHandler(async (_req, res) => {
      await db.$queryRaw`SELECT 1`;
      res.json({ ok: true });
    }),
  );

  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ZodError) {
      return res.status(422).json({
        error: 'Payload inválido',
        details: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
      });
    }

    if (error instanceof HttpError) {
      return res.status(error.status).json({ error: error.message });
    }

    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'Registro duplicado para campo único.' });
      }

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Registro não encontrado.' });
      }
    }

    console.error(error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  });

  return app;
}

export function startServer() {
  try {
    const app = createApp();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Backend rodando em http://localhost:${PORT}`);
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('@prisma/client did not initialize yet')) {
      console.error('Prisma Client não gerado. Execute: npm run prisma:generate --workspace backend');
    } else {
      console.error('Falha ao iniciar backend:', message);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}
