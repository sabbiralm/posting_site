// 

"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (!u) router.push("/login");
      setUser(u);
      console.log(u);
    });

    return () => unsubscribe();
  }, []);

  if (!user) return <p>Loading...</p>;

  return (
    <div style={{ width: 300, margin: "80px auto" }}>
      <h2>Welcome: {user.displayName}</h2>
         <p>Email: {user.email}</p>
         {user.photoURL && (
            <Image 
               src={user.photoURL} 
               width={60} 
               alt={user.displayName || "User Profile Picture"} 
               height={50} 
               style={{ borderRadius: 50 }} 
            />
         )}
  
         <br />
         <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
}
