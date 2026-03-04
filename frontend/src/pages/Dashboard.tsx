import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    lowStockCount: 0,
    clientCount: 0
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [salesRes, productsRes, clientsRes] = await Promise.all([
          fetch('/api/sales'),
          fetch('/api/products'),
          fetch('/api/clients')
        ]);
        
        const sales = await salesRes.json();
        const products = await productsRes.json();
        const clients = await clientsRes.json();

        const activeSales = sales.filter((s: any) => s.status === 'concluída');
        const revenue = activeSales.reduce((acc: number, s: any) => acc + s.total, 0);
        const lowStock = products.filter((p: any) => p.stock < 10).length;

        setStats({
          totalSales: activeSales.length,
          totalRevenue: revenue,
          lowStockCount: lowStock,
          clientCount: clients.length
        });
      } catch (e) {
        console.error(e);
      }
    };
    fetchData();
  }, []);

  const cards = [
    { label: 'Vendas Totais', value: stats.totalSales, icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Faturamento', value: `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, icon: ArrowUpRight, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { label: 'Estoque Baixo', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
    { label: 'Clientes', value: stats.clientCount, icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl shadow-sm border border-black/5 flex items-start justify-between"
          >
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">{card.label}</p>
              <h3 className="text-2xl font-bold text-gray-900">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
              <card.icon size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <Package size={20} className="mr-2 text-emerald-500" />
            Produtos com Baixo Estoque
          </h3>
          <div className="space-y-4">
            {/* This would ideally be a list fetched from /api/reports/low-stock */}
            <p className="text-sm text-gray-500 italic">Verifique o módulo de relatórios para detalhes completos do estoque.</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-black/5">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-500" />
            Atividade Recente
          </h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-500 italic">As últimas vendas e cadastros aparecerão aqui.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
