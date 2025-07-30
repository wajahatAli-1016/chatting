import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://wajahat:hU2GZE3FhlWlSQzB@cluster0.jnhmvbu.mongodb.net/';

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // Increased timeout to 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      useNewUrlParser: true,
      useUnifiedTopology: true
    };

    try {
      cached.promise = mongoose.connect(MONGODB_URI, opts)
        .then((mongoose) => {
          console.log('Connected to MongoDB');
          return mongoose;
        });
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      cached.promise = null;
      throw error;
    }
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error('Failed to establish MongoDB connection:', e);
    throw e;
  }

  return cached.conn;
}

// Handle connection errors
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  cached.conn = null;
  cached.promise = null;
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected');
});

// Handle process termination
['SIGTERM', 'SIGINT', 'SIGUSR2'].forEach((signal) => {
  process.on(signal, async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
});

export default connectDB;