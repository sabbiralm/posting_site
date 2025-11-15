'use client';
import { useState, useEffect } from 'react';
import Comment from './Comment';

export default function CommentSection({ postId, currentUser }) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (postId) {
      fetchComments();
    }
  }, [postId]);

  const fetchComments = async () => {
    //setLoading(true);
    try {
      const response = await fetch(`/api/comments?postId=${postId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(Array.isArray(data) ? data : []);
      } else {
        setComments([]);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
    } finally {
     // setLoading(false);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || isPosting) return;
    
    setIsPosting(true);
    
    // Create temporary comment for optimistic update
    const tempComment = {
      _id: "temp-" + Date.now(),
      content: newComment,
      author: currentUser?.name,
      authorId: currentUser?.id,
      createdAt: new Date(),
      likes: [],
      replies: [],
      isTemp: true
    };

    // Optimistic update
    setComments(prev => [tempComment, ...prev]);
    setNewComment("");

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newComment,
          author: currentUser?.name,
          authorId: currentUser?.id,
          postId: postId,
          photoURL: currentUser?.photoURL || ''
        }),
      });

      if (response.ok) {
        const savedComment = await response.json();
        
        // Replace temporary comment with saved one
        setComments(prev =>
          prev.map(comment => 
            comment._id === tempComment._id ? savedComment : comment
          )
        );
      } else {
        // Remove temporary comment on error
        setComments(prev => 
          prev.filter(comment => comment._id !== tempComment._id)
        );
        console.error('Failed to post comment');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      // Remove temporary comment on network error
      setComments(prev => 
        prev.filter(comment => comment._id !== tempComment._id)
      );
    } finally {
      setIsPosting(false);
    }
  };

  if (!postId) {
    return <div className="text-red-500">Error: Post ID is missing</div>;
  }

  return (
    <div className="mt-4">
      {/* Comment Count */}
      {comments.length > 0 && (
        <div className="text-gray-500 text-sm mb-4 border-b border-gray-200 pb-2">
          💬️ {comments.length} comments
        </div>
      )}

      {/* Comment Input */}
      <div className="flex items-start space-x-2 mb-4">
        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-gray-600 text-sm font-semibold">
            {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <form onSubmit={handleSubmitComment} className="flex-1">
          <input
            type="text"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full border-b border-gray-300 px-2 py-1 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
            disabled={isPosting}
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={isPosting || !newComment.trim()}
              className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isPosting ? 'Posting...' : 'Post'}
            </button>
          </div>
        </form>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-4 text-gray-500">Loading comments...</div>
      ) : (
        <div className="space-y-4">
          {comments.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
              No comments yet. Be the first to comment!
            </div>
          ) : (
            comments.map((comment) => (
              <Comment
                key={comment._id}
                comment={comment}
                currentUser={currentUser}
                postId={postId}
                onCommentUpdate={fetchComments}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}