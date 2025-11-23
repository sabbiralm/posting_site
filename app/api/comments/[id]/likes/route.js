import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import User from '@/models/User';

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Fetch user details for each like
    const likeUsers = await User.find(
      { _id: { $in: comment.likes } },
      { name: 1, email: 1, photoURL: 1 }
    );

    return NextResponse.json({ likes: likeUsers });
  } catch (error) {
    console.error('Error fetching comment like users:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}