import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, XCircle } from 'lucide-react';
import { Client, Product, User, SaleItem, PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from '../types';
import { apiFetch } from '../lib/api';
import { motion, AnimatePresence } from 'motion/react';

export default function Sales({ user }: { user: User }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clientSearch, setClientSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [cRes, pRes] = await Promise.all([apiFetch('/api/clients'), apiFetch('/api/products')]);
      setClients(await cRes.json());
      setProducts(await pRes.json());
    };
    fetchData();
  }, []);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert('Produto sem estoque!');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.product_id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) {
          alert('Quantidade máxima atingida!');
          return prev;
        }
        return prev.map(item => 
          item.product_id === product.id 
            ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.unit_price }
            : item
        );
      }
      return [...prev, {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.price,
        subtotal: product.price
      }];
    });
  };

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product_id === productId) {
        const product = products.find(p => p.id === productId);
        const newQty = Math.max(0, item.quantity + delta);
        if (product && newQty > product.stock) {
          alert('Estoque insuficiente!');
          return item;
        }
        return { ...item, quantity: newQty, subtotal: newQty * item.unit_price };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);

  const handleFinishSale = async () => {
    if (!selectedClient) return alert('Selecione um cliente!');
    if (cart.length === 0) return alert('O carrinho está vazio!');

    setIsProcessing(true);
    try {
      const res = await apiFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: selectedClient.id,
          user_id: user.id,
          items: cart,
          total,
          discount,
          payment_method: paymentMethod
        })
      });

      if (res.ok) {
        alert('Venda realizada com sucesso!');
        setCart([]);
        setSelectedClient(null);
        setDiscount(0);
        // Refresh products to update stock
        const pRes = await apiFetch('/api/products');
        setProducts(await pRes.json());
      } else {
        const err = await res.json();
        alert(err.error || 'Erro ao processar venda');
      }
    } catch (e) {
      alert('Erro de conexão');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(clientSearch.toLowerCase()) || 
    c.document.includes(clientSearch)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Product Selection */}
      <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
        <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar produto por nome ou código..."
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 overflow-y-auto max-h-[500px] pr-2 custom-scrollbar">
            {filteredProducts.map(product => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                disabled={product.stock <= 0}
                className={`flex items-center p-4 bg-white border border-black/5 rounded-2xl hover:border-emerald-500/50 hover:shadow-md transition-all text-left group ${product.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
              >
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{product.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{product.code}</p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="text-sm font-bold text-emerald-600">R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${product.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                      Estoque: {product.stock} {product.unit}
                    </span>
                  </div>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-500 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
                  <Plus size={20} />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Checkout Section */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-6 border-b border-black/5 bg-gray-50">
          <h3 className="text-lg font-bold flex items-center">
            <ShoppingCart size={20} className="mr-2 text-emerald-500" />
            Carrinho de Venda
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Cliente</label>
            {!selectedClient ? (
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  className="w-full px-4 py-2 bg-gray-50 border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                {clientSearch && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-black/10 rounded-xl shadow-xl z-30 max-h-40 overflow-y-auto">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setSelectedClient(c); setClientSearch(''); }}
                        className="w-full text-left px-4 py-2 hover:bg-emerald-50 text-sm transition-colors"
                      >
                        <p className="font-bold">{c.name}</p>
                        <p className="text-[10px] text-gray-500 font-mono">{c.document}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                <div>
                  <p className="text-sm font-bold text-emerald-900">{selectedClient.name}</p>
                  <p className="text-[10px] text-emerald-700 font-mono">{selectedClient.document}</p>
                </div>
                <button onClick={() => setSelectedClient(null)} className="text-emerald-500 hover:text-emerald-700">
                  <XCircle size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Cart Items */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Itens</label>
            {cart.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8 italic">Carrinho vazio</p>
            ) : (
              <div className="space-y-3">
                <AnimatePresence>
                  {cart.map(item => (
                    <motion.div
                      key={item.product_id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-black/5"
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-sm font-bold truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">R$ {item.unit_price.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button onClick={() => updateQuantity(item.product_id, -1)} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                          <Minus size={14} />
                        </button>
                        <span className="text-sm font-bold w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, 1)} className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                          <Plus size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="p-6 bg-gray-50 border-t border-black/5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Subtotal</span>
              <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>Desconto</span>
              <div className="flex items-center">
                <span className="mr-2">R$</span>
                <input
                  type="number"
                  className="w-20 px-2 py-1 bg-white border border-black/10 rounded-lg text-right text-sm"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-black/10">
              <span>Total</span>
              <span className="text-emerald-600">R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">Pagamento</label>
            <select
              className="w-full px-4 py-2 bg-white border border-black/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {PAYMENT_METHOD_LABELS[method]}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleFinishSale}
            disabled={isProcessing || cart.length === 0 || !selectedClient}
            className={`w-full py-4 rounded-2xl font-bold text-white transition-all shadow-lg flex items-center justify-center ${
              isProcessing || cart.length === 0 || !selectedClient
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20'
            }`}
          >
            {isProcessing ? 'Processando...' : (
              <>
                <CheckCircle size={20} className="mr-2" />
                Finalizar Venda
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
