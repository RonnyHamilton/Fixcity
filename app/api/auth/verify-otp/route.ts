import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';



/**
 * Verify OTP for prototype
 */
export async function POST(request: NextRequest) {
    try {
        const { aadhaar, mobile, otp } = await request.json();

        // Validate inputs
        if (!aadhaar || !mobile || !otp) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check for Master OTP first
        const masterOTP = process.env.MASTER_OTP;
        if (masterOTP && otp === masterOTP) {
            console.log('Master OTP used for authentication');
            // Skip regular OTP verification, proceed to authenticate
        } else {
            // Verify OTP - Local In-Memory Store
            const { verifyStoredOTP } = await import('@/lib/auth');
            const isValid = verifyStoredOTP(mobile, otp);

            if (!isValid) {
                return NextResponse.json(
                    { error: 'Invalid or expired OTP. Please try again.' },
                    { status: 401 }
                );
            }
        }

        // OTP verified successfully

        // Generate a deterministic session token based on Aadhaar
        // This ensures the user gets the same ID every time they log in
        const userId = `USR_${aadhaar}`;

        // Find user name from CSV
        let userName = 'Citizen';
        try {
            const csvPath = path.join(process.cwd(), 'aadhar.csv');
            const csvContent = await fs.readFile(csvPath, 'utf-8');
            const lines = csvContent.trim().split('\n');

            for (let i = 1; i < lines.length; i++) {
                const parts = lines[i].split(',').map(s => s.trim());
                // Handle optional name column (aadhaar, mobile, name)
                if (parts.length >= 2 && parts[0] === aadhaar) {
                    if (parts.length >= 3) {
                        userName = parts[2];
                    }
                    break;
                }
            }
        } catch (err) {
            console.error('Error reading user name from CSV:', err);
            // Fallback to Citizen if CSV read fails
        }

        return NextResponse.json({
            success: true,
            message: 'OTP verified successfully',
            userId,
            name: userName,
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
