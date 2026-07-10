import { Product } from './product.interface';
import { Complexe } from './complexe.model';

export interface OrderLine {
  id: number;
  commande_id: number;
  produit_id: number;
  produit_nom?: string;
  produit?: Product;
  quantite: number;
  prix_unitaire: number;
  sous_total: number;
}

export interface Order {
  id: number;
  user_id: number;
  client_nom?: string;
  client_email?: string;
  complexe_id: number;
  complexe?: Complexe;
  statut: 'en_attente' | 'confirmee' | 'preparee' | 'livree' | 'annulee';
  statut_paiement: 'non_paye' | 'paye' | 'rembourse';
  modalite_paiement: 'especes' | 'carte';
  montant_total: number;
  montant_paye?: number;
  reglements?: { id: number; type?: string; montant: number; reference?: string; created_at?: string }[];
  refund_status?: 'not_requested' | 'succeeded' | 'pending' | 'failed' | null;
  refund_reference?: string | null;
  stripe_payment_intent_id?: string | null;
  notes?: string;
  lignes: OrderLine[];
  created_at: string;
}
