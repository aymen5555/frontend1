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
  statut_paiement: 'non_paye' | 'paye';
  modalite_paiement: 'especes' | 'carte';
  montant_total: number;
  notes?: string;
  lignes: OrderLine[];
  created_at: string;
}
