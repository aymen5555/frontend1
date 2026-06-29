import { TypeDepense } from './type-depense.model';

export interface Depense {
  id: number;
  date_depense: string;
  montant_dep: number;
  commentaire_dep?: string;
  type_depense_id: number;
  complexe_id: number;
  created_by: number;
  type_depense?: TypeDepense;
  created_at: string;
  updated_at: string;
}
