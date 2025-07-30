"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ChatPage() {
    const router = useRouter();

    useEffect(() => {
        // Redirect to dashboard since chat functionality is now integrated there
        router.replace('/dashboard');
    }, [router]);

    return (
        <div className="h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-gray-600">Redirecting to dashboard...</div>
        </div>
    );
} 