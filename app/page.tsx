'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { storage } from '@/lib/storage';

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    if (storage.hasWallet()) {
      router.replace('/lock');
    } else {
      router.replace('/onboarding');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center text-4xl animate-bounce-subtle shadow-lg glow-green">
          🏃
        </div>
        <p className="text-white/30 text-sm tracking-widest uppercase">RunChain</p>
      </div>
    </div>
  );
}
