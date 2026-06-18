import { Complexe } from './complexe.model';

export interface RecommandationComplexe {
    id: number;
    user_id: number;
    complexe_id: number;
    score: number;
    rang: number;
    explication: string;
    complexe?: Complexe;
    created_at?: string;
    updated_at?: string;
}
