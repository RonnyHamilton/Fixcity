/**
 * Simple helper to get current user ID from localStorage
 */
export function getCurrentUserId(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fixcity_user_id');
}

/**
 * Get current user name from localStorage
 */
export function getCurrentUserName(): string {
    if (typeof window === 'undefined') return 'User';
    return localStorage.getItem('fixcity_user_name') || 'User';
}

/**
 * Get current user email from localStorage
 */
export function getCurrentUserEmail(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fixcity_user_email');
}

/**
 * Check if user is logged in
 */
export function isLoggedIn(): boolean {
    return !!getCurrentUserId();
}

/**
 * Log out user
 */
export function logOut() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('fixcity_user_id');
        localStorage.removeItem('fixcity_user_name');
        localStorage.removeItem('fixcity_user_email');
    }
}

/**
 * Get user ID for reports (logged in user ID or 'anonymous')
 */
export function getReportUserId(): string {
    return getCurrentUserId() || 'anonymous';
}

/**
 * Get user name for reports (logged in name or 'Anonymous')
 */
export function getReportUserName(): string {
    const name = getCurrentUserName();
    return name !== 'User' ? name : 'Anonymous';
}
