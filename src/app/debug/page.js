"use client"

import { useState } from "react";

export default function DebugPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [testLogin, setTestLogin] = useState({ mobile: "", password: "" });
    const [loginResult, setLoginResult] = useState("");

    const fetchUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/users");
            const data = await response.json();
            if (response.ok) {
                setUsers(data.users);
            } else {
                setError(data.message || "Failed to fetch users");
            }
        } catch (error) {
            setError("Error fetching users: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const testLoginFunction = async () => {
        setLoginResult("");
        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testLogin),
            });

            const data = await response.json();
            setLoginResult({
                status: response.status,
                success: response.ok,
                message: data.message,
                data: data
            });
        } catch (error) {
            setLoginResult({
                status: "Error",
                success: false,
                message: error.message,
                data: null
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Debug Page</h1>
                
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Database Users</h2>
                    <button
                        onClick={fetchUsers}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition duration-200 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "Fetch Users"}
                    </button>
                    
                    {error && (
                        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {error}
                        </div>
                    )}
                    
                    {users.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Users in Database:</h3>
                            <div className="space-y-2">
                                {users.map((user, index) => (
                                    <div key={index} className="bg-gray-50 p-3 rounded-lg">
                                        <p><strong>ID:</strong> {user._id}</p>
                                        <p><strong>Username:</strong> {user.username}</p>
                                        <p><strong>Mobile:</strong> {user.mobile}</p>
                                        <p><strong>Created:</strong> {new Date(user.createdAt).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Login</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Mobile Number
                            </label>
                            <input
                                type="tel"
                                value={testLogin.mobile}
                                onChange={(e) => setTestLogin(prev => ({ ...prev, mobile: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter mobile number"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Password
                            </label>
                            <input
                                type="password"
                                value={testLogin.password}
                                onChange={(e) => setTestLogin(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter password"
                            />
                        </div>
                        <button
                            onClick={testLoginFunction}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition duration-200"
                        >
                            Test Login
                        </button>
                    </div>
                    
                    {loginResult && (
                        <div className={`mt-4 p-4 rounded-lg ${
                            loginResult.success 
                                ? 'bg-green-50 border border-green-200 text-green-700' 
                                : 'bg-red-50 border border-red-200 text-red-700'
                        }`}>
                            <p><strong>Status:</strong> {loginResult.status}</p>
                            <p><strong>Message:</strong> {loginResult.message}</p>
                            {loginResult.data && (
                                <details className="mt-2">
                                    <summary className="cursor-pointer font-medium">Response Data</summary>
                                    <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                                        {JSON.stringify(loginResult.data, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Authentication Test</h2>
                    <p className="text-gray-600 mb-4">
                        Use this page to debug authentication issues. Check the browser console and server logs for more details.
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                        <p>• Check if users exist in the database</p>
                        <p>• Verify mobile number format (should be number, not string)</p>
                        <p>• Ensure passwords are properly hashed</p>
                        <p>• Check server console logs for authentication attempts</p>
                    </div>
                </div>
            </div>
        </div>
    );
} 