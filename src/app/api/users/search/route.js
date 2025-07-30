import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('q');
        const currentUserId = searchParams.get('currentUserId');

        if (!query) {
            return NextResponse.json(
                { message: "Search query is required" },
                { status: 400 }
            );
        }

        // Build search criteria
        const searchCriteria = {
            $or: [
                { username: { $regex: query, $options: 'i' } }
            ]
        };

        // Only search mobile field if query is numeric
        if (/^\d+$/.test(query)) {
            searchCriteria.$or.push({ mobile: parseInt(query) });
        }

        // Exclude current user from search results
        if (currentUserId) {
            searchCriteria._id = { $ne: currentUserId };
        }

        const users = await User.find(searchCriteria, { 
            password: 0,
            __v: 0 
        }).limit(10);

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error("Error searching users:", error);
        return NextResponse.json(
            { message: "Failed to search users", error: error.message },
            { status: 500 }
        );
    }
} 