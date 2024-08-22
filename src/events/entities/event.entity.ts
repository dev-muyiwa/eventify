export class Event {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly starts_at: Date;
  readonly ends_at: Date;
  readonly location: string;
  readonly creator_id: string;
  readonly published_at?: Date | null;
}

export class Ticket {
  readonly id?: string;
  readonly name: string;
  readonly description: string;
  readonly price: number;
  readonly total_quantity: number;
  readonly event_id: string;
}

export class TicketReservation {
  readonly id?: string;
  readonly first_name: string;
  readonly last_name: string;
  readonly email: string;
  readonly ticket_id: string;
  readonly user_id: string;
}
