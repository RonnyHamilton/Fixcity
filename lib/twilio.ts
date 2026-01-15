import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Create Twilio client (only on server-side)
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Generate a random 4-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * Send OTP via Twilio SMS
 */
export async function sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; message: string; sid?: string }> {
    if (!client || !twilioPhoneNumber) {
        console.warn('Twilio not configured. OTP:', otp);
        return {
            success: true,
            message: 'SMS service not configured. OTP for testing: ' + otp,
        };
    }

    try {
        // Format phone number for India (add +91 if not present)
        let formattedNumber = phoneNumber.replace(/\s/g, '');
        if (!formattedNumber.startsWith('+')) {
            formattedNumber = '+91' + formattedNumber;
        }

        const message = await client.messages.create({
            body: `Your FixCity verification code is: ${otp}. This code expires in 5 minutes. Do not share this code with anyone.`,
            from: twilioPhoneNumber,
            to: formattedNumber,
        });

        return {
            success: true,
            message: 'OTP sent successfully',
            sid: message.sid,
        };
    } catch (error) {
        console.error('Twilio error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Failed to send OTP',
        };
    }
}

/**
 * Verify phone number format
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
    // Remove spaces and check for 10 digit Indian mobile number
    const cleaned = phoneNumber.replace(/\s/g, '');
    return /^[6-9]\d{9}$/.test(cleaned);
}
