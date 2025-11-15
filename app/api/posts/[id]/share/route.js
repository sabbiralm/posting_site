// app/api/posts/[id]/share/route.js
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  try {
    await connectDB();
    const { id } = await params; // Await the params
    const postId = id;

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    post.shares += 1;
    await post.save();

    return NextResponse.json(post);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}