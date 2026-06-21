export interface Terrain {
    id: number;
    complexe_id: number;
    name: string;
    sport_type: string;
    price_per_hour: string | number;
    is_active: boolean;
    complexe?: {
        id: number;
        name: string;
        city?: string;
        is_active: boolean;
        owner_id: number;
    };
    created_at?: string;
    updated_at?: string;
    image_t?: string;
    description_t?: string;
    capacite_t?: number;
    heure_ouverture?: string;
    heure_fermeture?: string;
    nbheures_seance?: number;
    nbminute_seance?: number;
    image_url?: string;
}

export interface TerrainPayload {
    complexe_id?: number;
    name: string;
    sport_type?: string;
    price_per_hour: number;
    is_active?: boolean;
    image_url?: string;
}