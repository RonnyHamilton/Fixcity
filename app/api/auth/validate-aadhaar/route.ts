import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { isValidPhoneNumber } from '@/lib/auth';

/**
 * Validate Aadhaar + Mobile against CSV records
 * This endpoint is called before Firebase sends OTP
 */
export async function POST(request: NextRequest) {
    try {
        const { aadhaar, mobile } = await request.json();

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

        // Validation successful - Generate local OTP
        const { generateAndStoreOTP } = await import('@/lib/auth');
        const generatedOtp = generateAndStoreOTP(mobile);

        return NextResponse.json({
            success: true,
            message: 'OTP generated. Please check your screen.',
            otp: generatedOtp, // Sending OTP back to client for demo display
        });
    } catch (error) {
        console.error('Validate Aadhaar error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
