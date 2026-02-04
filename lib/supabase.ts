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

// ============================================
// SUPABASE AUTH HELPERS (Public User Email + Password)
// ============================================

/**
 * Sign up a new user with email and password
 * Supabase will automatically send a verification email
 */
export async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password,
    });
    return { data, error };
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
    });
    return { data, error };
}

/**
 * Sign out the current user
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
}

/**
 * Get the current auth session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
}

/**
 * Get the currently authenticated user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
}

/**
 * Check if the user's email is verified
 */
export function isEmailVerified(user: any): boolean {
    return user?.email_confirmed_at != null;
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
}

/**
 * Send password reset email
 * Supabase will send an email with a link to reset password
 */
export async function resetPassword(email: string) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
            redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/login/public/reset-password`,
        }
    );
    return { data, error };
}

/**
 * Update password (after clicking reset link)
 */
export async function updatePassword(newPassword: string) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    return { data, error };
}

