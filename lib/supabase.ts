import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key for admin operations
export const createServerSupabaseClient = () => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, supabaseServiceKey);
};

// Database types
export interface PublicUser {
    id: string;
    aadhaar_number: string;
    mobile_number: string;
    name?: string;
    created_at: string;
}

export interface Officer {
    id: string;
    badge_id: string;
    name: string;
    email?: string;
    area: string;
    face_data?: string;
    created_at: string;
}

export interface Technician {
    id: string;
    badge_id: string;
    name: string;
    email?: string;
    area: string;
    specialization: string;
    face_data?: string;
    available: boolean;
    created_at: string;
}

export interface Report {
    id: string;
    user_id: string;
    category: string;
    description: string;
    image_url?: string;
    video_url?: string;
    latitude: number;
    longitude: number;
    address: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assigned_technician_id?: string;
    assigned_officer_id?: string;
    resolution_notes?: string;
    resolution_image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface OTPRecord {
    id: string;
    mobile_number: string;
    otp_code: string;
    expires_at: string;
    verified: boolean;
    created_at: string;
}
