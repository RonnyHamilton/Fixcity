/**
 * MSG91 OTP Integration for FixCity
 * Documentation: https://docs.msg91.com/collection/msg91-api-integration/5/send-otp-message/TZ6HN0YI
 */

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID || '';
/* const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'FIXCTY'; */ // Unused variable commented out or removed

interface SendOTPResponse {
    success: boolean;
    message: string;
    request_id?: string;
}

interface VerifyOTPResponse {
    success: boolean;
    message: string;
    type?: string;
}

/**
 * Send OTP via MSG91
 * @param mobile Mobile number with country code (e.g., "919876543210")
 * @param otp Optional custom OTP (MSG91 generates one if not provided)
 */
export async function sendOTP(mobile: string, otp?: string): Promise<SendOTPResponse> {
    if (!MSG91_AUTH_KEY) {
        console.error('MSG91_AUTH_KEY not configured.');
        return {
            success: false,
            message: 'SMS Service Not Configured',
        };
    }

    try {
        // Format mobile number - ensure it has country code
        const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

        const url = new URL('https://control.msg91.com/api/v5/otp');
        url.searchParams.append('template_id', MSG91_TEMPLATE_ID);
        url.searchParams.append('mobile', formattedMobile);
        url.searchParams.append('authkey', MSG91_AUTH_KEY);

        if (otp) {
            url.searchParams.append('otp', otp);
        }

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.type === 'success' || response.ok) {
            return {
                success: true,
                message: 'OTP sent successfully',
                request_id: data.request_id,
            };
        } else {
            console.error('MSG91 send error:', data);
            return {
                success: false,
                message: data.message || 'Failed to send OTP',
            };
        }
    } catch (error) {
        console.error('MSG91 send error:', error);
        return {
            success: false,
            message: 'Network error while sending OTP',
        };
    }
}

/**
 * Verify OTP via MSG91
 * @param mobile Mobile number with country code
 * @param otp OTP entered by user
 */
export async function verifyOTP(mobile: string, otp: string): Promise<VerifyOTPResponse> {
    if (!MSG91_AUTH_KEY) {
        return {
            success: false,
            message: 'SMS Service Not Configured',
        };
    }

    try {
        const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

        const url = new URL('https://control.msg91.com/api/v5/otp/verify');
        url.searchParams.append('mobile', formattedMobile);
        url.searchParams.append('otp', otp);
        url.searchParams.append('authkey', MSG91_AUTH_KEY);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.type === 'success') {
            return {
                success: true,
                message: 'OTP verified successfully',
                type: 'success',
            };
        } else {
            return {
                success: false,
                message: data.message || 'OTP verification failed',
                type: data.type,
            };
        }
    } catch (error) {
        console.error('MSG91 verify error:', error);
        return {
            success: false,
            message: 'Network error while verifying OTP',
        };
    }
}

/**
 * Resend OTP via MSG91
 * @param mobile Mobile number with country code
 * @param retryType 'text' or 'voice'
 */
export async function resendOTP(mobile: string, retryType: 'text' | 'voice' = 'text'): Promise<SendOTPResponse> {
    if (!MSG91_AUTH_KEY) {
        return {
            success: false,
            message: 'SMS Service Not Configured',
        };
    }

    try {
        const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

        const url = new URL('https://control.msg91.com/api/v5/otp/retry');
        url.searchParams.append('mobile', formattedMobile);
        url.searchParams.append('authkey', MSG91_AUTH_KEY);
        url.searchParams.append('retrytype', retryType);

        const response = await fetch(url.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        const data = await response.json();

        if (data.type === 'success' || response.ok) {
            return {
                success: true,
                message: `OTP resent via ${retryType}`,
                request_id: data.request_id,
            };
        } else {
            return {
                success: false,
                message: data.message || 'Failed to resend OTP',
            };
        }
    } catch (error) {
        console.error('MSG91 resend error:', error);
        return {
            success: false,
            message: 'Network error while resending OTP',
        };
    }
}
