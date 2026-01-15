/**
 * Authentication utilities for FixCity
 * Handles phone number validation and OTP generation for demo mode
 */

/**
 * Generate a random 6-digit OTP (for demo mode only)
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Verify phone number format
 * @param phoneNumber - 10 digit Indian mobile number
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and check for 10 digit Indian mobile number
    const cleaned = phoneNumber.replace(/\s/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Format phone number to E.164 format for Firebase
 * @param phoneNumber - 10 digit phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/\s/g, '');
    if (cleaned.startsWith('+')) {
        return cleaned;
    }
    return '+91' + cleaned;
}

// Global OTP Store for Prototype (In-Memory)
// In a real app, use Redis or a database
declare global {
    // eslint-disable-next-line no-var
    var otpStore: Map<string, { otp: string; expiresAt: number; aadhaar?: string }>;
}

if (!global.otpStore) {
    global.otpStore = new Map();
}

/**
 * Generate and store a 6-digit OTP for a mobile number
 * returns the generated OTP
 */
export function generateAndStoreOTP(mobile: string): string {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

    global.otpStore.set(mobile, { otp, expiresAt });
    return otp;
}

/**
 * Verify an OTP for a mobile number
 */
export function verifyStoredOTP(mobile: string, otp: string): boolean {
    const record = global.otpStore.get(mobile);

    if (!record) return false;

    if (Date.now() > record.expiresAt) {
        global.otpStore.delete(mobile);
        return false;
    }

    if (record.otp === otp) {
        global.otpStore.delete(mobile); // One-time use
        return true;
    }

    return false;
}


