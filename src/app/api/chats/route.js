import connectDB from "@/lib/db";
import Chat from "@/models/Chat";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Fetch all chats for a user
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { message: "User ID is required" },
                { status: 400 }
            );
        }

        const chats = await Chat.find({
            participants: userId
        })
        .populate('participants', 'username mobile')
        .sort({ lastMessageTime: -1 });

        return NextResponse.json({ chats }, { status: 200 });
    } catch (error) {
        console.error("Error fetching chats:", error);
        return NextResponse.json(
            { message: "Failed to fetch chats", error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new chat or get existing chat between two users
export async function POST(request) {
    try {
        await connectDB();
        const { userId, otherUserId } = await request.json();

        if (!userId || !otherUserId) {
            return NextResponse.json(
                { message: "Both user IDs are required" },
                { status: 400 }
            );
        }

        // Sort participants to ensure consistent order
        const sortedParticipants = [userId, otherUserId].sort();

        // Check if chat already exists between these users (using sorted participants)
        let existingChat = await Chat.findOne({
            participants: { $all: sortedParticipants, $size: 2 }
        }).populate('participants', 'username mobile');

        if (existingChat) {
            return NextResponse.json({ 
                chat: existingChat,
                isNew: false 
            }, { status: 200 });
        }

        // Create new chat with sorted participants
        const newChat = await Chat.create({
            participants: sortedParticipants,
            messages: []
        });

        const populatedChat = await Chat.findById(newChat._id)
            .populate('participants', 'username mobile');

        return NextResponse.json({ 
            chat: populatedChat,
            isNew: true 
        }, { status: 201 });
    } catch (error) {
        console.error("Error creating/finding chat:", error);
        return NextResponse.json(
            { message: "Failed to create/find chat", error: error.message },
            { status: 500 }
        );
    }
} 