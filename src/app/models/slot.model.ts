export interface Slot {
  time: string;
  available: boolean;
  selected?: boolean;
  starts_at?: string;
  ends_at?: string;
  timezone?: string;
}
