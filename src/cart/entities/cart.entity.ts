export class Cart {
  readonly id?: string;
  readonly user_id: string;
  readonly items: CartItem[];
}

export class CartItem {
  readonly id?: string;
  readonly quantity: number;
  readonly ticket_id: string;
  readonly cart_id: string;
}

export enum OrderStatus {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export class Order {
  readonly id?: string;
  readonly total_amount: number;
  readonly status?: OrderStatus;
  readonly user_id: string;
}

export class OrderItem {
  readonly id?: string;
  readonly quantity: number;
  readonly order_id: string;
  readonly ticket_id: string;
}

export enum PaymentStatus {
  PENDING = 'pending',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
}

export class Payment {
  readonly id?: string;
  readonly amount: number;
  readonly status?: PaymentStatus;
  readonly txn_reference: string;
  readonly provider?: PaymentProvider;
  readonly payment_channel?: string;
  readonly currency?: string;
  readonly paid_at?: Date;
  readonly order_id: string;
}
