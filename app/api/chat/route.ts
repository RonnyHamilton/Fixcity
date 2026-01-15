import { NextResponse } from "next/server";
import { getRuleBasedResponse } from "@/lib/chatbot-fallback";
import { ChatRole } from "@/types/chat";

/**
 * FixCity Chat API
 * Provides instant help for Public, Officer, and Technician users
 */
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const message = body.message || "";
        const role: ChatRole = body.role || "Public";

        // Validate input
        if (!message.trim()) {
            return NextResponse.json({
                reply: "Please type your question and I'll help you!",
                source: "chat"
            });
        }

        console.log(`[Chat] ${role}: "${message}"`);

        // Get response from enhanced rule-based system
        const reply = getRuleBasedResponse(role, message);

        return NextResponse.json({
            reply,
            source: "chat"
        });

    } catch (error) {
        console.error("[Chat] Error:", error);

        return NextResponse.json({
            reply: "Sorry, something went wrong. Please try again or contact support at 1800-FIX-CITY.",
            source: "chat"
        }, { status: 500 });
    }
}
