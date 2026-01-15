'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types/chat';
import { Send, Bot, User, ArrowLeft, MessageCircle } from 'lucide-react';

const QUICK_SUGGESTIONS = [
    { text: 'How do I report a pothole?' },
    { text: 'Track my complaint status' },
    { text: 'What documents do I need?' },
    { text: 'Garbage not collected' },
];

export default function PublicChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: 'bot',
            text: `Hello! Welcome to FixCity Chat. I can help you report problems, track complaints, and answer questions. What do you need help with?`,
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSubmit = async (messageText?: string) => {
        const textToSend = messageText || input.trim();
        if (!textToSend || isLoading) return;

        const userMessage: ChatMessage = {
            sender: 'user',
            text: textToSend,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'Public', message: textToSend }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get response');
            }

            const data = await response.json();
            const botMessage: ChatMessage = {
                sender: 'bot',
                text: data.reply,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An error occurred';
            setError(errorMessage);

            const botMessage: ChatMessage = {
                sender: 'bot',
                text: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, botMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="min-h-screen bg-[#101922] text-white">
            {/* Header */}
            <header className="border-b border-white/10 bg-[#0d1419] sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/')}
                            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                            aria-label="Back to home"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-primary p-2 rounded-lg">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold">FixCity Chat</h1>
                                <p className="text-xs text-gray-400">Public Assistant</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-lg text-xs text-primary">
                        🙋 Public
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 80px)' }}>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                    {messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                        >
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-primary' : 'bg-white/10'
                                    }`}
                            >
                                {msg.sender === 'bot' ? (
                                    <Bot className="w-5 h-5" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>

                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-2xl ${msg.sender === 'bot'
                                    ? 'bg-white/5 border border-white/10'
                                    : 'bg-primary text-white'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <p className="text-xs opacity-50 mt-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-primary">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
                                <p className="text-sm text-gray-400">Typing...</p>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                <div className="mb-3 flex flex-wrap gap-2">
                    {QUICK_SUGGESTIONS.map((suggestion, index) => (
                        <button
                            key={index}
                            onClick={() => handleSubmit(suggestion.text)}
                            disabled={isLoading}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-300 hover:text-white transition-all disabled:opacity-50"
                        >
                            {suggestion.text}
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                {/* Input Area */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-2 flex items-end gap-2">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about reporting issues, tracking complaints..."
                        className="flex-1 bg-transparent px-3 py-2 text-white placeholder-gray-500 resize-none focus:outline-none max-h-32"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isLoading}
                        className="bg-primary hover:bg-primary-hover text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        aria-label="Send message"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-center text-xs text-gray-500 mt-2">
                    Verify important information with officials if needed.
                </p>
            </div>
        </div>
    );
}
