export interface EquipementPayload {
  nom_eq: string;
  icone_eq?: string;
}

export interface Equipement {
  id: number;
  nom_eq: string;
  icone_eq?: string;
  created_at: string;
  updated_at: string;
}
