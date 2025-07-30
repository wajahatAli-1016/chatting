import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    lastMessage: {
        type: String,
        default: ""
    },
    lastMessageTime: {
        type: Date,
        default: Date.now
    },
    messages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }]
}, {
    timestamps: true
});

// Index for faster queries and ensuring uniqueness
chatSchema.index({ participants: 1 });
chatSchema.index({ lastMessageTime: -1 });

const Chat = mongoose.models.Chat || mongoose.model('Chat', chatSchema);

export default Chat; 