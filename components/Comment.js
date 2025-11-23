'use client';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';

export default function Comment({ comment, currentUser, postId, onCommentUpdate, depth = 0 }) {
  const commentRef = useRef(null);

  const safeLikes = comment?.likes || [];
  const safeReplies = comment?.replies || [];

  const [isLiked, setIsLiked] = useState(safeLikes.includes(currentUser?.id));
  const [likeCount, setLikeCount] = useState(safeLikes.length);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showLikeUsers, setShowLikeUsers] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [likeUsers, setLikeUsers] = useState([]);

  const MAX_NESTED_DEPTH = 10;
  const shouldFlattenReplies = depth >= MAX_NESTED_DEPTH;

  // Add @username when reply opens
  useEffect(() => {
    if (isReplying) {
      const mention = `@${comment.author} `;
      setReplyContent((prev) => (prev.startsWith(mention) ? prev : mention));
    }
  }, [isReplying, comment.author]);

  // Fetch like users when modal opens
  useEffect(() => {
    if (showLikeUsers && likeCount > 0) {
      fetchLikeUsers();
    }
  }, [showLikeUsers]);

  const fetchLikeUsers = async () => {
    try {
      const response = await fetch(`/api/comments/${comment._id}/likes`);
      if (response.ok) {
        const data = await response.json();
        setLikeUsers(data.likes || []);
      }
    } catch (error) {
      console.error('Error fetching like users:', error);
    }
  };

  const handleLike = async () => {
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
      const response = await fetch(`/api/comments/${comment._id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser?.id }),
      });

      if (!response.ok) {
        setIsLiked(prevLiked);
        setLikeCount(prevCount);
      } else {
        const updatedComment = await response.json();
        const updatedLikes = updatedComment?.likes || [];
        setIsLiked(updatedLikes.includes(currentUser?.id));
        setLikeCount(updatedLikes.length);
      }
    } catch (error) {
      console.error('Error liking comment:', error);
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim() || isPosting) return;

    setIsPosting(true);

    try {
      // Extract mentions
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(replyContent)) !== null) {
        mentions.push(match[1]);
      }

      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          author: currentUser?.name || 'Anonymous',
          authorId: currentUser?.id || 'anonymous',
          postId: postId,
          parentCommentId: comment._id,
          mentions: mentions,
          photoURL: currentUser?.photoURL || ''
        }),
      });

      if (response.ok) {
        setReplyContent('');
        setIsReplying(false);
        setShowReplies(true);
        onCommentUpdate();
      } else {
        console.error('Error posting reply. Server responded with:', response.status);
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    } finally {
      setIsPosting(false);
    }
  };

  const handleShare = async (platform) => {
    const commentText = `${comment.content} - By ${comment.author}`;
    const shareUrl = `${window.location.origin}/posts/${postId}#comment-${comment._id}`;
    
    let shareLink = '';
    
    switch (platform) {
      case 'facebook':
        shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'twitter':
        shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(commentText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        shareLink = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      case 'copy':
        await navigator.clipboard.writeText(shareUrl);
        alert('Link copied to clipboard!');
        setShowShareOptions(false);
        return;
      default:
        return;
    }
    
    window.open(shareLink, '_blank', 'width=600,height=400');
    setShowShareOptions(false);
  };

  if (!comment) return null;

  return (
    <div ref={commentRef} className={`${depth > 0 ? 'mt-2' : 'mt-3'}`} onClick={(e) => e.stopPropagation()}>
      <div className={depth >= 2 ? '' : 'flex items-start'}>
        {/* Profile */}
        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
          {comment.photoURL ? (
            <Image src={comment.photoURL} alt={comment.author} height={40} width={40} className="rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
              {comment.author?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>

        <div className="flex-1 mt-2">
          {/* Comment Content */}
          <div className="bg-gray-100 rounded-2xl px-3 py-2">
            <div className="flex items-baseline space-x-2">
              <h4 className="font-semibold text-sm text-gray-900">{comment.author || 'Unknown User'}</h4>
              <span className="text-gray-500 text-xs">
                {comment.createdAt ? new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }) : 'Now'}
              </span>
            </div>
            <p className="text-gray-800 mt-1 text-sm">{comment.content}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500 px-1">
            {/* Like Button */}
            <button 
              onClick={handleLike} 
              className={`hover:underline ${isLiked ? 'text-blue-600 font-semibold' : ''}`}
            >
              Like
            </button>
            
            {/* Reply Button */}
            <button 
              type="button" 
              onClick={() => setIsReplying(!isReplying)} 
              className="hover:underline" 
              disabled={isPosting}
            >
              Reply
            </button>

            {/* Share Button */}
            <div className="relative">
              <button 
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="hover:underline"
              >
                Share
              </button>
              
              {/* Share Options Dropdown */}
              {showShareOptions && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-32">
                  <button 
                    onClick={() => handleShare('facebook')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Facebook
                  </button>
                  <button 
                    onClick={() => handleShare('twitter')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    Twitter
                  </button>
                  <button 
                    onClick={() => handleShare('linkedin')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  >
                    LinkedIn
                  </button>
                  <button 
                    onClick={() => handleShare('copy')}
                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm border-t border-gray-200"
                  >
                    Copy Link
                  </button>
                </div>
              )}
            </div>

            {/* Like Count */}
            {likeCount > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <button 
                  onClick={() => setShowLikeUsers(true)}
                  className="flex items-center space-x-1 text-gray-500 hover:underline"
                >
                  <span>👍</span>
                  <span>{likeCount}</span>
                </button>
              </>
            )}

            {/* View Replies */}
            {safeReplies.length > 0 && (
              <>
                <span className="text-gray-400">·</span>
                <button 
                  onClick={() => setShowReplies(!showReplies)} 
                  className="text-blue-600 hover:underline"
                >
                  {showReplies ? 'Hide' : 'View'} replies ({safeReplies.length})
                </button>
              </>
            )}
          </div>

          {/* Like Users Modal */}
          {showLikeUsers && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg">Liked by</h3>
                  <button 
                    onClick={() => setShowLikeUsers(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {likeUsers.length > 0 ? (
                    likeUsers.map((user, index) => (
                      <div key={index} className="flex items-center space-x-3 py-2 border-b border-gray-100">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {user.photoURL ? (
                            <Image 
                              src={user.photoURL} 
                              alt={user.name} 
                              width={32} 
                              height={32} 
                              className="rounded-full"
                            />
                          ) : (
                            <span className="text-blue-600 text-sm font-semibold">
                              {user.name?.charAt(0).toUpperCase() || 'U'}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-medium">{user.name}</span>
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

          {/* Reply Form */}
          {isReplying && (
            <div className="mt-2 flex items-start space-x-2">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <form onSubmit={handleReply} className="flex-1 flex space-x-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 border-b border-gray-300 px-1 py-1 text-sm focus:outline-none focus:border-blue-500 bg-transparent"
                  disabled={isPosting}
                  autoFocus
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                  disabled={isPosting || !replyContent.trim()}
                >
                  Reply
                </button>
              </form>
            </div>
          )}

          {/* Nested Replies */}
          {showReplies && safeReplies.length > 0 && (
            <div className={`mt-2 space-y-2 ${depth >= 2 ? '' : 'border-l-2  border-gray-200 pl-3'}`}>
              {safeReplies.map((reply) => (
                <Comment
                  key={reply._id}
                  comment={reply}
                  currentUser={currentUser}
                  postId={postId}
                  onCommentUpdate={onCommentUpdate}
                  depth={shouldFlattenReplies ? depth : depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}