// app/api/comments/route.js
import { connectDB } from '@/lib/db';
import Comment from '@/models/Comment';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    await connectDB();
    const { content, author, authorId, postId, parentCommentId, mentions, photoURL } = await request.json();
    
    // Calculate depth for nested comments
    let depth = 0;
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      depth = parentComment ? parentComment.depth + 1 : 0;
    }
    
    const comment = await Comment.create({
      content,
      author,
      authorId,
      postId,
      parentCommentId: parentCommentId || null,
      mentions: mentions || [],
      depth,
      photoURL
    });
    
    // Populate the comment with necessary data
    await comment.populate('parentCommentId', 'author');
    
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    
    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }
    
    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();
    
    // Build nested structure
    const commentMap = new Map();
    const rootComments = [];
    
    comments.forEach(comment => {
      commentMap.set(comment._id.toString(), { ...comment, replies: [] });
    });
    
    comments.forEach(comment => {
      const commentObj = commentMap.get(comment._id.toString());
      if (comment.parentCommentId) {
        const parent = commentMap.get(comment.parentCommentId.toString());
        if (parent) {
          parent.replies.push(commentObj);
        }
      } else {
        rootComments.push(commentObj);
      }
    });
    
    return NextResponse.json(rootComments);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}