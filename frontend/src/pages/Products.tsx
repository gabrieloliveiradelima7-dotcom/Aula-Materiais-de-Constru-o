import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Product } from '../types';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    code: '', name: '', description: '', category: '', price: 0, stock: 0, unit: 'unidade'
  });

  const fetchProducts = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data);
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingProduct ? 'PUT' : 'POST';
    const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ code: '', name: '', description: '', category: '', price: 0, stock: 0, unit: 'unidade' });
      fetchProducts();
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar produto');
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      code: product.code, name: product.name, description: product.description,
      category: product.category, price: product.price, stock: product.stock, unit: product.unit
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este produto?')) {
      await fetch(`/api/products/${id}`, { method: 'DELETE' });
      fetchProducts();
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="flex items-center justify-center px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} className="mr-2" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-black/5">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Produto</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Categoria</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Preço</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Estoque</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{product.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{product.code}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md uppercase font-medium">
                    {product.category || 'Geral'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">
                  R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className={`font-bold ${product.stock < 10 ? 'text-red-500' : 'text-gray-700'}`}>
                      {product.stock}
                    </span>
                    <span className="ml-1 text-xs text-gray-400">{product.unit}</span>
                    {product.stock < 10 && <AlertCircle size={14} className="ml-2 text-red-500" />}
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(product)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
                  <input required type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome do Produto</label>
                  <input required type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Descrição</label>
                  <textarea className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none h-20" 
                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Categoria</label>
                  <select className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Selecione...</option>
                    <option value="cimento">Cimento/Argamassa</option>
                    <option value="areia">Areia/Pedra</option>
                    <option value="ferramentas">Ferramentas</option>
                    <option value="eletrica">Elétrica</option>
                    <option value="hidraulica">Hidráulica</option>
                    <option value="tintas">Tintas</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Unidade</label>
                  <input type="text" placeholder="ex: saco, m, un" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Preço de Venda (R$)</label>
                  <input required type="number" step="0.01" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.price} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Estoque Inicial</label>
                  <input required type="number" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-8 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                  Salvar Produto
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
