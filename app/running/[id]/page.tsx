'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { useRunStore } from '@/store/runStore';
import { GPSTracker, calculatePace, formatDuration, detectGPSFraud } from '@/lib/gps';
import { HeartRateMonitor } from '@/lib/heartrate';
import { getRunChainContract } from '@/lib/contract';
import { decryptData } from '@/lib/wallet';
import { CONFIG } from '@/lib/config';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RunningPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { address, encryptedPrivateKey, isUnlocked } = useWalletStore();
  const store = useRunStore();

  const trackerRef = useRef<GPSTracker | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hrRef = useRef<HeartRateMonitor | null>(null);
  const startTimeRef = useRef<number>(0);

  const [phase, setPhase] = useState<'ready' | 'running' | 'done' | 'submitting' | 'submitted'>('ready');
  const [gpsError, setGpsError] = useState('');
  const [pin, setPin] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [txHash, setTxHash] = useState('');
  const [fraudWarning, setFraudWarning] = useState('');

  useEffect(() => {
    if (!isUnlocked) router.replace('/lock');
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      trackerRef.current?.stop();
      hrRef.current?.disconnect();
    };
  }, []);

  const startRun = async () => {
    setGpsError('');
    store.reset();
    const tracker = new GPSTracker((points, dist) => {
      store.updateGPS(points, dist);
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      store.setCurrentPace(calculatePace(dist, elapsed));
      const fraud = detectGPSFraud(points);
      if (fraud.suspicious) setFraudWarning(fraud.reason || '');
    });
    trackerRef.current = tracker;
    try {
      await tracker.start();
      const now = Date.now();
      startTimeRef.current = now;
      store.setStartTime(now);
      store.setRunning(true);
      store.setPaused(false);
      setPhase('running');
      timerRef.current = setInterval(() => {
        store.setElapsed(Math.floor((Date.now() - now) / 1000));
      }, 1000);
    } catch {
      setGpsError('GPS 권한이 필요합니다. 브라우저 설정에서 위치를 허용해주세요.');
    }
  };

  const stopRun = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    trackerRef.current?.stop();
    store.setRunning(false);
    setPhase('done');
  };

  const connectHR = async () => {
    if (!HeartRateMonitor.isSupported()) {
      alert('심박수 측정은 HTTPS + Chrome 브라우저에서 지원됩니다.');
      return;
    }
    const monitor = new HeartRateMonitor(
      (bpm) => store.setHeartRate(bpm),
      (connected) => store.setHeartRateConnected(connected)
    );
    hrRef.current = monitor;
    await monitor.connect();
  };

  const handleSubmit = async () => {
    if (!encryptedPrivateKey || !address) return;
    setPhase('submitting');
    setSubmitError('');
    try {
      const pk = decryptData(encryptedPrivateKey, pin);
      if (!pk) { setSubmitError('PIN이 틀렸습니다.'); setPhase('done'); return; }
      const gpsHash = trackerRef.current?.getGPSHash() || ('0x' + '0'.repeat(64));
      const contract = getRunChainContract(pk);
      const tx = await contract.submitRecord(id, address, store.totalDistance, gpsHash);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setPhase('submitted');
    } catch (e: unknown) {
      const err = e as { reason?: string; message?: string };
      setSubmitError(err?.reason || err?.message || '제출 실패');
      setPhase('done');
    }
  };

  return (
    <div className="min-h-screen bg-dark flex flex-col safe-top">
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => router.back()} className="w-9 h-9 glass rounded-xl flex items-center justify-center text-white/60 hover:text-white">
          &#8592;
        </button>
        <span className="text-sm font-semibold text-white/60">챌린지 #{id}</span>
        {phase === 'running' ? (
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-accent-red animate-pulse" />
            <span className="text-accent-red text-xs font-bold">LIVE</span>
          </div>
        ) : <div className="w-9" />}
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-5 pb-10">

        {phase === 'ready' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-sm page-enter">
            <div className="w-32 h-32 rounded-full bg-dark-card border-2 border-dark-border flex items-center justify-center text-6xl">
              &#127939;
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">달리기 준비</h2>
              <p className="text-white/40 text-sm mt-2">GPS를 활성화하고 시작합니다</p>
            </div>
            {gpsError && (
              <div className="glass rounded-xl p-4 border border-accent-red/30 w-full">
                <p className="text-accent-red text-sm">{gpsError}</p>
              </div>
            )}
            <button onClick={startRun} className="w-full py-5 btn-primary rounded-2xl text-lg font-black">
              달리기 시작
            </button>
          </div>
        )}

        {phase === 'running' && (
          <div className="flex-1 flex flex-col items-center w-full max-w-sm">
            {fraudWarning && (
              <div className="w-full glass rounded-xl p-3 border border-accent-red/40 mb-4">
                <p className="text-accent-red text-xs">&#9888; {fraudWarning}</p>
              </div>
            )}
            <div className="flex-1 flex flex-col items-center justify-center">
              <p className="text-white/30 text-sm uppercase tracking-widest mb-2">시간</p>
              <p className="font-mono text-6xl font-black text-white tracking-tight">
                {formatDuration(store.elapsedSeconds)}
              </p>
            </div>
            <div className="w-full grid grid-cols-2 gap-3 mb-6">
              <div className="glass rounded-2xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider">거리</p>
                <p className="font-mono text-3xl font-black text-primary mt-1">
                  {(store.totalDistance / 1000).toFixed(2)}
                </p>
                <p className="text-white/30 text-xs">km</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider">페이스</p>
                <p className="font-mono text-3xl font-black text-white mt-1">{store.currentPace}</p>
                <p className="text-white/30 text-xs">min/km</p>
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider">심박수</p>
                {store.heartRateConnected ? (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-accent-red">&#9829;</span>
                    <p className="font-mono text-2xl font-black text-white">{store.heartRate ?? '--'}</p>
                  </div>
                ) : (
                  <button onClick={connectHR} className="text-xs text-white/30 hover:text-white/60 transition-colors mt-1">
                    BLE 센서 연결
                  </button>
                )}
                {store.heartRateConnected && <p className="text-white/30 text-xs">bpm</p>}
              </div>
              <div className="glass rounded-2xl p-4">
                <p className="text-white/30 text-xs uppercase tracking-wider">GPS 포인트</p>
                <p className="font-mono text-2xl font-black text-white mt-1">{store.gpsPoints.length}</p>
                <p className="text-white/30 text-xs">recorded</p>
              </div>
            </div>
            <button
              onClick={stopRun}
              className="w-full py-5 rounded-2xl bg-accent-red/90 hover:bg-accent-red text-white font-black text-lg transition-all active:scale-95"
            >
              정지
            </button>
          </div>
        )}

        {(phase === 'done' || phase === 'submitting') && (
          <div className="flex-1 flex flex-col items-center w-full max-w-sm page-enter">
            <div className="flex-1 flex flex-col items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-white/40 text-sm">러닝 완료</p>
                <p className="font-mono text-5xl font-black text-primary mt-2">
                  {(store.totalDistance / 1000).toFixed(2)} km
                </p>
                <p className="font-mono text-2xl text-white/60 mt-2">{formatDuration(store.elapsedSeconds)}</p>
                <p className="text-white/40 text-sm mt-1">페이스: {store.currentPace} min/km</p>
              </div>
              <div className="w-full glass rounded-2xl p-4">
                <p className="text-xs text-white/50 mb-2">레코드 제출 (PIN 서명)</p>
                <input
                  type="password"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="PIN"
                  className="input-dark w-full px-4 py-3 text-center text-xl tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                {submitError && <p className="text-accent-red text-xs mt-2">{submitError}</p>}
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleSubmit}
                disabled={!pin || phase === 'submitting'}
                className="w-full py-4 btn-primary rounded-2xl flex items-center justify-center gap-2"
              >
                {phase === 'submitting' ? <><LoadingSpinner size="sm" /> 제출 중...</> : '레코드 제출'}
              </button>
              <button onClick={() => router.push(`/challenges/${id}`)} className="w-full py-3 btn-secondary rounded-2xl text-sm">
                나중에 제출
              </button>
            </div>
          </div>
        )}

        {phase === 'submitted' && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 w-full max-w-sm page-enter">
            <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-4xl glow-green">
              &#10003;
            </div>
            <div className="text-center">
              <h2 className="text-xl font-black text-white">제출 완료!</h2>
              <p className="text-white/40 text-sm mt-2">레코드가 블록체인에 기록됐습니다</p>
              {txHash && (
                <a href={`${CONFIG.EXPLORER_URL}/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline mt-2 inline-block">
                  트랜잭션 보기 &#8594;
                </a>
              )}
            </div>
            <div className="flex flex-col gap-3 w-full">
              <button onClick={() => router.push(`/leaderboard/${id}`)} className="w-full py-4 btn-primary rounded-2xl">
                리더보드 보기
              </button>
              <button onClick={() => router.push('/home')} className="w-full py-3 btn-secondary rounded-2xl text-sm">
                홈으로
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
