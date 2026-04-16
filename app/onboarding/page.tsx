'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateWallet, restoreWallet, encryptData, hashPin } from '@/lib/wallet';
import { useWalletStore } from '@/store/walletStore';
import { storage } from '@/lib/storage';

type Step = 'welcome' | 'create' | 'mnemonic' | 'verify' | 'pin' | 'done';

export default function OnboardingPage() {
  const router = useRouter();
  const setWallet = useWalletStore((s) => s.setWallet);
  const setUnlocked = useWalletStore((s) => s.setUnlocked);

  const [step, setStep] = useState<Step>('welcome');
  const [importMode, setImportMode] = useState(false);
  const [importInput, setImportInput] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [address, setAddress] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [verifyWords, setVerifyWords] = useState<string[]>(Array(12).fill(''));
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');

  const handleCreate = () => {
    const w = generateWallet();
    setMnemonic(w.mnemonic);
    setAddress(w.address);
    setPrivateKey(w.privateKey);
    setStep('mnemonic');
  };

  const handleImport = () => {
    setError('');
    try {
      const w = restoreWallet(importInput);
      setMnemonic(importInput.trim());
      setAddress(w.address);
      setPrivateKey(w.privateKey);
      setPinStep('enter');
      setStep('pin');
    } catch {
      setError('올바르지 않은 니모닉 구문입니다. 12개 단어를 공백으로 구분해 입력하세요.');
    }
  };

  const handleVerify = () => {
    setError('');
    const words = mnemonic.split(' ');
    const ok = words.every((w, i) => w.trim() === verifyWords[i]?.trim());
    if (ok) {
      setPinStep('enter');
      setStep('pin');
    } else {
      setError('니모닉이 일치하지 않습니다. 다시 확인하세요.');
    }
  };

  const handlePinEnter = () => {
    setError('');
    if (pin.length < 4) { setError('최소 4자리를 입력하세요.'); return; }
    setPinStep('confirm');
  };

  const handlePinConfirm = () => {
    setError('');
    if (pin !== pinConfirm) { setError('PIN이 일치하지 않습니다.'); setPinConfirm(''); return; }
    const encKey = encryptData(privateKey, pin);
    const encMnemonic = encryptData(mnemonic, pin);
    const pinHash = hashPin(pin);
    storage.setPinHash(pinHash);
    setWallet(address, encKey, encMnemonic);
    setUnlocked(true);
    setStep('done');
  };

  const copyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = mnemonic.split(' ');

  return (
    <div className="min-h-screen bg-dark flex flex-col items-center justify-center px-5 py-8 safe-top safe-bottom">
      <div className="w-full max-w-sm">

        {/* Welcome */}
        {step === 'welcome' && (
          <div className="flex flex-col items-center gap-6 page-enter">
            <div className="relative">
              <div className="w-24 h-24 rounded-3xl bg-dark-card border border-dark-border flex items-center justify-center text-5xl">
                \u{1F3C3}
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-dark">
                \u26A1
              </div>
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-black text-white tracking-tight">RunChain</h1>
              <p className="text-white/50 mt-2 text-sm leading-relaxed">
                BNB Chain 위클리 러닝 챌린지<br />달리고, 경쟁하고, 보상받으세요
              </p>
            </div>
            <div className="w-full glass rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">\u{1F512}</span>
                <div>
                  <p className="text-sm font-semibold text-white">완전한 자기 보관</p>
                  <p className="text-xs text-white/40">개인키는 기기에만 저장, 서버 없음</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">\u{1F4CD}</span>
                <div>
                  <p className="text-sm font-semibold text-white">GPS 기반 검증</p>
                  <p className="text-xs text-white/40">실시간 달리기 추적 & 사기 감지</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xl">\u{1F3C6}</span>
                <div>
                  <p className="text-sm font-semibold text-white">자동 상금 분배</p>
                  <p className="text-xs text-white/40">스마트 컨트랙트가 즉시 처리</p>
                </div>
              </div>
            </div>
            <div className="w-full flex flex-col gap-3">
              <button onClick={() => { setImportMode(false); setStep('create'); }} className="w-full py-4 btn-primary text-base rounded-2xl">
                새 지갑 만들기
              </button>
              <button onClick={() => { setImportMode(true); setStep('create'); }} className="w-full py-4 btn-secondary text-base rounded-2xl">
                기존 지갑 가져오기
              </button>
            </div>
          </div>
        )}

        {/* Create / Import */}
        {step === 'create' && (
          <div className="flex flex-col gap-5 page-enter">
            <button onClick={() => setStep('welcome')} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm">
              ← 뒤로
            </button>
            <div>
              <h2 className="text-2xl font-black text-white">
                {importMode ? '지갑 복구' : '지갑 생성'}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {importMode ? '12개 니모닉 단어를 입력하세요' : '새 지갑을 안전하게 생성합니다'}
              </p>
            </div>
            {importMode ? (
              <div className="flex flex-col gap-3">
                <textarea
                  value={importInput}
                  onChange={(e) => { setImportInput(e.target.value); setError(''); }}
                  placeholder="word1 word2 word3 ... word12"
                  rows={4}
                  className="input-dark w-full px-4 py-3 text-sm resize-none"
                />
                {error && <p className="text-accent-red text-xs">{error}</p>}
                <button onClick={handleImport} disabled={!importInput.trim()} className="w-full py-4 btn-primary rounded-2xl">
                  복구하기
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="glass rounded-2xl p-4 border border-accent-gold/20">
                  <p className="text-accent-gold text-sm font-semibold mb-2">\u26A0\uFE0F 중요 안내</p>
                  <p className="text-white/60 text-xs leading-relaxed">
                    다음 화면에서 12개의 니모닉(복구 구문)이 표시됩니다. 이를 안전한 곳에 반드시 기록하세요. 분실 시 지갑을 복구할 수 없습니다.
                  </p>
                </div>
                <button onClick={handleCreate} className="w-full py-4 btn-primary rounded-2xl">
                  지갑 생성 시작
                </button>
              </div>
            )}
          </div>
        )}

        {/* Show Mnemonic */}
        {step === 'mnemonic' && (
          <div className="flex flex-col gap-5 page-enter">
            <div>
              <h2 className="text-2xl font-black text-white">니모닉 백업</h2>
              <p className="text-white/40 text-sm mt-1">이 12개 단어를 순서대로 적어두세요</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {words.map((w, i) => (
                <div key={i} className="glass rounded-xl px-3 py-2 flex items-center gap-2">
                  <span className="text-primary/60 text-xs font-mono w-4">{i + 1}</span>
                  <span className="text-white text-sm font-semibold">{w}</span>
                </div>
              ))}
            </div>
            <button
              onClick={copyMnemonic}
              className="w-full py-3 btn-secondary rounded-xl text-sm flex items-center justify-center gap-2"
            >
              <span>{copied ? '\u2713 복사됨' : '\u{1F4CB} 클립보드 복사'}</span>
            </button>
            <div className="glass rounded-2xl p-4 border border-accent-red/20">
              <p className="text-accent-red text-xs font-semibold">절대로 타인에게 공유하지 마세요</p>
              <p className="text-white/40 text-xs mt-1">스크린샷도 위험합니다. 종이에 적는 것을 권장합니다.</p>
            </div>
            <button onClick={() => setStep('verify')} className="w-full py-4 btn-primary rounded-2xl">
              적었습니다, 확인하기
            </button>
          </div>
        )}

        {/* Verify Mnemonic */}
        {step === 'verify' && (
          <div className="flex flex-col gap-5 page-enter">
            <div>
              <h2 className="text-2xl font-black text-white">니모닉 확인</h2>
              <p className="text-white/40 text-sm mt-1">12개 단어를 순서대로 입력하세요</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className="flex flex-col gap-1">
                  <span className="text-white/30 text-xs font-mono pl-1">{i + 1}</span>
                  <input
                    value={verifyWords[i]}
                    onChange={(e) => {
                      const next = [...verifyWords];
                      next[i] = e.target.value;
                      setVerifyWords(next);
                      setError('');
                    }}
                    className="input-dark w-full px-2 py-2 text-sm text-center"
                    placeholder="word"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-accent-red text-xs text-center">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={verifyWords.some((w) => !w.trim())}
              className="w-full py-4 btn-primary rounded-2xl"
            >
              확인
            </button>
          </div>
        )}

        {/* PIN Setup */}
        {step === 'pin' && (
          <div className="flex flex-col gap-5 page-enter">
            <div>
              <h2 className="text-2xl font-black text-white">
                {pinStep === 'enter' ? 'PIN 설정' : 'PIN 확인'}
              </h2>
              <p className="text-white/40 text-sm mt-1">
                {pinStep === 'enter'
                  ? '앱 잠금 해제에 사용할 PIN을 설정하세요'
                  : '동일한 PIN을 다시 입력하세요'}
              </p>
            </div>
            <PinInput
              value={pinStep === 'enter' ? pin : pinConfirm}
              onChange={pinStep === 'enter' ? setPin : setPinConfirm}
              onSubmit={pinStep === 'enter' ? handlePinEnter : handlePinConfirm}
              error={error}
            />
          </div>
        )}

        {/* Done */}
        {step === 'done' && (
          <div className="flex flex-col items-center gap-6 page-enter">
            <div className="w-24 h-24 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-5xl glow-green">
              \u2713
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-white">설정 완료!</h2>
              <p className="text-white/40 text-sm mt-2">지갑이 생성됐습니다</p>
              <p className="font-mono text-xs text-primary/70 mt-3 bg-dark-card px-3 py-2 rounded-xl">
                {address.slice(0, 6)}...{address.slice(-6)}
              </p>
            </div>
            <button
              onClick={() => router.replace('/home')}
              className="w-full py-4 btn-primary rounded-2xl"
            >
              시작하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PinInput({
  value,
  onChange,
  onSubmit,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  error: string;
}) {
  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','\u232B'];
  const MAX = 8;
  const press = (k: string) => {
    if (k === '\u232B') { onChange(value.slice(0, -1)); return; }
    if (value.length >= MAX) return;
    onChange(value + k);
  };
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {Array.from({ length: Math.max(value.length || 4, value.length) }, (_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-150 ${
              i < value.length ? 'bg-primary scale-110' : 'bg-dark-border'
            }`}
          />
        ))}
      </div>
      {error && <p className="text-accent-red text-xs">{error}</p>}
      <div className="grid grid-cols-3 gap-3 w-64">
        {KEYS.map((k, i) => (
          <button
            key={i}
            onClick={() => k ? press(k) : undefined}
            disabled={!k && k !== '0'}
            className={`h-16 rounded-2xl text-xl font-bold transition-all duration-150 ${
              k
                ? 'glass glass-hover text-white active:scale-95'
                : 'opacity-0 pointer-events-none'
            }`}
          >
            {k}
          </button>
        ))}
      </div>
      <button
        onClick={onSubmit}
        disabled={value.length < 4}
        className="w-64 py-4 btn-primary rounded-2xl"
      >
        확인
      </button>
    </div>
  );
}
