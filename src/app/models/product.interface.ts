import { Category } from './category.interface';
import { Complexe } from './complexe.model';

export interface Product {
  id: number;
  nom: string;
  description: string;
  prix: number;
  prix_achat?: number;
  reference?: string;
  image?: string;
  image_url?: string;
  sport_cible: string;
  niveau_cible: string;
  actif: boolean;
  categorie?: Category | null;
  categorie_id?: number;
  complexe_id?: number;
  stock?: {
    id: number;
    produit_id: number;
    quantite_disponible: number;
    quantite_minimale: number;
  };
  complexe?: Complexe | null;
  disponible: boolean;
  alerte_stock?: boolean;
  average_rating?: number | null;
  stock_disponible?: number;
}
