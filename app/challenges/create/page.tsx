'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { decryptData } from '@/lib/wallet';
import { getRunChainContract, getUsdtContract } from '@/lib/contract';
import { ENTRY_FEE_OPTIONS, CONFIG } from '@/lib/config';
import { storage } from '@/lib/storage';
import { ethers } from 'ethers';
import Header from '@/components/Header';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateChallengePage() {
  const router = useRouter();
  const { encryptedPrivateKey, address } = useWalletStore();

  const [name, setName] = useState('');
  const [distanceKm, setDistanceKm] = useState('5');
  const [entryFee, setEntryFee] = useState(5);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pin, setPin] = useState('');
  const [step, setStep] = useState<'form' | 'pin' | 'loading' | 'done'>('form');
  const [error, setError] = useState('');
  const [txHash, setTxHash] = useState('');

  const validateForm = () => {
    if (!name.trim()) return '챌린지 이름을 입력하세요.';
    if (!distanceKm || parseFloat(distanceKm) <= 0) return '목표 거리를 입력하세요.';
    if (!startDate || !endDate) return '기간을 설정하세요.';
    if (new Date(startDate) >= new Date(endDate)) return '종료일이 시작일보다 늦어야 합니다.';
    return '';
  };

  const handleSubmitForm = () => {
    const err = validateForm();
    if (err) { setError(err); return; }
    setError('');
    setStep('pin');
  };

  const handleCreate = async () => {
    if (!encryptedPrivateKey) return;
    setStep('loading');
    setError('');
    try {
      const pk = decryptData(encryptedPrivateKey, pin);
      if (!pk) { setError('PIN이 틀렸습니다.'); setStep('pin'); return; }

      const distanceM = Math.round(parseFloat(distanceKm) * 1000);
      const feeWei = ethers.parseUnits(entryFee.toString(), 18);
      const startTs = Math.floor(new Date(startDate).getTime() / 1000);
      const endTs = Math.floor(new Date(endDate).getTime() / 1000);

      if (CONFIG.USDT_ADDRESS) {
        const usdt = getUsdtContract(pk);
        const allowance = await usdt.allowance(address, CONFIG.CONTRACT_ADDRESS);
        if (allowance < feeWei) {
          const approveTx = await usdt.approve(CONFIG.CONTRACT_ADDRESS, ethers.MaxUint256);
          await approveTx.wait();
        }
      }

      const contract = getRunChainContract(pk);
      const tx = await contract.createChallenge(name.trim(), distanceM, feeWei, startTs, endTs);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep('done');
    } catch (e: any) {
      console.error(e);
      setError(e?.reason || e?.message || '트랜잭션 실패');
      setStep('pin');
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-dark">
      <Header title="챌린지 만들기" back />
      <div className="mx-auto max-w-lg px-4 py-5">

        {step === 'form' && (
          <div className="flex flex-col gap-5 page-enter">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">챌린지 이름</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="예: 서울 5km 위클리"
                className="input-dark w-full px-4 py-3"
                maxLength={50}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">목표 거리 (km)</label>
              <div className="grid grid-cols-4 gap-2">
                {['3', '5', '10', '21'].map((d) => (
                  <button
                    key={d}
                    onClick={() => setDistanceKm(d)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      distanceKm === d ? 'bg-primary text-dark' : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    {d}km
                  </button>
                ))}
              </div>
              <input
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                type="number"
                placeholder="직접 입력 (km)"
                className="input-dark w-full px-4 py-3 mt-1"
                min="0.1"
                step="0.1"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">참가비 (USDT)</label>
              <div className="grid grid-cols-4 gap-2">
                {ENTRY_FEE_OPTIONS.map((f) => (
                  <button
                    key={f}
                    onClick={() => setEntryFee(f)}
                    className={`py-3 rounded-xl text-sm font-bold transition-all ${
                      entryFee === f ? 'bg-primary text-dark' : 'glass text-white/60 hover:text-white'
                    }`}
                  >
                    ${f}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">시작일</label>
                <input
                  type="date"
                  value={startDate}
                  min={today}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">종료일</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="input-dark w-full px-4 py-3 text-sm"
                />
              </div>
            </div>

            <div className="glass rounded-2xl p-4 border border-primary/20">
              <p className="text-xs text-white/50 font-semibold mb-2">상금 분배</p>
              <div className="flex gap-3">
                {[['🥇', '50%', '1등'], ['🥈', '35%', '2등'], ['🥉', '15%', '3등']].map(([icon, pct, rank]) => (
                  <div key={rank} className="flex-1 text-center">
                    <p className="text-lg">{icon}</p>
                    <p className="text-primary text-sm font-bold">{pct}</p>
                    <p className="text-white/30 text-xs">{rank}</p>
                  </div>
                ))}
              </div>
            </div>

            {error && <p className="text-accent-red text-sm">{error}</p>}

            <button onClick={handleSubmitForm} className="w-full py-4 btn-primary rounded-2xl">
              챌린지 생성하기
            </button>
          </div>
        )}

        {step === 'pin' && (
          <div className="flex flex-col gap-5 page-enter">
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-white/50 mb-1">챌린지 정보</p>
              <p className="font-bold text-white">{name}</p>
              <p className="text-sm text-white/50 mt-1">{distanceKm}km · ${entryFee} USDT · {startDate} ~ {endDate}</p>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">PIN 입력 (서명 확인)</label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="PIN"
                className="input-dark w-full px-4 py-3 text-center text-xl tracking-widest"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            {error && <p className="text-accent-red text-sm">{error}</p>}
            <button onClick={handleCreate} disabled={!pin} className="w-full py-4 btn-primary rounded-2xl">
              트랜잭션 서명
            </button>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center gap-5 py-20 page-enter">
            <LoadingSpinner size="lg" />
            <p className="text-white/50 text-sm">블록체인에 기록 중...</p>
            <p className="text-white/30 text-xs">잠시만 기다려주세요</p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center gap-6 py-10 page-enter">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-4xl glow-green">
              ✓
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">챌린지 생성 완료!</h2>
              <p className="text-white/40 text-sm mt-2">"{name}" 챌린지가 만들어졌습니다</p>
              {txHash && (
                <a
                  href={`${CONFIG.EXPLORER_URL}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary/70 hover:text-primary mt-2 inline-block"
                >
                  트랜잭션 보기 →
                </a>
              )}
            </div>
            <button onClick={() => router.push('/challenges')} className="w-full py-4 btn-primary rounded-2xl">
              챌린지 목록으로
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
