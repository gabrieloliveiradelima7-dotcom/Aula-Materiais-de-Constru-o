import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Client } from '../types';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '', document: '', phone: '', email: '',
    street: '', number: '', neighborhood: '', city: '', state: '', zip: ''
  });

  const fetchClients = async () => {
    const res = await fetch('/api/clients');
    const data = await res.json();
    setClients(data);
  };

  useEffect(() => { fetchClients(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editingClient ? 'PUT' : 'POST';
    const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setIsModalOpen(false);
      setEditingClient(null);
      setFormData({
        name: '', document: '', phone: '', email: '',
        street: '', number: '', neighborhood: '', city: '', state: '', zip: ''
      });
      fetchClients();
    } else {
      const err = await res.json();
      alert(err.error || 'Erro ao salvar cliente');
    }
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name, document: client.document, phone: client.phone, email: client.email,
      street: client.street, number: client.number, neighborhood: client.neighborhood,
      city: client.city, state: client.state, zip: client.zip
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
      await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      fetchClients();
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.document.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por nome ou CPF/CNPJ..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setEditingClient(null); setIsModalOpen(true); }}
          className="flex items-center justify-center px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors font-medium shadow-lg shadow-emerald-500/20"
        >
          <Plus size={18} className="mr-2" />
          Novo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-black/5">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Nome / Razão Social</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">CPF / CNPJ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contato</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Localização</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {filteredClients.map((client) => (
              <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <p className="font-semibold text-gray-900">{client.name}</p>
                  <p className="text-xs text-gray-500">Cadastrado em {new Date(client.created_at).toLocaleDateString()}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600 font-mono">{client.document}</td>
                <td className="px-6 py-4">
                  <p className="text-sm text-gray-900">{client.phone}</p>
                  <p className="text-xs text-gray-500">{client.email}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {client.city} - {client.state}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(client)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(client.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
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
            className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
          >
            <div className="px-6 py-4 border-b border-black/5 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-bold">{editingClient ? 'Editar Cliente' : 'Novo Cliente'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo / Razão Social</label>
                  <input required type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">CPF / CNPJ</label>
                  <input required type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.document} onChange={e => setFormData({...formData, document: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
                  <input type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                  <input type="email" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              
              <div className="pt-4 border-t border-black/5">
                <h4 className="text-sm font-bold text-gray-400 uppercase mb-4">Endereço</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Rua</label>
                    <input type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                      value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Número</label>
                    <input type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                      value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Bairro</label>
                    <input type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                      value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Cidade</label>
                    <input type="text" className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                      value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Estado (UF)</label>
                    <input type="text" maxLength={2} className="w-full px-4 py-2 border border-black/10 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none" 
                      value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end space-x-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="px-8 py-2 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                  Salvar Cliente
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
