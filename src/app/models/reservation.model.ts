export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'expired' | 'played';
export type ReservationType = 'online' | 'manual';
export type PaymentMethod = 'carte' | 'especes';
export type PaymentStatus = 'non_paye' | 'paye' | 'rembourse';

export interface Reservation {
    id: number;
    user_id: number;
    terrain_id: number;
    start_at: string;
    end_at: string;
    status: ReservationStatus;
    type?: ReservationType;
    modalite_paiement?: PaymentMethod;
    statut_paiement?: PaymentStatus;
    montant_paye?: number;
    refund_status?: 'not_requested' | 'succeeded' | 'pending' | 'failed' | null;
    refund_reference?: string | null;
    notes?: string;
    paid?: boolean;
    heure_debut?: string;
    heure_fin?: string;
    created_at?: string;
    terrain?: import('./terrain.model').Terrain & {
        complexe?: { id: number; name: string; city?: string };
    };
    user?: { id: number; first_name: string; last_name: string; email: string; phone?: string };
    reglements?: ReglementReservation[];
    updated_at?: string;
}

export interface ReservationPayload {
    terrain_id: number;
    start_at: string;
    end_at: string;
    notes?: string;
    modalite_paiement: PaymentMethod;
    status?: ReservationStatus;
}

export interface ManualReservationPayload {
    terrain_id: number;
    date_seance_res: string;
    heure_debut_res: string;
    heure_fin_res: string;
    client_id: number;
    modalite_paiement: PaymentMethod;
    notes?: string;
}

export interface ReglementReservation {
    id: number;
    reservation_id: number;
    type: 'paiement' | 'remboursement';
    montant: number;
    reference?: string;
    created_at?: string;
}