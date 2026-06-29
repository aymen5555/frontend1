export interface TypeAbonnement {
  id: number;
  complexe_id: number;
  nom: string;
  description?: string;
  nb_mois: number;
  tarif: number;
  prix_unitaire: number;
  niveau_sportif_cible: 'debutant' | 'intermediaire' | 'expert' | 'tous';
  sport_cible?: string;
  avantages?: string[];
  active?: boolean;
  abonnements_count?: number;
  categorie_abonnement_adherent_id?: number;
  categorie_abonnement_adherent?: {
    id: number;
    nom_cat_abo_ad: string;
    active: boolean;
  };
  complexe?: import('./complexe.model').Complexe;
}

export interface ReglementAbonnement {
  id: number;
  abonnement_id: number;
  montant: number;
  date_reglement: string;
  modalite: 'especes' | 'carte';
  encaisse: boolean;
  reference?: string;
}

export interface AbonnementAdherent {
  id: number;
  user_id: number;
  complexe_id: number;
  type_abonnement_id: number;
  date_debut: string;
  date_fin: string;
  montant_vente: number;
  remise: number;
  montant_apres_remise: number;
  modalite_paiement?: 'especes' | 'carte';
  reference?: string;
  statut: 'actif' | 'expire' | 'annule';
  paye: boolean;
  reste_a_payer: number;
  created_at?: string;
  updated_at?: string;
  complexe?: import('./complexe.model').Complexe;
  type_abonnement?: TypeAbonnement;
  reglements?: ReglementAbonnement[];
  user?: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
  };
}
