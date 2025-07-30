import connectDB from "@/lib/db";
import User from "@/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function POST(req) {
    try {
        const { mobile, password } = await req.json();
        
        console.log("Login attempt:", { mobile, password: password ? "provided" : "missing" });
        
        if (!mobile || !password) {
            return NextResponse.json(
                { message: "Mobile number and password are required" },
                { status: 400 }
            );
        }

        await connectDB();
        
        // Try to find user by mobile number (handle both string and number)
        let user = await User.findOne({ mobile: parseInt(mobile) });
        
        // If not found, try with string mobile
        if (!user) {
            user = await User.findOne({ mobile: mobile });
        }
        
        console.log("User found:", user ? "Yes" : "No");
        
        if (!user) {
            return NextResponse.json(
                { message: "Invalid mobile number or password" },
                { status: 401 }
            );
        }

        console.log("User password in DB:", user.password ? "exists" : "missing");
        console.log("Password length:", user.password?.length);

        let isPasswordValid = false;

        // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
        if (user.password.startsWith('$2')) {
            // Password is hashed, use bcrypt compare
            isPasswordValid = await bcrypt.compare(password, user.password);
            console.log("Using bcrypt comparison for hashed password");
        } else {
            // Password is plain text, compare directly
            isPasswordValid = user.password === password;
            console.log("Using direct comparison for plain text password");
            
            // If login is successful, hash the password for future use
            if (isPasswordValid) {
                try {
                    const salt = await bcrypt.genSalt(10);
                    const hashedPassword = await bcrypt.hash(password, salt);
                    user.password = hashedPassword;
                    await user.save();
                    console.log("Password hashed and saved for future logins");
                } catch (hashError) {
                    console.error("Error hashing password:", hashError);
                    // Continue with login even if hashing fails
                }
            }
        }
        
        console.log("Password comparison result:", isPasswordValid);
        
        if (!isPasswordValid) {
            return NextResponse.json(
                { message: "Invalid mobile number or password" },
                { status: 401 }
            );
        }

        // Return user data (excluding password)
        const userData = {
            id: user._id,
            username: user.username,
            mobile: user.mobile
        };

        return NextResponse.json({
            message: "Login successful",
            user: userData
        }, { status: 200 });

    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { message: "Login failed", error: error.message },
            { status: 500 }
        );
    }
} 