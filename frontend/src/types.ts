export const USER_ROLES = ['admin', 'vendedor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SALE_STATUS = ['concluída', 'cancelada'] as const;
export type SaleStatus = (typeof SALE_STATUS)[number];

export const PAYMENT_METHODS = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface User {
  id: number;
  username: string;
  role: UserRole;
}

export interface Client {
  id: number;
  name: string;
  document: string;
  phone: string;
  email: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
  created_at: string;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  price: number;
  stock: number;
  unit: string;
  created_at: string;
}

export interface SaleItem {
  id?: number;
  sale_id?: number;
  product_id: number;
  product_name?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Sale {
  id: number;
  client_id: number;
  client_name?: string;
  user_id: number;
  total: number;
  discount: number;
  payment_method: PaymentMethod;
  status: SaleStatus;
  created_at: string;
  items?: SaleItem[];
}
