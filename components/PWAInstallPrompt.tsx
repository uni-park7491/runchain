'use client';
import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (storage.isPwaDismissed()) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') storage.setPwaDismissed();
    setShow(false);
  };

  const handleDismiss = () => {
    storage.setPwaDismissed();
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-sm animate-slide-up">
      <div className="glass rounded-2xl p-4 border border-primary/30 glow-green">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-xl flex-shrink-0">
            {'\u{1F4F2}'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">RunChain \uc571 \uc124\uce58</p>
            <p className="text-xs text-white/50 mt-0.5">\ud648 \ud654\uba74\uc5d0 \ucd94\uac00\ud574\uc11c \uc571\ucc98\ub7fc \uc0ac\uc6a9\ud558\uc138\uc694</p>
          </div>
          <button onClick={handleDismiss} className="text-white/30 hover:text-white/60 transition-colors p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div className="flex gap-2 mt-3">
          <button onClick={handleDismiss} className="flex-1 py-2 text-sm font-semibold text-white/40 hover:text-white/60 transition-colors">
            \ub098\uc911\uc5d0
          </button>
          <button onClick={handleInstall} className="flex-1 py-2 btn-primary text-sm">
            \uc124\uce58\ud558\uae30
          </button>
        </div>
      </div>
    </div>
  );
}
