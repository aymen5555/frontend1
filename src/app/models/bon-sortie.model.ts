import { Product } from './product.interface';
import { Complexe } from './complexe.model';

export interface LigneBonSortie {
  id?: number;
  bon_sortie_id?: number;
  produit_id: number;
  produit?: Product;
  quantite_entree_lig_bon_sor: number;
  prix_unitaire_constate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BonSortie {
  id: number;
  reference: string;
  date_bon_sor: string;
  total_ttc_bon_sor: number;
  complexe_id: number;
  complexe?: Complexe;
  motif?: string;
  created_by?: number;
  creePar?: { id: number; first_name?: string; last_name?: string };
  lignes: LigneBonSortie[];
  created_at: string;
  updated_at: string;
}
