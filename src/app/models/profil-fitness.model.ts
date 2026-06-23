export interface ProfilFitness {
    id: number;
    user_id: number;
    taille: number;
    poids: number;
    imc: number;
    poids_cible?: number;
    objectif_sportif: 'perte_poids' | 'prise_masse' | 'performance';
    niveau_sportif: 'debutant' | 'intermediaire' | 'expert';
    sport_prefere: 'football' | 'padel' | 'natation' | 'tennis' | 'musculation' | 'yoga' | 'fitness' | 'volleyball' | 'basketball' | 'handball';
    budget_mensuel_min?: number;
    budget_mensuel_max?: number;
    verif_fitness?: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface ProfilFitnessPayload {
    taille: number;
    poids: number;
    poids_cible?: number;
    objectif_sportif: string;
    niveau_sportif: string;
    sport_prefere: string;
    budget_mensuel_min?: number;
    budget_mensuel_max?: number;
}

export interface RecommendationResponse {
    success: boolean;
    has_profile: boolean;
    recommendations: RecommendationItem[];
}

import { Complexe } from './complexe.model';
import { Product } from './product.interface';
import { Activite } from './activite.model';

export interface RecommendationItem {
    rang: number;
    score: number;
    complexe: Complexe;
    explication: string;
    matched_sport?: string;
}

export interface ProductRecommendationItem {
    rang: number;
    score: number;
    produit: Product;
    explication: string;
}

export interface ActivityRecommendationItem {
    rang: number;
    score: number;
    activite: Activite;
    explication: string;
}
