'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { useChallengeStore } from '@/store/challengeStore';
import { fetchAllChallenges, ChallengeData } from '@/lib/contract';
import BottomNav from '@/components/BottomNav';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';

type Filter = 'all' | 'active' | 'upcoming' | 'ended';

export default function ChallengesPage() {
  const router = useRouter();
  const { isUnlocked } = useWalletStore();
  const { challenges, setChallenges, loading, setLoading } = useChallengeStore();
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    load();
  }, [isUnlocked]);

  const load = async () => {
    setLoading(true);
    try {
      const list = await fetchAllChallenges();
      setChallenges(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const now = new Date();
  const filtered = challenges.filter((c) => {
    if (filter === 'active') return c.active && !c.finalized;
    if (filter === 'upcoming') return !c.active && c.startTime > now;
    if (filter === 'ended') return c.finalized;
    return true;
  });

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'active', label: '진행 중' },
    { key: 'upcoming', label: '예정' },
    { key: 'ended', label: '종료' },
  ];

  return (
    <div className="min-h-screen bg-dark pb-24">
      <Header
        title="챌린지"
        right={
          <Link href="/challenges/create" className="px-3 py-1.5 btn-primary rounded-xl text-xs">
            + 만들기
          </Link>
        }
      />
      <div className="mx-auto max-w-lg px-4 pt-4">
        {/* Filter Tabs */}
        <div className="flex gap-2 mb-5 no-scrollbar overflow-x-auto pb-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                filter === key
                  ? 'bg-primary text-dark'
                  : 'glass text-white/50 hover:text-white/80'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">🏁</p>
            <p className="text-white/50 text-sm">챌린지가 없습니다</p>
            <Link href="/challenges/create" className="inline-block mt-4 px-6 py-2 btn-primary rounded-xl text-sm">
              첫 챌린지 만들기
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filtered.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

function ChallengeCard({ challenge: c }: { challenge: ChallengeData }) {
  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((c.endTime.getTime() - now.getTime()) / 86400000));
  const statusColor = c.finalized ? 'text-white/30' : c.active ? 'text-primary' : 'text-accent-gold';
  const statusText = c.finalized ? '종료' : c.active ? '진행 중' : '예정';
  return (
    <Link href={`/challenges/${c.id}`}>
      <div className="glass rounded-2xl p-4 glass-hover transition-all active:scale-[0.98]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-semibold ${statusColor}`}>{statusText}</span>
              {!c.finalized && <span className="text-xs text-white/30">· {daysLeft}일 남음</span>}
            </div>
            <p className="font-bold text-white text-base truncate">{c.name}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="text-xs text-white/40">🎯 {(c.targetDistance / 1000).toFixed(1)}km</span>
              <span className="text-xs text-white/40">👥 {c.participantCount}명</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="text-base font-black text-primary">{c.entryFee} USDT</span>
            <span className="text-xs text-white/30">Pool {parseFloat(c.totalPool).toFixed(0)} USDT</span>
          </div>
        </div>
        <div className="mt-3 h-1 bg-dark-border rounded-full">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-blue transition-all"
            style={{ width: `${Math.min(100, (c.participantCount / 20) * 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
}
