import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isValidPhoneNumber } from '@/lib/auth';

// Global OTP storage (in-memory for prototype)
// In production, use Redis or database
declare global {
    // eslint-disable-next-line no-var
    var otpStore: Map<string, { otp: string; expiresAt: number; aadhaar?: string }>;
}

if (!global.otpStore) {
    global.otpStore = new Map();
}

const otpStore = global.otpStore;

/**
 * Generate a random 6-digit OTP
 */
function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP - Validates Aadhaar+Mobile and generates OTP
 * For prototype: OTP is returned in response (shown on screen)
 */
export async function POST(request: NextRequest) {
    try {
        const { aadhaar, mobile, channel = 'sms' } = await request.json();

        // Validate inputs
        if (!aadhaar || aadhaar.length !== 12) {
            return NextResponse.json(
                { error: 'Invalid Aadhaar number. Must be 12 digits.' },
                { status: 400 }
            );
        }

        if (!mobile || !isValidPhoneNumber(mobile)) {
            return NextResponse.json(
                { error: 'Invalid mobile number. Must be 10 digits.' },
                { status: 400 }
            );
        }

        // Read Aadhaar CSV file
        const csvPath = path.join(process.cwd(), 'aadhar.csv');
        const csvContent = await fs.readFile(csvPath, 'utf-8');
        const lines = csvContent.trim().split('\n');

        // Parse CSV (skip header)
        let found = false;
        for (let i = 1; i < lines.length; i++) {
            const [csvAadhaar, csvMobile] = lines[i].split(',').map(s => s.trim());
            if (csvAadhaar === aadhaar && csvMobile === mobile) {
                found = true;
                break;
            }
        }

        if (!found) {
            return NextResponse.json(
                { error: 'Aadhaar and mobile number do not match our records.' },
                { status: 401 }
            );
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes (timestamp)

        // Store OTP
        otpStore.set(mobile, { otp, expiresAt, aadhaar });

        // Send OTP via SMS using Twilio
        let smsSuccess = false;
        try {
            const { sendWhatsAppOTP } = await import('@/lib/whatsapp');
            const smsResult = await sendWhatsAppOTP(`91${mobile}`, otp);
            smsSuccess = smsResult.success;

            if (!smsSuccess) {
                console.warn('SMS OTP send failed:', smsResult.message);
                console.log('📱 Use MASTER_OTP from .env.local to login');
            }
        } catch (smsError) {
            console.error('SMS sending error:', smsError);
        }

        // Always return success (allow user to proceed with master OTP)
        return NextResponse.json({
            success: true,
            message: smsSuccess
                ? 'OTP sent successfully to your mobile number'
                : 'SMS unavailable - use master OTP to proceed',
            expiresIn: 300, // 5 minutes in seconds
            smsDelivered: smsSuccess
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Export OTP store for verify route
export { otpStore };
