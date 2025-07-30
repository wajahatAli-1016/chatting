import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";

// GET - Fetch all users excluding current user
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const currentUserId = searchParams.get('currentUserId');

        const searchCriteria = {};
        
        // Exclude current user from results
        if (currentUserId) {
            searchCriteria._id = { $ne: currentUserId };
        }

        const users = await User.find(searchCriteria, { 
            password: 0,
            __v: 0 
        }).sort({ username: 1 });

        return NextResponse.json({ users }, { status: 200 });
    } catch (error) {
        console.error("Error fetching users:", error);
        return NextResponse.json(
            { message: "Failed to fetch users", error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(req){
    try {
        const {username, mobile, password} = await req.json();
        
        console.log("Signup attempt:", { username, mobile, password: password ? "provided" : "missing" });
        
        if (!username || !mobile || !password) {
            return NextResponse.json(
                { message: "Username, mobile number, and password are required" },
                { status: 400 }
            );
        }

        await connectDB();
        
        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [
                { username: username },
                { mobile: parseInt(mobile) }
            ]
        });
        
        if (existingUser) {
            return NextResponse.json(
                { message: "User with this username or mobile number already exists" },
                { status: 409 }
            );
        }
        
        const user = await User.create({
            username, 
            mobile: parseInt(mobile), 
            password
        });
        
        console.log("User created successfully:", { id: user._id, username: user.username, mobile: user.mobile });
        
        return NextResponse.json({
            message: "User created successfully", 
            user: {
                id: user._id,
                username: user.username,
                mobile: user.mobile
            }
        }, {status: 201});
    } catch (error) {
        console.error("User creation error:", error);
        return NextResponse.json({
            message: "User creation failed", 
            error: error.message
        }, {status: 500});
    }
} 