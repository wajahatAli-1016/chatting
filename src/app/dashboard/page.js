"use client"

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useState, useEffect, useRef } from "react";

export default function Dashboard() {
    const { user, logout } = useAuth();
    const { isDarkMode, toggleTheme } = useTheme();
    const [allUsers, setAllUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [chats, setChats] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [message, setMessage] = useState("");
    const [isMobileView, setIsMobileView] = useState(false);
    const [showMobileChat, setShowMobileChat] = useState(false);
    
    // Chat functionality states
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const messagesEndRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const pollingIntervalRef = useRef(null);

    // Common emojis for the picker
    const emojis = [
        "😀", "😃", "😄", "😁", "😆", "😅", "😂", "🤣", "😊", "😇",
        "🙂", "🙃", "😉", "😌", "😍", "🥰", "😘", "😗", "😙", "😚",
        "😋", "😛", "😝", "😜", "🤪", "🤨", "🧐", "🤓", "😎", "🤩",
        "🥳", "😏", "😒", "😞", "😔", "😟", "😕", "🙁", "☹️", "😣",
        "😖", "😫", "😩", "🥺", "😢", "😭", "😤", "😠", "😡", "🤬",
        "🤯", "😳", "🥵", "🥶", "😱", "😨", "😰", "😥", "😓", "🤗",
        "🤔", "🤭", "🤫", "🤥", "😶", "😐", "😑", "😯", "😦", "😧",
        "😮", "😲", "🥱", "😴", "🤤", "😪", "😵", "🤐", "🥴", "🤢",
        "🤮", "🤧", "😷", "🤒", "🤕", "🤑", "🤠", "💩", "👻", "💀",
        "☠️", "👽", "👾", "🤖", "😺", "😸", "😹", "😻", "😼", "😽",
        "🙀", "😿", "😾", "🙈", "🙉", "🙊", "💌", "💘", "💝", "💖",
        "💗", "💓", "💞", "💕", "💟", "❣️", "💔", "❤️", "🧡", "💛",
        "💚", "💙", "💜", "🖤", "🤍", "🤎", "💯", "💢", "💥", "💫",
        "💦", "💨", "🕳️", "💬", "🗨️", "🗯️", "💭", "💤", "👋", "🤚",
        "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🤟", "🤘",
        "🤙", "👈", "👉", "👆", "🖕", "👇", "☝️", "👍", "👎", "✊",
        "👊", "🤛", "🤜", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✍️",
        "💪", "🦾", "🦿", "🦵", "🦶", "👂", "🦻", "👃", "🧠", "🫀",
        "🫁", "🦷", "🦴", "👀", "👁️", "👅", "👄", "💋", "🩸", "🩹"
    ];
    
    // Fetch all users excluding current user
    const fetchAllUsers = async () => {
        if (!user?.id) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/api/users?currentUserId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setAllUsers(data.users || []);
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    // Handle search
    const handleSearch = (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const filtered = allUsers.filter(u => 
                u.username.toLowerCase().includes(query.toLowerCase()) ||
                String(u.mobile).includes(query)
            );
            setFilteredUsers(filtered);
            setShowSearchResults(true);
        } else {
            setFilteredUsers([]);
            setShowSearchResults(false);
        }
    };

    // Fetch user's chats
    const fetchUserChats = async () => {
        if (!user?.id) return;
        
        try {
            const response = await fetch(`/api/chats?userId=${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setChats(data.chats || []);
            }
        } catch (error) {
            console.error("Error fetching chats:", error);
        }
    };

    // Fetch selected chat with messages
    const fetchSelectedChat = async () => {
        if (!selectedChat?._id) return;
        
        try {
            const response = await fetch(`/api/chats/${selectedChat._id}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedChat(data.chat);
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Error fetching selected chat:", error);
        }
    };

    // Create or open chat with a user
    const createOrOpenChat = async (otherUser) => {
        if (!user?.id || !otherUser._id) return;
        
        try {
            const response = await fetch('/api/chats', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: user.id,
                    otherUserId: otherUser._id
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedChat(data.chat);
                
                // On mobile, show the chat view
                if (isMobileView) {
                    setShowMobileChat(true);
                }
                
                // If it's a new chat, refresh the chats list
                if (data.isNew) {
                    fetchUserChats();
                }
            }
        } catch (error) {
            console.error("Error creating/opening chat:", error);
        }
    };

    // Open existing chat
    const openChat = async (chatId) => {
        try {
            const response = await fetch(`/api/chats/${chatId}`);
            if (response.ok) {
                const data = await response.json();
                setSelectedChat(data.chat);
                
                // On mobile, show the chat view
                if (isMobileView) {
                    setShowMobileChat(true);
                }
                
                setTimeout(scrollToBottom, 100);
            }
        } catch (error) {
            console.error("Error opening chat:", error);
        }
    };

    // Mobile detection
    useEffect(() => {
        const checkMobileView = () => {
            setIsMobileView(window.innerWidth < 768);
        };
        
        checkMobileView();
        window.addEventListener('resize', checkMobileView);
        
        return () => {
            window.removeEventListener('resize', checkMobileView);
        };
    }, []);

    // Initial data fetch
    useEffect(() => {
        if (user?.id) {
            fetchAllUsers();
            fetchUserChats();
        }
    }, [user]);

    // Refresh selected chat periodically
    useEffect(() => {
        if (selectedChat?._id) {
            const interval = setInterval(fetchSelectedChat, 3000); // Refresh every 3 seconds
            pollingIntervalRef.current = interval;
            
            return () => {
                if (pollingIntervalRef.current) {
                    clearInterval(pollingIntervalRef.current);
                }
            };
        }
    }, [selectedChat?._id]);
   
   // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!message.trim() || !user?.id || !selectedChat) return;

        try {
            const response = await fetch(`/api/chats/${selectedChat._id}/messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: message,
                    senderId: user.id,
                }),
            });

            if (response.ok) {
                setMessage("");
                setShowEmojiPicker(false);
                fetchSelectedChat();
                fetchUserChats(); // Refresh chats list to update last message
            }
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const addEmoji = (emoji) => {
        setMessage(prev => prev + emoji);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const getOtherParticipant = (chat) => {
        if (!user?.id) return null;
        return chat.participants.find(p => p._id !== user.id);
    };

    const getOtherParticipantFromSelected = () => {
        if (!selectedChat || !user?.id) return null;
        return selectedChat.participants.find(p => p._id !== user.id);
    };

    // Helper function to format timestamps safely
    const formatTimestamp = (timestamp, fallbackText = 'Just now') => {
        const date = new Date(timestamp || new Date());
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            return fallbackText;
        }
        
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Handle mobile back navigation
    const handleMobileBack = () => {
        setShowMobileChat(false);
        setSelectedChat(null);
    };

    return (
        <ProtectedRoute>
            <div className="h-screen flex overflow-hidden" style={{ background: 'var(--chat-bg)' }}>
                {/* Sidebar - Hidden on mobile when chat is open */}
                <div className={`${
                    isMobileView 
                        ? (showMobileChat ? 'hidden' : 'w-full') 
                        : 'w-1/3'
                } border-r flex flex-col min-w-0`} style={{ background: 'var(--message-bg)', borderColor: 'var(--border-color)' }}>
                    {/* Header */}
                    <div className="p-3 sm:p-4 flex items-center justify-between min-w-0" style={{ background: 'var(--header-bg)', color: 'var(--header-text)' }}>
                        <div className="flex items-center min-w-0 flex-1">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="text-xl font-bold truncate">
                                    NexTalk
                                </h1>
                                <p className="text-sm opacity-80 truncate">
                                    Connect & Chat
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className="bg-white/20 hover:bg-white/30 p-2 rounded transition-colors flex-shrink-0"
                                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                            >
                                {isDarkMode ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                            <button
                                onClick={logout}
                                className="bg-white/20 hover:bg-white/30 px-2 sm:px-3 py-1 rounded text-sm transition-colors flex-shrink-0"
                            >
                                Logout
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="p-2" style={{ background: 'var(--message-bg)' }}>
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search users..."
                                className="w-full px-4 py-2 pl-10 rounded-lg focus:outline-none focus:ring-2"
                                style={{
                                    background: 'var(--recent-header-bg)',
                                    color: 'var(--message-text)',
                                    borderColor: 'var(--border-color)',
                                    '--tw-ring-color': 'var(--header-bg)'
                                }}
                            />
                            <svg 
                                className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2"
                                style={{ color: 'var(--message-text-secondary)' }}
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Search Results */}
                    {showSearchResults && (
                        <div className="flex-1 overflow-y-auto">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((searchedUser) => (
                                    <div
                                        key={searchedUser._id}
                                        onClick={() => {
                                            createOrOpenChat(searchedUser);
                                            setSearchQuery("");
                                            setShowSearchResults(false);
                                        }}
                                        className="flex items-center px-4 py-3 cursor-pointer border-b transition-colors"
                                        style={{ 
                                            borderColor: 'var(--border-color)',
                                            background: 'transparent',
                                            ':hover': { background: 'var(--hover-bg)' }
                                        }}
                                    >
                                        <div className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center mr-3">
                                            <span className="text-white font-bold text-sm">
                                                {searchedUser.username.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--message-text)' }}>
                                                {searchedUser.username}
                                            </h3>
                                            <p className="text-xs truncate" style={{ color: 'var(--message-text-secondary)' }}>
                                                {searchedUser.mobile}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center" style={{ color: 'var(--message-text-secondary)' }}>
                                    No users found
                                </div>
                            )}
                        </div>
                    )}

                    {/* Recent Chats Section */}
                    {!showSearchResults && (
                        <div className="flex-1 overflow-hidden flex flex-col">
                            {chats.length > 0 ? (
                                <>
                                    <div className="px-4 py-3 border-b" style={{ 
                                        background: 'var(--recent-header-bg)',
                                        borderColor: 'var(--border-color)',
                                        color: 'var(--recent-header-text)'
                                    }}>
                                        <h2 className="text-sm font-medium">Recent Chats</h2>
                                    </div>
                                    <div className="flex-1 overflow-y-auto">
                                        {chats.map((chat) => {
                                            const otherUser = getOtherParticipant(chat);
                                            if (!otherUser) return null;

                                            return (
                                                <div
                                                    key={chat._id}
                                                    onClick={() => openChat(chat._id)}
                                                    className={`flex items-center px-4 cursor-pointer border-b transition-colors ${
                                                        isMobileView ? 'py-4' : 'py-3'
                                                    }`}
                                                    style={{ 
                                                        borderColor: 'var(--border-color)',
                                                        background: selectedChat?._id === chat._id ? 'var(--active-chat-bg)' : 'transparent',
                                                        ':hover': { background: 'var(--hover-bg)' }
                                                    }}
                                                >
                                                    <div className="w-10 h-10 bg-[#00A884] rounded-full flex items-center justify-center mr-3">
                                                        <span className="text-white font-bold text-sm">
                                                            {otherUser.username.charAt(0).toUpperCase()}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-semibold truncate" style={{ color: 'var(--message-text)' }}>
                                                            {otherUser.username}
                                                        </h3>
                                                        <p className="text-xs truncate" style={{ color: 'var(--message-text-secondary)' }}>
                                                            {chat.lastMessage || "No messages yet"}
                                                        </p>
                                                    </div>
                                                    <div className="text-xs" style={{ color: 'var(--message-text-secondary)' }}>
                                                        {formatTimestamp(chat.lastMessageTime, 'Now')}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center" style={{ color: 'var(--message-text-secondary)' }}>
                                    <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                    <p className="text-lg font-medium">No chats yet</p>
                                    <p className="text-sm">Your conversations will appear here</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Chat Area - Full width on mobile when chat is open, hidden otherwise */}
                <div className={`${
                    isMobileView 
                        ? (showMobileChat ? 'w-full' : 'hidden') 
                        : 'flex-1'
                } flex flex-col min-w-0 h-full relative`}>
                    {selectedChat ? (
                        <>
                            {/* Chat Header - Fixed */}
                            <div className="absolute top-0 left-0 right-0 z-50" style={{ background: 'var(--header-bg)', color: 'var(--header-text)' }}>
                                <div className="p-3 sm:p-4">
                                    <div className="flex items-center min-w-0">
                                        {/* Mobile Back Button */}
                                        {isMobileView && (
                                            <button 
                                                onClick={handleMobileBack}
                                                className="mr-2 sm:mr-3 p-1 hover:bg-white/20 rounded flex-shrink-0"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                                </svg>
                                            </button>
                                        )}
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                                            <span className="font-bold text-lg">
                                                {getOtherParticipantFromSelected()?.username?.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <h1 className="text-lg font-semibold truncate">{getOtherParticipantFromSelected()?.username}</h1>
                                            <p className="text-sm opacity-80">Online</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area - Scrollable with padding for header and input */}
                            <div className="flex-1 overflow-y-auto pt-[88px] pb-[140px]" style={{ background: 'var(--chat-bg)' }}>
                                <div className="p-2 sm:p-4">
                                    {selectedChat.messages.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                            </svg>
                                            <p className="text-lg font-medium">No messages yet</p>
                                            <p className="text-sm">Start the conversation!</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-4">
                                            {selectedChat.messages && selectedChat.messages.length > 0 ? (
                                                selectedChat.messages.map((msg, index) => {
                                                    const senderId = msg.sender?._id || msg.sender;
                                                    const isOwnMessage = senderId === user?.id;
                                                    
                                                    return (
                                                        <div
                                                            key={msg._id || index}
                                                            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                                                        >
                                                            <div
                                                                className="max-w-xs sm:max-w-sm lg:max-w-md px-3 py-2 rounded-lg break-words"
                                                                style={{
                                                                    background: isOwnMessage ? 'var(--own-message-bg)' : 'var(--message-bg)',
                                                                    color: isOwnMessage ? 'var(--own-message-text)' : 'var(--message-text)'
                                                                }}
                                                            >
                                                                <p className="text-sm">{msg.content}</p>
                                                                <p className={`text-xs mt-1 ${
                                                                    isOwnMessage ? 'text-white/70' : 'text-gray-500'
                                                                }`}>
                                                                    {formatTimestamp(msg.timestamp)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            ) : null}
                                            <div ref={messagesEndRef} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bottom Section - Fixed */}
                            <div className="absolute bottom-0 left-0 right-0 z-50" style={{ background: 'var(--message-bg)' }}>
                                {/* Emoji Picker */}
                                {showEmojiPicker && (
                                    <div 
                                        ref={emojiPickerRef}
                                        className="border-t p-2 sm:p-4 max-h-48 overflow-y-auto overflow-x-hidden"
                                        style={{ borderColor: 'var(--border-color)' }}
                                    >
                                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1 sm:gap-2">
                                            {emojis.map((emoji, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => addEmoji(emoji)}
                                                    className="w-8 h-8 text-lg hover:bg-gray-100 rounded transition-colors flex items-center justify-center"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Message Input */}
                                <div className="border-t p-2 sm:p-4" style={{ borderColor: 'var(--border-color)' }}>
                                    <form onSubmit={sendMessage} className="flex space-x-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                            className="p-2 text-gray-500 hover:text-[#00A884] hover:bg-gray-100 rounded-full transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <input
                                            type="text"
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            placeholder="Type a message..."
                                            className="flex-1 px-3 sm:px-4 py-2 rounded-full focus:outline-none focus:ring-2 min-w-0"
                                            style={{
                                                background: 'var(--message-bg)',
                                                color: 'var(--message-text)',
                                                border: '1px solid var(--border-color)',
                                                '--tw-ring-color': 'var(--header-bg)'
                                            }}
                                        />
                                        <button
                                            type="submit"
                                            disabled={!message.trim()}
                                            className="bg-[#00A884] hover:bg-[#008f72] disabled:bg-gray-300 text-white p-2 rounded-full transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </>
                    ) : (
                        // Welcome screen when no chat is selected (desktop only)
                        !isMobileView && (
                            <div className="flex items-center justify-center bg-gray-50 h-full">
                                <div className="text-center text-gray-500">
                                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <h2 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Chat App</h2>
                                    <p className="text-gray-500">Select a user to start chatting</p>
                                </div>
                            </div>
                        )
                    )}
                </div>
            </div>
        </ProtectedRoute>
    );
}