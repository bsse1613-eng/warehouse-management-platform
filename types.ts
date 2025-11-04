import { User } from '@supabase/supabase-js';

export type UserRole = 'owner' | 'employee';
export type DeliveryStatus = 'paid' | 'due' | 'partial';

export interface UserProfile {
    id: string;
    name: string;
    role: UserRole;
    email?: string; 
}

export interface Truck {
    id?: number;
    truck_name: string;
    driver_name: string;
    license_number: string;
    contact_number: string;
}

export interface Delivery {
    id?: number;
    truck_id: number;
    sacks_delivered: number;
    total_amount: number;
    amount_paid: number;
    driver_fee?: number;
    extra_purchase_cost?: number;
    extra_purchase_details?: string;
    receiver_name: string;
    receiver_phone: string;
    receiver_address: string;
    status: DeliveryStatus;
    delivery_date: string; // YYYY-MM-DD
    created_at?: string;
    created_by?: string;
    trucks?: Truck; // For joined data
}

export interface Purchase {
    id?: number;
    item_name: string;
    quantity: number;
    cost: number;
    purchase_date: string; // YYYY-MM-DD
    created_at?: string;
}

export interface Payment {
    id?: number;
    delivery_id: number;
    payment_amount: number;
    payment_date: string; // YYYY-MM-DD
}