// app/api/comments/[id]/like/route.js
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { userId } = await request.json();
    const { id } = await params; // Await the params
    const commentId = id;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    const likeIndex = comment.likes.indexOf(userId);
    if (likeIndex > -1) {
      comment.likes.splice(likeIndex, 1);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}