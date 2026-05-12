"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to chat interface
    router.push('/chat-interface');
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-black">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-red-400 text-lg">Loading Cypher...</p>
      </div>
    </div>
  );
}
