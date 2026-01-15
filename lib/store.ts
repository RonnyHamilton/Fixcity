import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'public' | 'officer' | 'technician' | null;

interface User {
    id: string;
    name: string;
    role: UserRole;
    aadhaar?: string;
    badgeId?: string;
    area?: string;
    specialization?: string;
    phone?: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    role: UserRole;
    language: 'en' | 'hi' | 'ta' | 'te';
    login: (user: User) => void;
    logout: () => void;
    updateUser: (updates: Partial<User>) => void;
    setLanguage: (lang: 'en' | 'hi' | 'ta' | 'te') => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            role: null,
            language: 'en',
            login: (user) => set({ user, isAuthenticated: true, role: user.role }),
            logout: () => set({ user: null, isAuthenticated: false, role: null }),
            updateUser: (updates) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...updates } : null,
                })),
            setLanguage: (lang) => set({ language: lang }),
        }),
        {
            name: 'fixcity-auth',
        }
    )
);

// OTP Store for managing OTP state during login
interface OTPState {
    aadhaar: string;
    mobile: string;
    otp: string;
    expiresAt: Date | null;
    isVerified: boolean;
    setAadhaar: (aadhaar: string) => void;
    setMobile: (mobile: string) => void;
    setOTP: (otp: string, expiresAt: Date) => void;
    verifyOTP: (inputOtp: string) => boolean;
    reset: () => void;
}

export const useOTPStore = create<OTPState>((set, get) => ({
    aadhaar: '',
    mobile: '',
    otp: '',
    expiresAt: null,
    isVerified: false,
    setAadhaar: (aadhaar) => set({ aadhaar }),
    setMobile: (mobile) => set({ mobile }),
    setOTP: (otp, expiresAt) => set({ otp, expiresAt, isVerified: false }),
    verifyOTP: (inputOtp) => {
        const state = get();
        const now = new Date();
        if (state.expiresAt && now < state.expiresAt && state.otp === inputOtp) {
            set({ isVerified: true });
            return true;
        }
        return false;
    },
    reset: () =>
        set({
            aadhaar: '',
            mobile: '',
            otp: '',
            expiresAt: null,
            isVerified: false,
        }),
}));

// Reports Store for managing report state
interface ReportsState {
    reports: Report[];
    loading: boolean;
    setReports: (reports: Report[]) => void;
    addReport: (report: Report) => void;
    updateReport: (id: string, updates: Partial<Report>) => void;
    setLoading: (loading: boolean) => void;
}

interface Report {
    id: string;
    userId: string;
    category: string;
    description: string;
    imageUrl?: string;
    latitude: number;
    longitude: number;
    address: string;
    status: 'pending' | 'in_progress' | 'resolved' | 'rejected';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    assignedTechnicianId?: string;
    createdAt: string;
    updatedAt: string;
}

export const useReportsStore = create<ReportsState>((set) => ({
    reports: [],
    loading: false,
    setReports: (reports) => set({ reports }),
    addReport: (report) =>
        set((state) => ({ reports: [report, ...state.reports] })),
    updateReport: (id, updates) =>
        set((state) => ({
            reports: state.reports.map((r) =>
                r.id === id ? { ...r, ...updates } : r
            ),
        })),
    setLoading: (loading) => set({ loading }),
}));

// Notification Store
export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    read: boolean;
    timestamp: Date;
    link?: string;
}

interface NotificationState {
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
    markAsRead: (id: string) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
    persist(
        (set) => ({
            notifications: [],
            addNotification: (notification) =>
                set((state) => ({
                    notifications: [
                        {
                            ...notification,
                            id: Math.random().toString(36).substring(7),
                            timestamp: new Date(),
                            read: false,
                        },
                        ...state.notifications,
                    ],
                })),
            markAsRead: (id) =>
                set((state) => ({
                    notifications: state.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                })),
            markAllAsRead: () =>
                set((state) => ({
                    notifications: state.notifications.map((n) => ({ ...n, read: true })),
                })),
            clearNotifications: () => set({ notifications: [] }),
        }),
        {
            name: 'fixcity-notifications',
        }
    )
);
