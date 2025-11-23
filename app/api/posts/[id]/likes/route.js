import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const post = await Post.findById(id);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Firebase UID দিয়ে ইউজার খুঁজুন (ObjectId নয়)
    const likeUsers = await User.find(
      { uid: { $in: post.likes } }, // uid ফিল্ড ব্যবহার করুন
      { displayName: 1, email: 1, photoURL: 1 }
    );

    return NextResponse.json({ likes: likeUsers });
  } catch (error) {
    console.error('Error fetching like users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}