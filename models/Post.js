// models/Post.js
import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
  },
  author: {
    type: String,
    required: true,
  },
  authorId: {
    type: String,
    required: true,
  },
  likes: {
    type: [String],
    default: [],
  },
  photoURL:{
    type: String,
  },
  shares: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Post || mongoose.model('Post', postSchema);