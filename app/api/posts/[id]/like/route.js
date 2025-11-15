// app/api/posts/[id]/like/route.js
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { userId } = await request.json();
    const { id } = await params; // Await the params
    const postId = id;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    const likeIndex = post.likes.indexOf(userId);
    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}