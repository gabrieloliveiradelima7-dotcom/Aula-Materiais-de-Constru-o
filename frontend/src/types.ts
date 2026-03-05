import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  SALE_STATUS,
  USER_ROLES,
  type PaymentMethod,
  type SaleStatus,
  type UserRole,
} from '../../shared/enums';

export { PAYMENT_METHOD_LABELS, PAYMENT_METHODS, SALE_STATUS, USER_ROLES };
export type { PaymentMethod, SaleStatus, UserRole };

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
