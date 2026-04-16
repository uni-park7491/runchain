'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { getRunChainContract } from '@/lib/contract';
import { ethers } from 'ethers';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { PRIZE_DISTRIBUTION } from '@/lib/config';

export default function TreasuryPage() {
  const router = useRouter();
  const { isUnlocked } = useWalletStore();
  const [balance, setBalance] = useState('0.00');
  const [loading, setLoading] = useState(true);
  const [totalChallenges, setTotalChallenges] = useState(0);

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    load();
  }, [isUnlocked]);

  const load = async () => {
    setLoading(true);
    try {
      const contract = getRunChainContract();
      const [bal, count] = await Promise.all([
        contract.treasuryBalance(),
        contract.challengeCount(),
      ]);
      setBalance(parseFloat(ethers.formatUnits(bal, 18)).toFixed(2));
      setTotalChallenges(Number(count));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const balanceNum = parseFloat(balance);
  const bonusUnlocked = balanceNum >= 20;
  const progressPct = Math.min(100, (balanceNum / 20) * 100);

  return (
    <div className="min-h-screen bg-dark pb-24">
      <Header title="트레저리" right={
        <button onClick={load} disabled={loading} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70">
          {loading ? <LoadingSpinner size="sm" /> : '&#8635;'}
        </button>
      } />

      <div className="mx-auto max-w-lg px-4 pt-5">
        {loading ? (
          <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
        ) : (
          <>
            {/* Main Balance */}
            <div className="glass rounded-3xl p-6 mb-5 text-center glow-blue border border-accent-blue/20">
              <p className="text-white/40 text-sm uppercase tracking-widest mb-2">트레져리 잔액</p>
              <p className="font-mono text-5xl font-black text-white">{balance}</p>
              <p className="text-white/40 text-sm mt-1">USDT</p>
              <div className="mt-4 flex items-center justify-center gap-6">
                <div className="text-center">
                  <p className="font-bold text-lg text-white">{totalChallenges}</p>
                  <p className="text-white/30 text-xs">전체 챌린지</p>
                </div>
                <div className="w-px h-8 bg-dark-border" />
                <div className="text-center">
                  <p className={`font-bold text-lg ${bonusUnlocked ? 'text-primary' : 'text-white/40'}`}>
                    {bonusUnlocked ? '활성화' : '비활성'}
                  </p>
                  <p className="text-white/30 text-xs">월간 보너스</p>
                </div>
              </div>
            </div>

            {/* Monthly Bonus Progress */}
            <GlassCard className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white">월간 보너스 (스타 챸피언)
                </p>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                  bonusUnlocked
                    ? 'bg-primary/20 text-primary'
                    : 'bg-white/10 text-white/30'
                }`}>
                  {bonusUnlocked ? '올주학' : '잊기'}
                </span>
              </div>
              <div className="h-2 bg-dark-border rounded-full mb-3">
                <div
                  className={`h-full rounded-full transition-all ${
                    bonusUnlocked
                      ? 'bg-gradient-to-r from-primary to-accent-blue'
                      : 'bg-white/20'
                  }`}
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/40">{balance} USDT</span>
                <span className="text-white/40">20 USDT 필요</span>
              </div>
              <p className="text-white/30 text-xs mt-3">
                트레져리가 20 USDT 이상이 되면 4~10위 러너들에게 매월 0.5 USDT 보너스 지급
              </p>
            </GlassCard>

            {/* Prize Rules */}
            <GlassCard className="mb-5">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-4">상금 구조</p>
              <div className="flex flex-col gap-3">
                {['🥇', '🥈', '🥉'].map((icon, i) => {
                  const rank = ['1st', '2nd', '3rd'][i];
                  const pct = PRIZE_DISTRIBUTION[rank as keyof typeof PRIZE_DISTRIBUTION];
                  return (
                    <div key={rank} className="flex items-center gap-3">
                      <span className="text-xl w-8">{icon}</span>
                      <div className="flex-1">
                        <div className="h-2 bg-dark-border rounded-full">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent-blue"
                            style={{ width: pct }}
                          />
                        </div>
                      </div>
                      <span className="text-primary font-bold text-sm w-12 text-right">{pct}</span>
                    </div>
                  );
                })}
                <div className="flex items-center gap-3">
                  <span className="text-xl w-8">🏦</span>
                  <div className="flex-1">
                    <p className="text-white/40 text-xs">4위 이하 실격자 참가비 트레져리로</p>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Decentralization Info */}
            <GlassCard>
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-3">탈중앙화</p>
              <div className="flex flex-col gap-3">
                {[
                  { icon: '🔒', text: '컨트랙트에 인출 함수 없음 — 누구도 자금 가져갈 수 없음' },
                  { icon: '🤖', text: 'Verifier가 마감일에 자동으로 분배 트리거' },
                  { icon: '🔍', text: '모든 제요 전수 BSCScan에서 확인 가능' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0">{icon}</span>
                    <p className="text-white/50 text-sm">{text}</p>
                  </div>
                ))}
              </div>
            </GlassCard>
          </>
        )}
      </div>
      <BottomNav />
    </div>
  );
}
