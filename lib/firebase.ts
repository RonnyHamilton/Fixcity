// Firebase configuration for FixCity
// Phone Authentication for OTP verification

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
    return !!(
        firebaseConfig.apiKey &&
        firebaseConfig.authDomain &&
        firebaseConfig.projectId &&
        firebaseConfig.appId
    );
};

// Initialize Firebase app (singleton pattern)
const app = getApps().length === 0 && isFirebaseConfigured()
    ? initializeApp(firebaseConfig)
    : getApps()[0];

// Get Auth instance
export const auth = isFirebaseConfigured() && app ? getAuth(app) : null;

/**
 * Setup invisible reCAPTCHA verifier for phone auth
 * @param buttonId - ID of the button element to attach reCAPTCHA
 */
export const setupRecaptcha = (buttonId: string): RecaptchaVerifier | null => {
    if (!auth) {
        console.warn('Firebase Auth not configured');
        return null;
    }

    // Clear any existing verifier
    if (typeof window !== 'undefined' && (window as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier) {
        (window as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = undefined;
    }

    const recaptchaVerifier = new RecaptchaVerifier(auth, buttonId, {
        size: 'invisible',
        callback: () => {
            // reCAPTCHA solved
            console.log('reCAPTCHA verified');
        },
        'expired-callback': () => {
            // reCAPTCHA expired, reset it
            console.log('reCAPTCHA expired');
        }
    });

    // Store globally for reuse
    if (typeof window !== 'undefined') {
        (window as { recaptchaVerifier?: RecaptchaVerifier }).recaptchaVerifier = recaptchaVerifier;
    }

    return recaptchaVerifier;
};

/**
 * Send OTP to phone number using Firebase
 * @param phoneNumber - Phone number in E.164 format (+91XXXXXXXXXX)
 * @param recaptchaVerifier - RecaptchaVerifier instance
 */
export const sendFirebaseOTP = async (
    phoneNumber: string,
    recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
    if (!auth) {
        throw new Error('Firebase Auth not configured');
    }

    // Ensure phone number is in E.164 format
    let formattedNumber = phoneNumber.replace(/\s/g, '');
    if (!formattedNumber.startsWith('+')) {
        formattedNumber = '+91' + formattedNumber;
    }

    return signInWithPhoneNumber(auth, formattedNumber, recaptchaVerifier);
};

/**
 * Verify OTP code using Firebase ConfirmationResult
 * @param confirmationResult - ConfirmationResult from sendFirebaseOTP
 * @param code - 6-digit verification code
 */
export const verifyFirebaseOTP = async (
    confirmationResult: ConfirmationResult,
    code: string
) => {
    return confirmationResult.confirm(code);
};

// Export types for use in components
export type { RecaptchaVerifier, ConfirmationResult };
