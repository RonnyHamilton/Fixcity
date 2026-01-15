type RateLimitConfig = {
    windowMs: number;
    max: number;
};

const trackers = new Map<string, { count: number; expiresAt: number }>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of trackers.entries()) {
        if (value.expiresAt < now) {
            trackers.delete(key);
        }
    }
}, 5 * 60 * 1000);

export function rateLimit(ip: string, config: RateLimitConfig = { windowMs: 60000, max: 20 }) {
    const now = Date.now();
    const record = trackers.get(ip);

    if (!record || record.expiresAt < now) {
        trackers.set(ip, {
            count: 1,
            expiresAt: now + config.windowMs,
        });
        return { success: true, remaining: config.max - 1 };
    }

    if (record.count >= config.max) {
        return { success: false, remaining: 0 };
    }

    record.count += 1;
    return { success: true, remaining: config.max - record.count };
}
