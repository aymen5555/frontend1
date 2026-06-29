import { Complexe } from './complexe.model';

export interface Supplier {
  id: number;
  complexe_id: number;
  complexe?: Complexe;
  nom: string;
  contact?: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  actif: boolean;
  categorie_fournisseur_id?: number;
  categorie_fournisseur?: {
    id: number;
    nom_cat_four: string;
    active: boolean;
  };
}
