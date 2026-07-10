import { Complexe } from './complexe.model';

export interface Activite {
  id: number;
  complexe_id: number;
  complexe?: Complexe;
  nom: string;
  description?: string;
  sport: string;
  niveau: string;
  capacite: number;
  prix: number;
  heure_debut: string;
  heure_fin: string;
  jours: string[];
  image?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ReservationActivite {
  id: number;
  activite_id: number;
  activite?: Activite;
  user_id: number;
  date_seance: string;
  statut: 'reservee' | 'confirmee' | 'annulee';
  statut_paiement: 'non_paye' | 'paye' | 'rembourse';
  modalite_paiement?: 'especes' | 'carte';
  notes?: string;
  stripe_payment_intent_id?: string | null;
  refund_status?: 'not_requested' | 'succeeded' | 'pending' | 'failed' | null;
  refund_reference?: string | null;
  user?: { id: number; first_name: string; last_name: string; email: string };
  created_at?: string;
  updated_at?: string;
}

export interface ActiviteFilters {
  complexe_id?: number;
  sport?: string;
  niveau?: string;
}
