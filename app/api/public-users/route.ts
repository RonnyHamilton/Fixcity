import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
    try {
        const { name, email } = await request.json();

        // Validate inputs
        if (!name || !email || name.trim().length < 2 || !email.includes('@')) {
            return NextResponse.json(
                { error: 'Invalid name or email' },
                { status: 400 }
            );
        }

        const trimmedName = name.trim();
        const trimmedEmail = email.trim().toLowerCase();

        // Check if user already exists
        const { data: existingUser, error: fetchError } = await supabase
            .from('public_users')
            .select('*')
            .eq('email', trimmedEmail)
            .single();

        if (existingUser) {
            // User exists, return their data
            return NextResponse.json({
                user: existingUser,
                message: 'Welcome back!'
            });
        }

        // Create new user
        const { data: newUser, error: insertError } = await supabase
            .from('public_users')
            .insert([
                {
                    name: trimmedName,
                    email: trimmedEmail
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error('Error creating user:', insertError);
            return NextResponse.json(
                { error: 'Failed to create user' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            user: newUser,
            message: 'User created successfully!'
        });

    } catch (error: any) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
}
