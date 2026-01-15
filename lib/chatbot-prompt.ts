import { ChatRole } from '@/types/chat';

/**
 * Builds a role-specific prompt for the AI chatbot
 */
export function buildChatPrompt(role: ChatRole, userMessage: string): string {
    const systemPrompt = `Act as "CivicAssist", a helpful support assistant for the FixCity platform.
    
Current User Role: ${role}

Context:
- Public: Can report issues (potholes, garbage, etc.) with photos/location and track status.
- Officer: Verifies complaints, assigns technicians, and manages priority.
- Technician: Receives tasks, fixes issues, and uploads before/after proof.

Instructions:
1. Provide a helpful, short answer (max 3 sentences).
2. Give 1-3 bullet points for next steps.
3. Keep tone professional and encouraging.
4. Only answer questions about civic issues or the platform.

User Question: ${userMessage}`;

    return systemPrompt;
}

/**
 * Validates and sanitizes user input
 */
export function validateChatInput(message: string): { valid: boolean; error?: string } {
    if (!message || message.trim().length === 0) {
        return { valid: false, error: 'Message cannot be empty' };
    }

    if (message.length > 500) {
        return { valid: false, error: 'Message too long (max 500 characters)' };
    }

    // Check for potential injection attempts
    const suspiciousPatterns = /<script|javascript:|onerror=|onclick=/i;
    if (suspiciousPatterns.test(message)) {
        return { valid: false, error: 'Invalid input detected' };
    }

    return { valid: true };
}
