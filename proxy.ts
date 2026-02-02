import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimit } from './lib/rate-limit';

export function proxy(request: NextRequest) {
    // Only intercept API calls
    if (request.nextUrl.pathname.startsWith('/api')) {
        const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';

        // Skip rate limiting for localhost during development
        if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            return NextResponse.next();
        }

        // More reasonable limits for write operations (POST/PATCH)
        const isWrite = ['POST', 'PATCH', 'DELETE'].includes(request.method);
        const limit = isWrite ? 30 : 100; // 30 writes/min, 100 reads/min per IP

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
