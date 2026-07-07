import type { Dirigeant } from './dirigeant.model';

export interface SocietePayload {
  nom_soc: string;
  image?: string;
  description?: string;
  telephone?: string;
  date_de_creation?: string;
}

export interface Societe {
  id: number;
  nom_soc: string;
  image?: string;
  description?: string;
  telephone?: string;
  date_de_creation?: string;
  image_url: string;
  dirigeants?: Dirigeant[];
  complexes?: any[];
  complexes_count?: number;
  created_at: string;
  updated_at: string;
}
