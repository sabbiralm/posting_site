// components/withAuth.jsx
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [user, loading, router]);

    if (loading) return <div>Loading...</div>;
    if (!user) return null;

    return <Component {...props} />;
  };
}