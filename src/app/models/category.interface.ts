export interface Category {
  id: number;
  nom: string;
  slug: string;
  description: string;
  active: boolean;
  produits_count?: number;
}
