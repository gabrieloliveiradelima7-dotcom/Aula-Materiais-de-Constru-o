export const USER_ROLES = ['admin', 'vendedor'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const SALE_STATUS = ['concluída', 'cancelada'] as const;
export type SaleStatus = (typeof SALE_STATUS)[number];

export const PAYMENT_METHODS = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'boleto'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  pix: 'PIX',
  dinheiro: 'Dinheiro',
  cartao_credito: 'Cartão de Crédito',
  cartao_debito: 'Cartão de Débito',
  boleto: 'Boleto',
};
