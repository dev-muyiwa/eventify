export class Cart {
  readonly id?: string;
  readonly total_amount: number;
  readonly user_id: string;
  readonly items: CartItem[];
}

export class CartItem {
  readonly id?: string;
  readonly ticket_id: string;
  readonly attendee_info: Attendee;
  readonly cart_id: string;
}

class Attendee {
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
}

export class Payment {
  readonly id?: string;
  readonly cart_id: string;
  readonly txn_reference: string;
  readonly amount: number;
  readonly currency: string;
  readonly status: string;
  readonly payment_method: string;
  readonly paid_at?: Date;
}
