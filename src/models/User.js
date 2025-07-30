import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
    },
    mobile:{
        type: Number,
        required:true,
        unique:true
    },
    password:{
        type: String,
        required:true
    }
}, {
    timestamps: true
});

// Convert mobile to number before saving
userSchema.pre('save', async function(next) {
    // Convert mobile to number if it's a string
    if (this.mobile && typeof this.mobile === 'string') {
        this.mobile = parseInt(this.mobile);
    }
    
    // Hash password if it's modified and not already hashed
    if (this.isModified('password')) {
        try {
            // Check if password is already hashed (bcrypt hashes start with $2a$, $2b$, or $2y$)
            if (!this.password.startsWith('$2')) {
                const salt = await bcrypt.genSalt(10);
                this.password = await bcrypt.hash(this.password, salt);
            }
        } catch (error) {
            return next(error);
        }
    }
    next();
});

// Check if the model already exists to prevent recompilation
const User = mongoose.models.User || mongoose.model('User', userSchema);

export default User;