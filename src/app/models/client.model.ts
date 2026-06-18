export interface Client {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    is_active: boolean;
    email_verified_at?: string | null;
    bookings_on_my_courts_count: number;
    created_at: string;
}
