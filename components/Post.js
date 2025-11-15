'use client';
import { useState } from 'react';
import CommentSection from './CommentSection';

export default function Post({ post, currentUser, onPostUpdate }) {
  // Safe defaults for post data
  const safeLikes = post?.likes || [];
  const safeShares = post?.shares || 0;
  
  const [isLiked, setIsLiked] = useState(safeLikes.includes(currentUser?.id));
  const [likeCount, setLikeCount] = useState(safeLikes.length);
  const [shareCount, setShareCount] = useState(safeShares);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLike = async () => {
    // Optimistic update
    const prevLiked = isLiked;
    const prevCount = likeCount;

    if (!isLiked) {
      setIsLiked(true);
      setLikeCount(likeCount + 1);
    } else {
      setIsLiked(false);
      setLikeCount(likeCount - 1);
    }

    try {
      const response = await fetch(`/api/posts/${post._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });

      if (!response.ok) {
        // Server failed → rollback
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
      } else {
        // Update from server response if needed
        const updatedPost = await response.json();
        const updatedLikes = updatedPost?.likes || [];
        setIsLiked(updatedLikes.includes(currentUser?.id));
        setLikeCount(updatedLikes.length);
      }
    } catch (error) {
      // Network error → rollback
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/posts/${post._id}/share`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const updatedPost = await response.json();
        setShareCount(updatedPost?.shares || 0);
      }
    } catch (error) {
      console.error('Error sharing post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // If post is not available, don't render
  if (!post) {
    return null;
  }

  return (
    <div className="bg-white text-black rounded-lg shadow-md p-6 mb-4">
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
          <span className="text-gray-600 font-semibold">
            {post.author?.charAt(0).toUpperCase() || 'U'}
          </span>
        </div>
        <div>
          <h3 className="font-semibold">{post.author || 'Unknown User'}</h3>
          <p className="text-gray-500 text-sm">
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Unknown date'}
          </p>
        </div>
      </div>
      
      <p className="text-gray-800 mb-4">{post.content}</p>
      
      <div className="flex justify-between text-gray-500 border-t border-b py-2 mb-4">
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-1 ${
            isLiked ? 'text-blue-600' : 'hover:text-blue-600'
          } disabled:opacity-50`}
        >
          <span>👍</span>
          <span>Like ({likeCount})</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          disabled={isLoading}
          className="flex items-center space-x-1 hover:text-blue-600 disabled:opacity-50"
        >
          <span>💬</span>
          <span>Comment</span>
        </button>
        
        <button
          onClick={handleShare}
          disabled={isLoading}
          className="flex items-center space-x-1 hover:text-blue-600 disabled:opacity-50"
        >
          <span>🔄</span>
          <span>Share ({shareCount})</span>
        </button>
      </div>

      {showComments && (
        <CommentSection 
          postId={post._id} 
          currentUser={currentUser}
        />
      )}
    </div>
  );
}