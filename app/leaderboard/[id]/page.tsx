'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { getRunChainContract, parseChallengeData, ChallengeData } from '@/lib/contract';
import { formatAddress } from '@/lib/wallet';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';

interface RankEntry {
  rank: number;
  address: string;
  distance: number;
  warnings: number;
  disqualified: boolean;
  rewarded: boolean;
}

export default function LeaderboardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address: myAddress, isUnlocked } = useWalletStore();
  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [rankings, setRankings] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [id, isUnlocked]);

  const load = async () => {
    try {
      const contract = getRunChainContract();
      const raw = await contract.getChallenge(id);
      const c = parseChallengeData(raw, parseInt(id));
      setChallenge(c);
      const parts: string[] = await contract.getParticipants(id);
      const records = await Promise.all(
        parts.map(async (p) => {
          const rec = await contract.getParticipantRecord(id, p);
          return {
            address: p,
            distance: Number(rec[0]),
            warnings: Number(rec[1]),
            disqualified: rec[2],
            rewarded: rec[3],
          };
        })
      );
      const active = records
        .filter((r) => !r.disqualified)
        .sort((a, b) => b.distance - a.distance)
        .map((r, i) => ({ ...r, rank: i + 1 }));
      const dq = records
        .filter((r) => r.disqualified)
        .map((r, i) => ({ ...r, rank: active.length + i + 1 }));
      setRankings([...active, ...dq]);
      setLastUpdated(new Date());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return { icon: '🥇', color: 'text-accent-gold' };
    if (rank === 2) return { icon: '🥈', color: 'text-white/60' };
    if (rank === 3) return { icon: '🥉', color: 'text-amber-600' };
    return { icon: `#${rank}`, color: 'text-white/30' };
  };

  const getPrize = (rank: number, pool: number): string | null => {
    if (rank === 1) return (pool * 0.5).toFixed(1);
    if (rank === 2) return (pool * 0.35).toFixed(1);
    if (rank === 3) return (pool * 0.15).toFixed(1);
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pool = challenge ? parseFloat(challenge.totalPool) : 0;
  const top3 = rankings.slice(0, 3);

  return (
    <div className="min-h-screen bg-dark pb-10">
      <Header title="리더보드" back />
      <div className="mx-auto max-w-lg px-4 pt-4">

        {challenge && (
          <div className="glass rounded-2xl p-4 mb-5">
            <p className="font-bold text-white truncate">{challenge.name}</p>
            <div className="flex items-center gap-4 mt-1">
              <span className="text-white/40 text-sm">{(challenge.targetDistance / 1000).toFixed(1)}km 목표</span>
              <span className="text-primary font-bold text-sm">Pool {challenge.totalPool} USDT</span>
              <span className="text-white/40 text-sm">{challenge.participantCount}명</span>
            </div>
          </div>
        )}

        {/* Podium - top 3 */}
        {top3.length >= 1 && (
          <div className="flex items-end justify-center gap-3 mb-8">
            {top3.length >= 2 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-2xl">
                  {getRankDisplay(2).icon}
                </div>
                <div className="glass rounded-xl p-3 text-center w-24 h-[88px] flex flex-col justify-center">
                  <p className="text-xs text-white/40 truncate">{formatAddress(top3[1]?.address || '')}</p>
                  <p className="text-sm font-bold text-white mt-1">{((top3[1]?.distance || 0) / 1000).toFixed(2)}km</p>
                  <p className="text-xs text-accent-blue font-bold">{getPrize(2, pool)} U</p>
                </div>
              </div>
            )}
            <div className="flex flex-col items-center gap-2 -mt-4">
              <div className="w-14 h-14 rounded-full bg-accent-gold/20 border-2 border-accent-gold flex items-center justify-center text-3xl glow-gold">
                {getRankDisplay(1).icon}
              </div>
              <div className="glass rounded-xl p-3 text-center w-28 h-24 flex flex-col justify-center border border-accent-gold/30">
                <p className="text-xs text-white/40 truncate">{formatAddress(top3[0]?.address || '')}</p>
                <p className="text-base font-black text-white mt-1">{((top3[0]?.distance || 0) / 1000).toFixed(2)}km</p>
                <p className="text-sm text-accent-gold font-black">{getPrize(1, pool)} USDT</p>
              </div>
            </div>
            {top3.length >= 3 && (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full glass border border-white/10 flex items-center justify-center text-2xl">
                  {getRankDisplay(3).icon}
                </div>
                <div className="glass rounded-xl p-3 text-center w-24 h-[88px] flex flex-col justify-center">
                  <p className="text-xs text-white/40 truncate">{formatAddress(top3[2]?.address || '')}</p>
                  <p className="text-sm font-bold text-white mt-1">{((top3[2]?.distance || 0) / 1000).toFixed(2)}km</p>
                  <p className="text-xs text-accent-purple font-bold">{getPrize(3, pool)} U</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Full List */}
        <div className="flex flex-col gap-2">
          {rankings.map((entry) => {
            const isMe = entry.address.toLowerCase() === myAddress?.toLowerCase();
            const prize = getPrize(entry.rank, pool);
            const { icon, color } = getRankDisplay(entry.rank);
            return (
              <div
                key={entry.address}
                className={`glass rounded-2xl p-4 flex items-center gap-3 ${
                  isMe ? 'border border-primary/40 glow-green' : ''
                } ${entry.disqualified ? 'opacity-50' : ''}`}
              >
                <span className={`w-8 text-center font-black text-base flex-shrink-0 ${color}`}>{icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={`font-mono text-sm truncate ${isMe ? 'text-primary font-bold' : 'text-white/70'}`}>
                      {formatAddress(entry.address)}
                    </p>
                    {isMe && <span className="text-xs text-primary font-bold flex-shrink-0">ME</span>}
                    {entry.disqualified && <span className="text-xs text-accent-red font-bold flex-shrink-0">실격</span>}
                    {entry.warnings > 0 && !entry.disqualified && (
                      <span className="text-xs text-accent-gold flex-shrink-0">⚠ {entry.warnings}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-dark-border rounded-full">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent-blue rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (entry.distance / (challenge?.targetDistance || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-white/40 flex-shrink-0">{(entry.distance / 1000).toFixed(2)}km</span>
                  </div>
                </div>
                {prize && (
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-accent-gold">{prize}</p>
                    <p className="text-xs text-white/30">USDT</p>
                  </div>
                )}
              </div>
            );
          })}
          {rankings.length === 0 && (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-4xl mb-3">🏁</p>
              <p className="text-white/40 text-sm">아직 레코드가 없습니다</p>
            </div>
          )}
        </div>

        {lastUpdated && (
          <p className="text-center text-white/20 text-xs mt-5">
            마지막 업데이트: {lastUpdated.toLocaleTimeString('ko-KR')} · 30초마다 자동 새로고침
          </p>
        )}
      </div>
    </div>
  );
}
