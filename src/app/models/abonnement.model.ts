export type SubscriptionType = 'MONTHLY' | 'YEARLY';
export type SubscriptionStatus = 'pending' | 'active' | 'cancelled' | 'expired';
export type PaymentMethod = 'carte' | 'especes';
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

export interface Abonnement {
  id: number;
  user_id: number;
  type: SubscriptionType;
  status: SubscriptionStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  price: number;
  start_at: string | null;
  expires_at: string | null;
  reference?: string | null;
  created_at: string;
  updated_at: string;
}
