import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import Message from "@/models/Message";
import { NextResponse } from "next/server";

// POST - Send a message to a chat
export async function POST(request, { params }) {
    try {
        await connectDB();
        const { chatId } = await params;
        const { content, senderId } = await request.json();

        if (!content || !senderId) {
            return NextResponse.json(
                { message: "Content and sender ID are required" },
                { status: 400 }
            );
        }

        // Check if chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return NextResponse.json(
                { message: "Chat not found" },
                { status: 404 }
            );
        }

        // Create new message
        const newMessage = await Message.create({
            content,
            sender: senderId,
            chat: chatId
        });

        // Update chat with new message and last message info
        await Chat.findByIdAndUpdate(chatId, {
            $push: { messages: newMessage._id },
            lastMessage: content,
            lastMessageTime: new Date()
        });

        // Populate the message with sender info
        const populatedMessage = await Message.findById(newMessage._id)
            .populate('sender', 'username mobile');

        return NextResponse.json({ 
            message: populatedMessage 
        }, { status: 201 });
    } catch (error) {
        console.error("Error sending message:", error);
        return NextResponse.json(
            { message: "Failed to send message", error: error.message },
            { status: 500 }
        );
    }
} 