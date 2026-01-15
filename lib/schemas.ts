import { z } from 'zod';

// Login Schema (Aadhaar or Phone)
export const LoginSchema = z.object({
    aadhaar: z.string()
        .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits")
        .optional(),
    phone: z.string()
        .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
        .optional()
}).refine(data => data.aadhaar || data.phone, {
    message: "Either Aadhaar or Phone number is required"
});

// Report Submission Schema
export const ReportSchema = z.object({
    user_id: z.string().min(1, "User ID is required"),
    user_name: z.string().min(2, "Name must be at least 2 characters").max(100),
    user_phone: z.string().optional(),
    category: z.enum([
        'pothole', 'streetlight', 'sanitation', 'graffiti',
        'street_dogs', 'e_waste', 'other',
        // Legacy/Fallback for compatibility if needed (optional)
        'street_light', 'garbage', 'water', 'electricity'
    ]),
    description: z.string()
        .min(10, "Description must be at least 10 characters")
        .max(1000, "Description is too long")
        .refine(val => !/[<>]/g.test(val), "HTML tags are not allowed"), // Basic storage XSS prevention
    location: z.string().max(200, "Address is too long"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    image_url: z.string().url("Invalid Image URL").optional().or(z.literal('')),
});

// Chat Message Schema
export const ChatSchema = z.object({
    message: z.string()
        .min(1, "Message cannot be empty")
        .max(500, "Message too long")
        .trim(),
    role: z.enum(['public', 'officer', 'technician']).default('public'),
});

// Technician Assignment Schema
export const AssignSchema = z.object({
    assigned_technician_id: z.string().min(1),
    assigned_officer_id: z.string().min(1),
    status: z.literal('in_progress')
});

// Resolution Schema
export const ResolveSchema = z.object({
    status: z.literal('resolved'),
    resolution_notes: z.string().min(5).max(1000),
    assigned_technician_id: z.string().min(1)
});
