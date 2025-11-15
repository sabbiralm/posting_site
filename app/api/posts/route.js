// app/api/posts/route.js
import { connectDB } from '@/lib/db';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    const { content, author, authorId,photoURL } = await request.json();
    
    const post = await Post.create({
      content,
      author,
      authorId,
      photoURL,
    });
    
    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectDB();
    const posts = await Post.find().sort({ createdAt: -1 });
    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}