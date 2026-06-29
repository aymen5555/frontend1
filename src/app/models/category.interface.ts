export interface CategoryItem {
  id: number;
  nom: string;
  active: boolean;
  description: string;
  slug: string;
}

export interface Category {
  id: number;
  nom: string;
  slug: string;
  description: string;
  active: boolean;
  produits_count?: number;
}
