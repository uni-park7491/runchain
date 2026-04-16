'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { storage } from '@/lib/storage';
import { verifyPin } from '@/lib/wallet';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','\u232B'];

export default function LockPage() {
  const router = useRouter();
  const { address, setUnlocked } = useWalletStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (!storage.hasWallet()) router.replace('/onboarding');
  }, [router]);

  const press = (k: string) => {
    if (k === '\u232B') { setPin((p) => p.slice(0, -1)); setError(''); return; }
    if (pin.length >= 8) return;
    const next = pin + k;
    setPin(next);
    if (next.length >= 4) setTimeout(() => tryUnlock(next), 100);
  };

  const tryUnlock = (code: string) => {
    const hash = storage.getPinHash();
    if (!hash) { setUnlocked(true); router.replace('/home'); return; }
    if (verifyPin(code, hash)) {
      setUnlocked(true);
      router.replace('/home');
    } else {
      const next = attempts + 1;
      setAttempts(next);
      setError(`틀렸습니다 (${next}회)`);
      setShake(true);
      setTimeout(() => { setShake(false); setPin(''); }, 500);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-5 safe-top safe-bottom">
      <div className="w-full max-w-xs flex flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-dark-card border border-dark-border flex items-center justify-center text-3xl">
            \u{1F3C3}
          </div>
          <h1 className="text-xl font-black text-white">RunChain</h1>
          {address && (
            <p className="text-white/30 text-xs font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </p>
          )}
        </div>

        <div className={`flex flex-col items-center gap-6 transition-all ${shake ? 'animate-[wiggle_0.4s_ease]' : ''}`}>
          <div className="flex gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`w-3 h-3 rounded-full transition-all duration-150 ${
                  i < pin.length ? 'bg-primary scale-110' : 'bg-dark-border'
                }`}
              />
            ))}
          </div>
          {error
            ? <p className="text-accent-red text-xs">{error}</p>
            : <p className="text-white/30 text-sm">PIN을 입력하세요</p>
          }
          <div className="grid grid-cols-3 gap-3 w-64">
            {KEYS.map((k, i) => (
              <button
                key={i}
                onClick={() => k !== undefined && k !== '' ? press(k) : undefined}
                disabled={!k && k !== '0'}
                className={`h-16 rounded-2xl text-xl font-bold transition-all duration-100 ${
                  k
                    ? 'glass glass-hover text-white active:scale-95 active:bg-white/10'
                    : 'opacity-0 pointer-events-none'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
