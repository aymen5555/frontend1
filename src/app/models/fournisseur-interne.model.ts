export interface FournisseurInterne {
  id: number;
  complexe_id: number;
  nom_f_int: string;
  raison_sociale_f_int?: string;
  contact_f_int?: string;
  tel_f_int?: string;
  email_f_int?: string;
  adresse_f_int?: string;
  matricule_fiscale_f_int?: string;
  active: boolean;
  bon_entrees_count?: number;
  created_at?: string;
  updated_at?: string;
}
