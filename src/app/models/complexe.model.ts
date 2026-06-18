export interface Complexe {
    id: number;
    owner_id: number;
    name: string;
    nom_c?: string;
    description?: string;
    address: string;
    city?: string;
    phone?: string;
    is_active: boolean;
    terrains_count?: number;
    terrains?: import('./terrain.model').Terrain[];
    owner?: { id: number; first_name: string; last_name: string; email: string };
    created_at?: string;
    updated_at?: string;
    image_c?: string;
    website_c?: string;
    facebook_c?: string;
    instagram_c?: string;
    description_c?: string;
    email_c?: string;
    horaire_c?: string;
    latitude_c?: number;
    longitude_c?: number;
    moyenne_notation_c?: number;
}

export interface ComplexePayload {
    name: string;
    description?: string;
    address: string;
    city?: string;
    phone?: string;
    is_active?: boolean;
    image_c?: string;
    website_c?: string;
    facebook_c?: string;
    instagram_c?: string;
    description_c?: string;
    email_c?: string;
    horaire_c?: string;
    latitude_c?: number;
    longitude_c?: number;
    moyenne_notation_c?: number;
}
