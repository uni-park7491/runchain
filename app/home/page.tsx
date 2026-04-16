'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useWalletStore } from '@/store/walletStore';
import { useChallengeStore } from '@/store/challengeStore';
import { fetchAllChallenges } from '@/lib/contract';
import { getProvider, formatAddress } from '@/lib/wallet';
import { CONFIG } from '@/lib/config';
import { ethers } from 'ethers';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { address, isUnlocked, usdtBalance, bnbBalance, setBalances } = useWalletStore();
  const { challenges, setChallenges, loading, setLoading } = useChallengeStore();
  const [greeting, setGreeting] = useState('');

  const loadBalances = async () => {
    if (!address) return;
    try {
      const provider = getProvider();
      const bnb = await provider.getBalance(address);
      let usdt = '0.00';
      if (CONFIG.USDT_ADDRESS) {
        const { getUsdtContract } = await import('@/lib/contract');
        const c = getUsdtContract();
        const raw = await c.balanceOf(address);
        usdt = parseFloat(ethers.formatUnits(raw, 18)).toFixed(2);
      }
      setBalances(usdt, parseFloat(ethers.formatEther(bnb)).toFixed(4));
    } catch (e) {
      console.error('Balance load failed:', e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [cList] = await Promise.all([fetchAllChallenges(), loadBalances()]);
      setChallenges(cList);
    } catch (e) {
      console.error('Data load failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    const h = new Date().getHours();
    setGreeting(h < 12 ? '좋은 아침이에요' : h < 18 ? '좋은 오후에요' : '좋은 저녁이에요');
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUnlocked]);

  const activeCount = challenges.filter((c) => c.active && !c.finalized).length;
  const now = new Date();
  const upcoming = challenges.filter((c) => !c.finalized && c.endTime > now).slice(0, 3);

  return (
    <div className="min-h-screen bg-dark pb-24">
      <div className="safe-top" />
      <div className="mx-auto max-w-lg px-4 pt-6">

        {/* Greeting */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-white/40 text-sm">{greeting}</p>
            <h1 className="text-2xl font-black text-white mt-0.5">RunChain</h1>
            {address && (
              <button onClick={() => router.push('/wallet')} className="mt-1 text-xs font-mono text-primary/70 hover:text-primary transition-colors">
                {formatAddress(address)}
              </button>
            )}
          </div>
          <Link href="/wallet" className="w-10 h-10 glass rounded-xl flex items-center justify-center text-lg glass-hover">
            {'\u{1F464}'}
          </Link>
        </div>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider">USDT</p>
            <p className="font-mono text-2xl font-bold text-white mt-1">{usdtBalance}</p>
            <p className="text-white/30 text-xs mt-0.5">BEP-20</p>
          </div>
          <div className="glass rounded-2xl p-4">
            <p className="text-white/40 text-xs uppercase tracking-wider">BNB</p>
            <p className="font-mono text-2xl font-bold text-white mt-1">{bnbBalance}</p>
            <p className="text-white/30 text-xs mt-0.5">Gas fee</p>
          </div>
        </div>

        {/* Quick Action */}
        <GlassCard glow="green" className="mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center text-3xl">
              {'\u{1F3C3}'}
            </div>
            <div className="flex-1">
              <p className="text-white font-bold">오늘의 러닝</p>
              <p className="text-white/40 text-sm">챔린지에 참여하고 달려보세요</p>
            </div>
            <Link href="/challenges" className="px-4 py-2 btn-primary rounded-xl text-sm">시작</Link>
          </div>
        </GlassCard>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-primary text-xl font-black">{activeCount}</p>
            <p className="text-white/40 text-xs mt-0.5">활성 챌린지</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <p className="text-accent-gold text-xl font-black">{challenges.length}</p>
            <p className="text-white/40 text-xs mt-0.5">전체</p>
          </div>
          <div className="glass rounded-2xl p-3 text-center">
            <Link href="/treasury" className="block">
              <p className="text-accent-blue text-xl font-black">{'\u{1F3DB}'}</p>
              <p className="text-white/40 text-xs mt-0.5">트레져리</p>
            </Link>
          </div>
        </div>

        {/* Challenges */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white">진행 중인 챌린지</h2>
          <Link href="/challenges" className="text-primary text-sm font-semibold">전체 보기</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><LoadingSpinner size="md" /></div>
        ) : upcoming.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-4xl mb-3">{'\u{1F3C3}'}</p>
            <p className="text-white/60 text-sm font-semibold">진행 중인 챌린지 없음</p>
            <p className="text-white/30 text-xs mt-1">새 챌린지를 만들어보세요</p>
            <Link href="/challenges/create" className="inline-block mt-4 px-6 py-2 btn-primary rounded-xl text-sm">만들기</Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((c) => {
              const daysLeft = Math.max(0, Math.ceil((c.endTime.getTime() - Date.now()) / 86400000));
              return (
                <Link key={c.id} href={`/challenges/${c.id}`}>
                  <div className="glass rounded-2xl p-4 glass-hover transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{c.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-white/40">{(c.targetDistance / 1000).toFixed(1)}km 목표</span>
                          <span className="text-xs text-white/40">{c.participantCount}명 참여</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 ml-3">
                        <span className="text-sm font-bold text-primary">{c.entryFee} USDT</span>
                        <span className="text-xs text-white/30">{daysLeft}일 남음</span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-dark-border rounded-full">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, (c.participantCount / 10) * 100)}%` }} />
                      </div>
                      <span className="text-xs text-white/30">Pool: {c.totalPool} USDT</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
}
