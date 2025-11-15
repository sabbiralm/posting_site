'use client';
import { useState, useEffect, useCallback } from 'react';
import Post from '@/components/Post';
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [user, setUser] = useState(null);

  const router = useRouter();

  // 🔹 Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      console.log("Auth State Changed:", u);
      
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);
      setCurrentUser({
        id: u.uid,
        name: u.displayName || 'Anonymous',
        photoURL: u.photoURL || ''
      });
    });
    
    return () => unsubscribe();
  }, [router]);

  // 🔹 Fetch posts function with useCallback
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/posts');
      const data = response.ok ? await response.json() : [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Fetch posts when user changes
  useEffect(() => {
    if (user) fetchPosts();
  }, [user, fetchPosts]);

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newPostContent,
          author: currentUser?.name,
          authorId: currentUser?.id,
          photoURL: currentUser?.photoURL || ''
        }),
      });

      if (response.ok) {
        setNewPostContent('');
        await fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error creating post:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <p>Loading...</p>;

  return (
    <div className="min-h-screen text-black bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4">

        {/* Create Post */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleCreatePost}>
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full border border-gray-300 rounded-lg p-4 resize-none focus:outline-none focus:border-blue-500"
              rows="3"
              disabled={loading}
            />
            <div className="flex justify-end mt-4">
              <button
                type="submit"
                disabled={loading || !newPostContent.trim()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>
        </div>

        {/* Posts Feed */}
        <div>
          {loading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No posts yet. Create the first post!
            </div>
          ) : (
            posts.map((post) => (
              <Post 
                key={post._id} 
                post={post} 
                currentUser={currentUser} 
                onPostUpdate={fetchPosts}
              />
            ))
          )}
        </div>

      </div>
    </div>
  );
}