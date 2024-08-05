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
