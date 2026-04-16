'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { getRunChainContract, getUsdtContract, parseChallengeData, ChallengeData, ParticipantRecord } from '@/lib/contract';
import { decryptData, formatAddress } from '@/lib/wallet';
import { CONFIG } from '@/lib/config';
import { ethers } from 'ethers';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';

export default function ChallengeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, encryptedPrivateKey, isUnlocked } = useWalletStore();

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [participants, setParticipants] = useState<string[]>([]);
  const [myRecord, setMyRecord] = useState<ParticipantRecord | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState<'join' | 'withdraw' | null>(null);
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    loadChallenge();
  }, [id, isUnlocked]);

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const contract = getRunChainContract();
      const raw = await contract.getChallenge(id);
      const c = parseChallengeData(raw, parseInt(id));
      setChallenge(c);
      const parts = await contract.getParticipants(id);
      setParticipants(parts);
      if (address) {
        const joined = await contract.isParticipant(id, address);
        setIsJoined(joined);
        if (joined) {
          const rec = await contract.getParticipantRecord(id, address);
          setMyRecord({
            distance: Number(rec[0]),
            warnings: Number(rec[1]),
            disqualified: rec[2],
            rewarded: rec[3],
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!encryptedPrivateKey || !address) return;
    setActionLoading(true);
    setError('');
    try {
      const pk = decryptData(encryptedPrivateKey, pin);
      if (!pk) { setError('PIN이 틀렸습니다.'); setActionLoading(false); return; }
      if (CONFIG.USDT_ADDRESS && challenge) {
        const usdt = getUsdtContract(pk);
        const feeWei = ethers.parseUnits(challenge.entryFee, 18);
        const allowance = await usdt.allowance(address, CONFIG.CONTRACT_ADDRESS);
        if (allowance < feeWei) {
          const appTx = await usdt.approve(CONFIG.CONTRACT_ADDRESS, ethers.MaxUint256);
          await appTx.wait();
        }
      }
      const contract = getRunChainContract(pk);
      const tx = await contract.joinChallenge(id);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setShowPin(null);
      setIsJoined(true);
      await loadChallenge();
    } catch (e: any) {
      setError(e?.reason || e?.message || '참가 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!encryptedPrivateKey) return;
    setActionLoading(true);
    setError('');
    try {
      const pk = decryptData(encryptedPrivateKey, pin);
      if (!pk) { setError('PIN이 틀렸습니다.'); setActionLoading(false); return; }
      const contract = getRunChainContract(pk);
      const tx = await contract.withdrawFromChallenge(id);
      await tx.wait();
      setShowPin(null);
      setIsJoined(false);
      await loadChallenge();
    } catch (e: any) {
      setError(e?.reason || e?.message || '탈퇴 실패');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <p className="text-white/40">챌린지를 찾을 수 없습니다</p>
      </div>
    );
  }

  const now = new Date();
  const daysLeft = Math.max(0, Math.ceil((challenge.endTime.getTime() - now.getTime()) / 86400000));
  const statusText = challenge.finalized ? '종료됨' : challenge.active ? '진행 중' : '예정';
  const statusColor = challenge.finalized ? 'bg-white/10 text-white/30' : challenge.active ? 'bg-primary/20 text-primary' : 'bg-accent-gold/20 text-accent-gold';

  return (
    <div className="min-h-screen bg-dark pb-10">
      <Header title={challenge.name} back />
      <div className="mx-auto max-w-lg px-4 py-5">

        {txHash && (
          <div className="glass rounded-xl p-3 border border-primary/30 mb-4 flex items-center gap-2">
            <span className="text-primary text-sm">✓</span>
            <a href={`${CONFIG.EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-primary text-xs hover:underline">
              트랜잭션 확인 →
            </a>
          </div>
        )}

        {/* Challenge Info */}
        <div className="glass rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${statusColor}`}>{statusText}</span>
            {!challenge.finalized && <span className="text-xs text-white/30">{daysLeft}일 남음</span>}
          </div>
          <h2 className="text-xl font-black text-white mb-4">{challenge.name}</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '목표 거리', value: `${(challenge.targetDistance / 1000).toFixed(1)}km` },
              { label: '참가비', value: `${challenge.entryFee} USDT` },
              { label: '총 상금', value: `${parseFloat(challenge.totalPool).toFixed(0)} USDT` },
              { label: '참가자', value: `${challenge.participantCount}명` },
            ].map(({ label, value }) => (
              <div key={label} className="bg-dark-muted/50 rounded-xl p-3">
                <p className="text-xs text-white/40 mb-0.5">{label}</p>
                <p className="font-bold text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/30">
            <span>주최: {formatAddress(challenge.creator)}</span>
          </div>
        </div>

        {/* My Status */}
        {isJoined && myRecord && (
          <div className="glass rounded-2xl p-4 mb-4 border border-primary/20">
            <p className="text-xs text-primary font-semibold mb-2">내 현황</p>
            <div className="flex items-center gap-4">
              <div>
                <p className="text-white/40 text-xs">달린 거리</p>
                <p className="text-white font-bold">{(myRecord.distance / 1000).toFixed(2)}km</p>
              </div>
              <div>
                <p className="text-white/40 text-xs">경고</p>
                <p className={`font-bold ${myRecord.warnings > 0 ? 'text-accent-red' : 'text-white'}`}>
                  {myRecord.warnings} / 3
                </p>
              </div>
              {myRecord.disqualified && (
                <span className="px-2 py-0.5 bg-accent-red/20 text-accent-red rounded-full text-xs font-bold">실격</span>
              )}
              {myRecord.rewarded && (
                <span className="px-2 py-0.5 bg-accent-gold/20 text-accent-gold rounded-full text-xs font-bold">보상 완료</span>
              )}
            </div>
          </div>
        )}

        {/* Prize Distribution */}
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-xs text-white/50 font-semibold mb-3 uppercase tracking-wider">상금 분배</p>
          <div className="flex gap-3">
            {[['🥇', '1등', '50%'], ['🥈', '2등', '35%'], ['🥉', '3등', '15%']].map(([icon, rank, pct]) => {
              const prize = (parseFloat(challenge.totalPool) * parseFloat(pct) / 100).toFixed(1);
              return (
                <div key={rank} className="flex-1 bg-dark-muted/50 rounded-xl p-3 text-center">
                  <p className="text-lg">{icon}</p>
                  <p className="text-xs text-white/40 mt-0.5">{rank}</p>
                  <p className="text-sm font-bold text-white">{prize}</p>
                  <p className="text-xs text-white/30">USDT</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/50 font-semibold uppercase tracking-wider">참가자 {participants.length}명</p>
              <Link href={`/leaderboard/${id}`} className="text-primary text-xs font-semibold">리더보드 →</Link>
            </div>
            <div className="flex flex-col gap-2">
              {participants.slice(0, 5).map((p, i) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="text-white/20 text-xs font-mono w-4">{i + 1}</span>
                  <span className="font-mono text-xs text-white/60">{formatAddress(p)}</span>
                  {p.toLowerCase() === address?.toLowerCase() && (
                    <span className="ml-auto text-xs text-primary font-bold">나</span>
                  )}
                </div>
              ))}
              {participants.length > 5 && (
                <p className="text-xs text-white/30 text-center mt-1">+{participants.length - 5}명 더</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!challenge.finalized && (
          <div className="flex flex-col gap-3">
            {isJoined ? (
              <>
                <Link href={`/running/${id}`} className="block">
                  <button className="w-full py-4 btn-primary rounded-2xl text-base">🏃 달리기 시작</button>
                </Link>
                {!challenge.active && (
                  <button onClick={() => { setShowPin('withdraw'); setError(''); }} className="w-full py-3 btn-secondary rounded-2xl text-sm">
                    참가 취소 (챌린지 시작 전만 가능)
                  </button>
                )}
              </>
            ) : (
              <button onClick={() => { setShowPin('join'); setError(''); }} className="w-full py-4 btn-primary rounded-2xl text-base">
                참가하기 ({challenge.entryFee} USDT)
              </button>
            )}
          </div>
        )}

        {/* PIN Modal */}
        {showPin && (
          <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
            <div className="w-full max-w-sm glass rounded-2xl p-5 flex flex-col gap-4">
              <h3 className="font-bold text-white">
                {showPin === 'join' ? `참가 확인 (${challenge.entryFee} USDT)` : '참가 취소'}
              </h3>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN 입력"
                className="input-dark w-full px-4 py-3 text-center text-xl tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && (showPin === 'join' ? handleJoin() : handleWithdraw())}
                autoFocus
              />
              {error && <p className="text-accent-red text-xs">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => { setShowPin(null); setPin(''); setError(''); }} className="flex-1 py-3 btn-secondary rounded-xl">
                  취소
                </button>
                <button
                  onClick={showPin === 'join' ? handleJoin : handleWithdraw}
                  disabled={!pin || actionLoading}
                  className="flex-1 py-3 btn-primary rounded-xl"
                >
                  {actionLoading ? '처리 중...' : '확인'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
