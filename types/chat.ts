export type ChatRole = 'Public' | 'Officer' | 'Technician';

export interface ChatMessage {
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

export interface ChatRequest {
    role: ChatRole;
    message: string;
}

export interface ChatResponse {
    reply: string;
}
