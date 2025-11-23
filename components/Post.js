'use client';
import { useState, useEffect } from 'react';
import CommentSection from './CommentSection';
import Image from 'next/image';

export default function Post({ post, currentUser, onPostUpdate }) {
  const safeLikes = post?.likes || [];
  const safeShares = post?.shares || 0;
  
  const [isLiked, setIsLiked] = useState(safeLikes.includes(currentUser?.id));
  const [likeCount, setLikeCount] = useState(safeLikes.length);
  const [shareCount, setShareCount] = useState(safeShares);
  const [showComments, setShowComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showLikeUsers, setShowLikeUsers] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);
  const [totalComments, setTotalComments] = useState(0);

  // Fetch total comments count (including replies)
  useEffect(() => {
    if (post?._id) {
      fetchTotalComments();
    }
  }, [post?._id]);

  const fetchTotalComments = async () => {
    try {
      const response = await fetch(`/api/comments/count?postId=${post._id}`);
      if (response.ok) {
        const data = await response.json();
        setTotalComments(data.totalComments || 0);
      }
    } catch (error) {
      console.error('Error fetching total comments:', error);
    }
  };

  // Fetch like users when modal opens
  const fetchLikeUsers = async () => {
    try {
      const response = await fetch(`/api/posts/${post._id}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikeUsers(data.likes || []);
      } else {
        console.error('Failed to fetch like users');
        setLikeUsers([]);
      }
    } catch (error) {
      console.error('Error fetching like users:', error);
      setLikeUsers([]);
    }
  };

  const handleLike = async () => {
    const prevLiked = isLiked;
    const prevCount = likeCount;

    // Optimistic update
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
        // Rollback on error
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
        throw new Error('Failed to like post');
      }

      const updatedPost = await response.json();
      const updatedLikes = updatedPost?.likes || [];
      setIsLiked(updatedLikes.includes(currentUser?.id));
      setLikeCount(updatedLikes.length);
      
    } catch (error) {
      console.error('Error liking post:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleShare = async (platform) => {
    const postText = `${post.content} - By ${post.author}`;
    const shareUrl = `${window.location.origin}/posts/${post._id}`;
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        alert('Post link copied to clipboard!');
        setShowShareOptions(false);
        return;
      case 'direct':
        // Direct share - increment share count
        setIsLoading(true);
        try {
          const response = await fetch(`/api/posts/${post._id}/share`, {
            method: 'POST',
          });
          
          if (response.ok) {
            const updatedPost = await response.json();
            setShareCount(updatedPost?.shares || shareCount + 1);
          }
        } catch (error) {
          console.error('Error sharing post:', error);
        } finally {
          setIsLoading(false);
        }
        setShowShareOptions(false);
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  const handleShowLikeUsers = async () => {
    setShowLikeUsers(true);
    await fetchLikeUsers();
  };

  const handleCommentCountChange = (count) => {
    setTotalComments(count);
  };

  if (!post) {
    return null;
  }

  return (
    <div className="bg-white text-black rounded-lg shadow-md p-6 mb-4">
      {/* Post Header */}
      <div className="flex items-center mb-4">
        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3 overflow-hidden">
          {post.photoURL ? (
            <Image 
              src={post.photoURL} 
              alt={post.author} 
              width={40} 
              height={40}
              className="rounded-full object-cover"
            />
          ) : (
            <span className="text-gray-600 font-semibold">
              {post.author?.charAt(0).toUpperCase() || 'U'}
            </span>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{post.author || 'Unknown User'}</h3>
          <p className="text-gray-500 text-sm">
            {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Unknown date'}
          </p>
        </div>
      </div>
      
      {/* Post Content */}
      <p className="text-gray-800 mb-4">{post.content}</p>
      
      {/* Post Stats - Always visible */}
      <div className="flex items-center justify-between text-gray-500 text-sm mb-3 border-b border-gray-200 pb-2">
        {/* Like Count - Always show if there are likes */}
        {likeCount > 0 ? (
          <button 
            onClick={handleShowLikeUsers}
            className="flex items-center space-x-1 hover:underline text-blue-600"
          >
            <span>👍</span>
            <span>{likeCount} {likeCount === 1 ? 'like' : 'likes'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 text-gray-400">
            <span>👍</span>
            <span>0 likes</span>
          </div>
        )}
        
        {/* Comment Count - Always show */}
        {totalComments > 0 ? (
          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 hover:underline text-blue-600"
          >
            <span>💬</span>
            <span>{totalComments} {totalComments === 1 ? 'comment' : 'comments'}</span>
          </button>
        ) : (
          <div className="flex items-center space-x-1 text-gray-400">
            <span>💬</span>
            <span>0 comments</span>
          </div>
        )}
        
        {/* Share Count - Always show */}
        <div className="flex items-center space-x-1 text-gray-500">
          <span>🔄</span>
          <span>{shareCount} {shareCount === 1 ? 'share' : 'shares'}</span>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-between text-gray-500 border-t border-b py-2 mb-4">
        {/* Like Button */}
        <button
          onClick={handleLike}
          disabled={isLoading}
          className={`flex items-center space-x-1 flex-1 justify-center ${
            isLiked ? 'text-blue-600 font-semibold' : 'hover:text-blue-600'
          } disabled:opacity-50`}
        >
          <span>👍</span>
          <span>Like</span>
        </button>
        
        {/* Comment Button */}
        <button
          onClick={() => setShowComments(!showComments)}
          disabled={isLoading}
          className="flex items-center space-x-1 flex-1 justify-center hover:text-blue-600 disabled:opacity-50"
        >
          <span>💬</span>
          <span>Comment</span>
        </button>
        
        {/* Share Button */}
        <div className="relative flex-1">
          <button
            onClick={() => setShowShareOptions(!showShareOptions)}
            disabled={isLoading}
            className="flex items-center space-x-1 w-full justify-center hover:text-blue-600 disabled:opacity-50"
          >
            <span>🔄</span>
            <span>Share</span>
          </button>
          
          {/* Share Options Dropdown */}
          {showShareOptions && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-40">
              <button 
                onClick={() => handleShare('facebook')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100"
              >
                📘 Facebook
              </button>
              <button 
                onClick={() => handleShare('twitter')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100"
              >
                🐦 Twitter
              </button>
              <button 
                onClick={() => handleShare('linkedin')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100"
              >
                💼 LinkedIn
              </button>
              <button 
                onClick={() => handleShare('copy')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-b border-gray-100"
              >
                📋 Copy Link
              </button>
              <button 
                onClick={() => handleShare('direct')}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
              >
                🔄 Share Now
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Like Users Modal */}
      {showLikeUsers && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowLikeUsers(false)}>
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 max-h-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-lg">Liked by</h3>
              <button 
                onClick={() => setShowLikeUsers(false)}
                className="text-gray-500 hover:text-gray-700 text-lg"
              >
                ✕
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {likeUsers.length > 0 ? (
                likeUsers.map((user, index) => (
                  <div key={user._id || index} className="flex items-center space-x-3 py-2 border-b border-gray-100">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                      {user.photoURL ? (
                        <Image 
                          src={user.photoURL} 
                          alt={user.displayName || 'User'} 
                          width={32} 
                          height={32}
                          className="rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-blue-600 text-sm font-semibold">
                          {user.displayName?.charAt(0).toUpperCase() || 'U'}
                        </span>
                      )}
                    </div>
                    <span className="text-sm font-medium">{user.displayName || 'Unknown User'}</span>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 py-4">
                  No likes yet
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <CommentSection 
          postId={post._id} 
          currentUser={currentUser}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}