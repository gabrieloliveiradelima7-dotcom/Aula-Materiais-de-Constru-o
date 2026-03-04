import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("store.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT DEFAULT 'vendedor'
  );

  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    document TEXT UNIQUE NOT NULL,
    phone TEXT,
    email TEXT,
    street TEXT,
    number TEXT,
    neighborhood TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    price REAL NOT NULL,
    stock INTEGER DEFAULT 0,
    unit TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id INTEGER,
    user_id INTEGER,
    total REAL NOT NULL,
    discount REAL DEFAULT 0,
    payment_method TEXT,
    status TEXT DEFAULT 'concluída',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sale_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sale_id INTEGER,
    product_id INTEGER,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
  );
`);

// Seed admin user if not exists
const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!admin) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT id, username, role FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Credenciais inválidas" });
    }
  });

  // Clients
  app.get("/api/clients", (req, res) => {
    const clients = db.prepare("SELECT * FROM clients ORDER BY name").all();
    res.json(clients);
  });

  app.post("/api/clients", (req, res) => {
    try {
      const { name, document, phone, email, street, number, neighborhood, city, state, zip } = req.body;
      const result = db.prepare(`
        INSERT INTO clients (name, document, phone, email, street, number, neighborhood, city, state, zip)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(name, document, phone, email, street, number, neighborhood, city, state, zip);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/clients/:id", (req, res) => {
    const { id } = req.params;
    const { name, document, phone, email, street, number, neighborhood, city, state, zip } = req.body;
    db.prepare(`
      UPDATE clients SET name=?, document=?, phone=?, email=?, street=?, number=?, neighborhood=?, city=?, state=?, zip=?
      WHERE id=?
    `).run(name, document, phone, email, street, number, neighborhood, city, state, zip, id);
    res.json({ success: true });
  });

  app.delete("/api/clients/:id", (req, res) => {
    db.prepare("DELETE FROM clients WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Products
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products ORDER BY name").all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    try {
      const { code, name, description, category, price, stock, unit } = req.body;
      const result = db.prepare(`
        INSERT INTO products (code, name, description, category, price, stock, unit)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(code, name, description, category, price, stock, unit);
      res.json({ id: result.lastInsertRowid });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.put("/api/products/:id", (req, res) => {
    const { id } = req.params;
    const { code, name, description, category, price, stock, unit } = req.body;
    db.prepare(`
      UPDATE products SET code=?, name=?, description=?, category=?, price=?, stock=?, unit=?
      WHERE id=?
    `).run(code, name, description, category, price, stock, unit, id);
    res.json({ success: true });
  });

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Sales
  app.get("/api/sales", (req, res) => {
    const sales = db.prepare(`
      SELECT s.*, c.name as client_name 
      FROM sales s 
      JOIN clients c ON s.client_id = c.id 
      ORDER BY s.created_at DESC
    `).all();
    res.json(sales);
  });

  app.post("/api/sales", (req, res) => {
    const { client_id, user_id, items, total, discount, payment_method } = req.body;
    
    const transaction = db.transaction(() => {
      // Create sale
      const saleResult = db.prepare(`
        INSERT INTO sales (client_id, user_id, total, discount, payment_method)
        VALUES (?, ?, ?, ?, ?)
      `).run(client_id, user_id, total, discount, payment_method);
      
      const saleId = saleResult.lastInsertRowid;

      // Add items and update stock
      for (const item of items) {
        // Check stock
        const product = db.prepare("SELECT stock FROM products WHERE id = ?").get(item.product_id) as any;
        if (product.stock < item.quantity) {
          throw new Error(`Estoque insuficiente para o produto ID ${item.product_id}`);
        }

        db.prepare(`
          INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, subtotal)
          VALUES (?, ?, ?, ?, ?)
        `).run(saleId, item.product_id, item.quantity, item.unit_price, item.subtotal);

        db.prepare("UPDATE products SET stock = stock - ? WHERE id = ?").run(item.quantity, item.product_id);
      }

      return saleId;
    });

    try {
      const saleId = transaction();
      res.json({ id: saleId });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post("/api/sales/:id/cancel", (req, res) => {
    const { id } = req.params;
    const transaction = db.transaction(() => {
      const sale = db.prepare("SELECT status FROM sales WHERE id = ?").get(id) as any;
      if (sale.status === 'cancelada') return;

      const items = db.prepare("SELECT * FROM sale_items WHERE sale_id = ?").all() as any[];
      for (const item of items) {
        db.prepare("UPDATE products SET stock = stock + ? WHERE id = ?").run(item.quantity, item.product_id);
      }

      db.prepare("UPDATE sales SET status = 'cancelada' WHERE id = ?").run(id);
    });

    transaction();
    res.json({ success: true });
  });

  // Reports
  app.get("/api/reports/sales-period", (req, res) => {
    const { start, end } = req.query;
    const report = db.prepare(`
      SELECT DATE(created_at) as date, SUM(total) as total_revenue, COUNT(*) as sales_count
      FROM sales
      WHERE created_at BETWEEN ? AND ? AND status = 'concluída'
      GROUP BY DATE(created_at)
    `).all(start, end);
    res.json(report);
  });

  app.get("/api/reports/top-products", (req, res) => {
    const report = db.prepare(`
      SELECT p.name, SUM(si.quantity) as total_sold
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      JOIN sales s ON si.sale_id = s.id
      WHERE s.status = 'concluída'
      GROUP BY p.id
      ORDER BY total_sold DESC
      LIMIT 10
    `).all();
    res.json(report);
  });

  app.get("/api/reports/low-stock", (req, res) => {
    const report = db.prepare("SELECT * FROM products WHERE stock < 10").all();
    res.json(report);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
