export type UserRole = 'CLIENT' | 'SUPER_ADMIN' | 'SUBSCRIBER' | 'GERANT' | 'ADMIN';

export interface User {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    role: UserRole;
    is_active: boolean;
    email_verified_at?: string | null;
    created_at: string;
    complexe_id?: number;
    complexe?: { id: number; name: string } | null;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        token?: string;
        token_type?: string;
        expires_in?: number;
        verification_sent?: boolean;
    };
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        verification_sent: boolean;
        verification_url?: string;
    };
}

export interface ResendVerificationResponse {
    success: boolean;
    message: string;
    data?: {
        verification_url?: string;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    password: string;
    password_confirmation: string;
    role: UserRole;
    complexe_id?: number;
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}
