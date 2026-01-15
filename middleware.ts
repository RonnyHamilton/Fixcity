import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

export function middleware(request: NextRequest) {
    // Only intercept API calls
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Stricter limits for write operations (POST/PATCH)
        const isWrite = ['POST', 'PATCH', 'DELETE'].includes(request.method);
        const limit = isWrite ? 10 : 60; // 10 writes/min, 60 reads/min per IP

        const result = rateLimit(ip, { windowMs: 60000, max: limit });

        if (!result.success) {
            return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'X-RateLimit-Limit': limit.toString(),
                    'X-RateLimit-Remaining': '0',
                },
            });
        }

        const response = NextResponse.next();
        response.headers.set('X-RateLimit-Limit', limit.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
        return response;
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/:path*'],
};
