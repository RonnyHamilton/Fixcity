'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/types/chat';
import { Send, Bot, User, ArrowLeft, MessageCircle } from 'lucide-react';

const QUICK_SUGGESTIONS = [
    { text: 'How do I close a task?' },
    { text: 'Proof photo guidelines' },
    { text: 'Request materials' },
    { text: 'Safety guidelines' },
];

export default function TechnicianChatPage() {
    const router = useRouter();
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            sender: 'bot',
            text: `Hello Technician! Welcome to FixCity Chat. I can help you with task completion, proof uploads, material requests, and safety protocols. What do you need?`,
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
                body: JSON.stringify({ role: 'Technician', message: textToSend }),
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
        <div className="min-h-screen bg-slate-50 text-slate-900">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.push('/technician/dashboard')}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-900"
                            aria-label="Back to technician dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900">FixCity Chat</h1>
                                <p className="text-xs text-slate-500">Technician Assistant</p>
                            </div>
                        </div>
                    </div>
                    <div className="px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-lg text-xs text-orange-600 font-medium">
                        🔧 Technician
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
                                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${msg.sender === 'bot' ? 'bg-orange-100 text-orange-600' : 'bg-slate-200 text-slate-600'
                                    }`}
                            >
                                {msg.sender === 'bot' ? (
                                    <Bot className="w-5 h-5" />
                                ) : (
                                    <User className="w-5 h-5" />
                                )}
                            </div>

                            <div
                                className={`max-w-[70%] px-4 py-3 rounded-2xl shadow-sm ${msg.sender === 'bot'
                                    ? 'bg-white border border-slate-200 text-slate-800'
                                    : 'bg-orange-500 text-white'
                                    }`}
                            >
                                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                <p className={`text-xs mt-1 ${msg.sender === 'bot' ? 'text-slate-400' : 'text-white/70'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-orange-100 text-orange-600">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl shadow-sm">
                                <p className="text-sm text-slate-500">Typing...</p>
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
                            className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-600 hover:text-slate-900 transition-all disabled:opacity-50 shadow-sm"
                        >
                            {suggestion.text}
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Input Area */}
                <div className="bg-white border border-slate-200 rounded-xl p-2 flex items-end gap-2 shadow-sm">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask about completing tasks, uploading proof..."
                        className="flex-1 bg-transparent px-3 py-2 text-slate-900 placeholder-slate-400 resize-none focus:outline-none max-h-32"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        onClick={() => handleSubmit()}
                        disabled={!input.trim() || isLoading}
                        className="bg-orange-500 hover:bg-orange-600 text-white p-3 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 shadow-sm"
                        aria-label="Send message"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-center text-xs text-slate-400 mt-2">
                    Verify important information with your supervisor if needed.
                </p>
            </div>
        </div>
    );
}
