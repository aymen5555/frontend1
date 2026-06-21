import { Product } from './product.interface';
import { Complexe } from './complexe.model';

export interface DirectSaleLigne {
  id?: number;
  produit_id: number;
  produit?: Product;
  quantite: number;
  prix_unitaire: number;
  sous_total?: number;
}

export interface DirectSale {
  id: number;
  complexe_id: number;
  complexe?: Complexe;
  montant_total: number;
  modalite_paiement: 'especes' | 'carte';
  reference?: string;
  client_nom?: string;
  user_id?: number;
  notes?: string;
  created_at: string;
  lignes: DirectSaleLigne[];
}
