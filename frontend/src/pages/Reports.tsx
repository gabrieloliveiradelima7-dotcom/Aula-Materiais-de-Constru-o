import React, { useState, useEffect } from 'react';
import { BarChart3, Download, Calendar, Filter, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Sale, Product } from '../types';
import { apiFetch } from '../lib/api';

export default function Reports() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const fetchReports = async () => {
    const [salesRes, topRes, lowRes] = await Promise.all([
      apiFetch(`/api/reports/sales-period?start=${dateRange.start}&end=${dateRange.end}`),
      apiFetch('/api/reports/top-products'),
      apiFetch('/api/reports/low-stock')
    ]);
    
    setSales(await salesRes.json());
    setTopProducts(await topRes.json());
    setLowStock(await lowRes.json());
  };

  useEffect(() => { fetchReports(); }, [dateRange]);

  const totalRevenue = sales.reduce((acc, s: any) => acc + s.total_revenue, 0);
  const totalSalesCount = sales.reduce((acc, s: any) => acc + s.sales_count, 0);

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-gray-50 border border-black/5 rounded-xl px-3 py-2">
            <Calendar size={18} className="text-gray-400 mr-2" />
            <input 
              type="date" 
              className="bg-transparent text-sm outline-none" 
              value={dateRange.start}
              onChange={e => setDateRange({...dateRange, start: e.target.value})}
            />
            <span className="mx-2 text-gray-300">até</span>
            <input 
              type="date" 
              className="bg-transparent text-sm outline-none" 
              value={dateRange.end}
              onChange={e => setDateRange({...dateRange, end: e.target.value})}
            />
          </div>
          <button onClick={fetchReports} className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
            <Filter size={20} />
          </button>
        </div>
        <button className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors text-sm font-medium">
          <Download size={18} className="mr-2" />
          Exportar PDF
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Faturado no Período</p>
          <h3 className="text-3xl font-bold text-gray-900">R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
          <div className="flex items-center mt-4 text-emerald-500 text-sm font-medium">
            <ArrowUpRight size={16} className="mr-1" />
            <span>+12.5% em relação ao mês anterior</span>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
          <p className="text-sm font-medium text-gray-500 mb-1">Vendas Realizadas</p>
          <h3 className="text-3xl font-bold text-gray-900">{totalSalesCount}</h3>
          <div className="flex items-center mt-4 text-gray-500 text-sm font-medium">
            <span>Média de {(totalRevenue / (totalSalesCount || 1)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} por venda</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center">
            <BarChart3 size={20} className="mr-2 text-emerald-500" />
            Produtos Mais Vendidos
          </h3>
          <div className="space-y-4">
            {topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-black/5">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center bg-white border border-black/10 rounded-full text-[10px] font-bold text-gray-400 mr-3">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-gray-900">{item.name}</span>
                </div>
                <span className="text-sm font-bold text-emerald-600">{item.total_sold} vendidos</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-sm text-gray-400 italic text-center py-4">Nenhum dado disponível</p>}
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-white p-8 rounded-2xl border border-black/5 shadow-sm">
          <h3 className="text-lg font-bold mb-6 flex items-center text-red-500">
            <ArrowDownRight size={20} className="mr-2" />
            Alerta de Estoque Baixo
          </h3>
          <div className="space-y-4">
            {lowStock.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-4 bg-red-50/50 rounded-xl border border-red-100">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-red-600">{product.stock} {product.unit}</p>
                  <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Repor Urgente</p>
                </div>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-emerald-500 italic text-center py-4">Estoque em dia!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
