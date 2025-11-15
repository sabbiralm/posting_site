// lib/db

import mongoose from 'mongoose';

const MONGODB_URI = "mongodb+srv://sewing:Sa01785220401@cluster0.nfzi1fi.mongodb.net/postingSite?retryWrites=true&w=majority"

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
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
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    }).catch(err => {
      console.error('MongoDB connection error:', err);
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    return cached.conn;
  } catch (err) {
    console.error('MongoDB connection failed:', err);
    throw err;
  }
}

export { connectDB };