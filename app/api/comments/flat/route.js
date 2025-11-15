// app/api/comments/flat/route.js
import { NextResponse } from 'next/server';
import Comment from '@/models/Comment';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');

    if (!postId) {
      return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    // Fetch all comments for this post
    const allComments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();

    // Create a map for quick lookup and build flat structure
    const commentMap = new Map();
    const rootComments = [];

    // First pass: organize comments by parent
    allComments.forEach(comment => {
      comment.replies = [];
      commentMap.set(comment._id.toString(), comment);

      if (!comment.parentCommentId) {
        rootComments.push(comment);
      }
    });

    // Second pass: build hierarchy and then flatten
    const flattenComments = (comments, depth = 0) => {
      let result = [];
      
      comments.forEach(comment => {
        // Add current comment with depth info
        result.push({
          ...comment,
          depth,
          displayOrder: comment.createdAt // Use createdAt for ordering
        });
        
        // Add replies recursively
        if (comment.replies && comment.replies.length > 0) {
          const replies = comment.replies.map(replyId => commentMap.get(replyId.toString())).filter(Boolean);
          const sortedReplies = replies.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
          result = result.concat(flattenComments(sortedReplies, depth + 1));
        }
      });
      
      return result;
    };

    // Sort root comments by date
    const sortedRootComments = rootComments.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    const flatComments = flattenComments(sortedRootComments);

    return NextResponse.json(flatComments);
  } catch (error) {
    console.error('Error fetching flat comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}