import { Product } from './product.interface';
import { Complexe } from './complexe.model';
import { FournisseurInterne } from './fournisseur-interne.model';

export interface LigneBonEntree {
  id?: number;
  bon_entree_id?: number;
  produit_id: number;
  produit?: Product;
  quantite_entree_lig_bon_ent: number;
  prix_unitaire_dachat_lig_bon_ent: number;
  sous_total: number;
  created_at?: string;
  updated_at?: string;
}

export interface BonEntree {
  id: number;
  reference: string;
  date_bon_ent: string;
  total_ttc_bon_ent: number;
  fournisseur_interne_id: number;
  fournisseur_interne?: FournisseurInterne;
  fournisseurInterne?: FournisseurInterne;
  complexe_id: number;
  complexe?: Complexe;
  created_by?: number;
  cree_par?: { id: number; first_name?: string; last_name?: string };
  creePar?: { id: number; first_name?: string; last_name?: string };
  lignes: LigneBonEntree[];
  created_at: string;
  updated_at: string;
  montant_paye?: number;
  reference_paiement?: string;
  statut_paiement?: string;
  reglements?: { id?: number; type?: string; montant: number; reference?: string; created_at?: string }[];
}
