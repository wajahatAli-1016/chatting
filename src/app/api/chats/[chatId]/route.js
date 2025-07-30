import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { NextResponse } from "next/server";

// GET - Fetch a specific chat with all messages
export async function GET(req, context) {
    try {
        const { chatId } = await context.params;
        
        if (!chatId) {
            return NextResponse.json(
                { message: "Chat ID is required" },
                { status: 400 }
            );
        }

        await connectDB();

        const chat = await Chat.findById(chatId)
            .populate('participants', 'username mobile')
            .populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'username mobile'
                },
                options: { sort: { timestamp: 1 } }
            });

        if (!chat) {
            return NextResponse.json(
                { message: "Chat not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({ chat }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chat:", error);
        return NextResponse.json(
            { message: "Failed to fetch chat", error: error.message },
            { status: 500 }
        );
    }
} 