/**
 * Twilio WhatsApp Integration for FixCity
 * Handles sending OTPs and status updates via WhatsApp
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const smsFrom = process.env.TWILIO_SMS_FROM || '';

let twilioClient: any = null;

// Lazy-load Twilio client
function getTwilioClient() {
    if (!twilioClient && accountSid && authToken) {
        const twilio = require('twilio');
        twilioClient = twilio(accountSid, authToken);
    }
    return twilioClient;
}

interface SendOTPResponse {
    success: boolean;
    message: string;
    sid?: string;
}

interface SendStatusUpdateResponse {
    success: boolean;
    message: string;
    sid?: string;
}

/**
 * Send OTP via SMS using Twilio
 * @param mobile Mobile number with country code (e.g., "919876543210")
 * @param otp The OTP code to send
 */
export async function sendWhatsAppOTP(mobile: string, otp: string): Promise<SendOTPResponse> {
    if (!accountSid || !authToken) {
        console.error('Twilio credentials not configured.');
        return {
            success: false,
            message: 'SMS Service Not Configured',
        };
    }

    try {
        const client = getTwilioClient();
        if (!client) {
            throw new Error('Failed to initialize Twilio client');
        }

        // Format mobile number for SMS (with country code)
        const formattedMobile = mobile.startsWith('+') ? mobile : `+${mobile}`;

        // Use the Twilio SMS sending pattern
        const message = await client.messages.create({
            body: `Your FixCity verification code is: ${otp}\n\nThis code will expire in 5 minutes.\n\nDo not share this code with anyone.`,
            from: smsFrom, // Your Twilio phone number
            to: formattedMobile
        });

        console.log('SMS OTP sent successfully. SID:', message.sid);

        return {
            success: true,
            message: 'OTP sent successfully via SMS',
            sid: message.sid,
        };
    } catch (error: any) {
        console.error('SMS OTP send error:', error.message || error);
        return {
            success: false,
            message: error.message || 'Failed to send SMS OTP',
        };
    }
}

/**
 * Send status update via SMS
 * @param mobile Mobile number with country code
 * @param reportId Report ID
 * @param status New status of the report
 * @param category Category of the issue
 */
export async function sendWhatsAppStatusUpdate(
    mobile: string,
    reportId: string,
    status: string,
    category: string
): Promise<SendStatusUpdateResponse> {
    if (!accountSid || !authToken) {
        console.error('Twilio credentials not configured.');
        return {
            success: false,
            message: 'SMS Service Not Configured',
        };
    }

    try {
        const client = getTwilioClient();
        if (!client) {
            throw new Error('Failed to initialize Twilio client');
        }

        // Format mobile number for SMS
        const formattedMobile = mobile.startsWith('+') ? mobile : `+${mobile}`;

        // Status message mapping
        const statusMessages: Record<string, string> = {
            pending: 'Your report has been received and is pending review.',
            in_progress: 'Good news! A technician has been assigned and is working on your report.',
            resolved: 'Your report has been resolved! Thank you for helping improve our city.',
            rejected: 'Your report has been reviewed and rejected. Please contact support for details.',
        };

        const statusMessage = statusMessages[status] || 'Your report status has been updated.';

        const message = await client.messages.create({
            body: `FixCity Update\n\nReport ID: ${reportId}\nCategory: ${category.replace(/_/g, ' ').toUpperCase()}\n\n${statusMessage}\n\nTrack your report at: https://fixcity.app/track/${reportId}`,
            from: smsFrom,
            to: formattedMobile
        });

        console.log('SMS status update sent successfully:', message.sid);

        return {
            success: true,
            message: 'Status update sent successfully via SMS',
            sid: message.sid,
        };
    } catch (error: any) {
        console.error('SMS status update error:', error);
        return {
            success: false,
            message: error.message || 'Failed to send SMS status update',
        };
    }
}
