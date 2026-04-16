'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWalletStore } from '@/store/walletStore';
import { decryptData, formatAddress, getProvider } from '@/lib/wallet';
import { getUsdtContract } from '@/lib/contract';
import { storage } from '@/lib/storage';
import { CONFIG } from '@/lib/config';
import { ethers } from 'ethers';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import GlassCard from '@/components/GlassCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function WalletPage() {
  const router = useRouter();
  const { address, encryptedPrivateKey, encryptedMnemonic, isUnlocked, usdtBalance, bnbBalance, setBalances } = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [mnemonic, setMnemonic] = useState('');
  const [showPinModal, setShowPinModal] = useState<'mnemonic' | 'export' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isUnlocked) { router.replace('/lock'); return; }
    refreshBalances();
  }, [isUnlocked]);

  const refreshBalances = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const provider = getProvider();
      const bnb = await provider.getBalance(address);
      let usdt = '0.00';
      if (CONFIG.USDT_ADDRESS) {
        const c = getUsdtContract();
        const raw = await c.balanceOf(address);
        usdt = parseFloat(ethers.formatUnits(raw, 18)).toFixed(2);
      }
      setBalances(usdt, parseFloat(ethers.formatEther(bnb)).toFixed(4));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRevealMnemonic = () => {
    if (!encryptedMnemonic) return;
    const hash = storage.getPinHash();
    if (!hash) { setMnemonic(decryptData(encryptedMnemonic, '')); setShowMnemonic(true); setShowPinModal(null); return; }
    const { verifyPin } = require('@/lib/wallet');
    if (!verifyPin(pin, hash)) { setPinError('PIN이 틀렸습니다.'); return; }
    const m = decryptData(encryptedMnemonic, pin);
    if (!m) { setPinError('PIN이 틀렸습니다.'); return; }
    setMnemonic(m);
    setShowMnemonic(true);
    setShowPinModal(null);
    setPin('');
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const words = mnemonic.split(' ').filter(Boolean);

  return (
    <div className="min-h-screen bg-dark pb-24">
      <Header title="지갑" right={
        <button onClick={refreshBalances} disabled={loading} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/70">
          {loading ? <LoadingSpinner size="sm" /> : '&#8635;'}
        </button>
      } />
      <div className="mx-auto max-w-lg px-4 pt-5">

        {/* Address */}
        <GlassCard className="mb-4" glow="green">
          <p className="text-xs text-white/40 uppercase tracking-wider mb-2">내 지갑 주소</p>
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm text-white flex-1 break-all">{address}</p>
            <button onClick={() => copy(address || '')} className="flex-shrink-0 px-3 py-1.5 glass rounded-xl text-xs text-white/60 hover:text-white transition-colors">
              {copied ? '&#10003;' : '복사'}
            </button>
          </div>
          <a
            href={`${CONFIG.EXPLORER_URL}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary/60 hover:text-primary mt-2 inline-block transition-colors"
          >
            BSCScan에서 보기 &#8594;
          </a>
        </GlassCard>

        {/* Balances */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="glass rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-gold/20 flex items-center justify-center text-sm mb-3">💵</div>
            <p className="text-white/40 text-xs uppercase tracking-wider">USDT</p>
            <p className="font-mono text-3xl font-black text-white mt-1">{usdtBalance}</p>
            <p className="text-white/30 text-xs">BEP-20 Testnet</p>
          </div>
          <div className="glass rounded-2xl p-5">
            <div className="w-8 h-8 rounded-lg bg-accent-gold/10 flex items-center justify-center text-sm mb-3">⚽</div>
            <p className="text-white/40 text-xs uppercase tracking-wider">BNB</p>
            <p className="font-mono text-3xl font-black text-white mt-1">{bnbBalance}</p>
            <p className="text-white/30 text-xs">Gas fee</p>
          </div>
        </div>

        {/* Get Testnet BNB */}
        <GlassCard className="mb-4">
          <p className="text-sm font-bold text-white mb-1">Testnet BNB 받기</p>
          <p className="text-white/40 text-xs mb-3">BSC Testnet 에서 가스비를 위한 BNB가 필요합니다</p>
          <a
            href="https://testnet.bnbchain.org/faucet-smart"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-4 py-2 btn-secondary rounded-xl text-sm"
          >
            Faucet 열기 &#8594;
          </a>
        </GlassCard>

        {/* Security */}
        <div className="glass rounded-2xl p-4 mb-4">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-3">보안</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => { setShowPinModal('mnemonic'); setPinError(''); setPin(''); }}
              className="flex items-center gap-3 p-3 glass rounded-xl glass-hover text-left"
            >
              <span className="text-lg">📝</span>
              <div>
                <p className="text-sm font-semibold text-white">니모닉 보기</p>
                <p className="text-xs text-white/40">12개 복구 단어 확인</p>
              </div>
            </button>
          </div>
        </div>

        {/* Network Info */}
        <div className="glass rounded-2xl p-4 border border-dark-border">
          <p className="text-xs text-white/50 font-semibold uppercase tracking-wider mb-3">네트워크</p>
          <div className="flex flex-col gap-2">
            {[
              { label: '네트워크', value: 'BSC Testnet' },
              { label: 'Chain ID', value: CONFIG.CHAIN_ID.toString() },
              { label: '컨트랙트', value: formatAddress(CONFIG.CONTRACT_ADDRESS) },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-white/40 text-xs">{label}</span>
                <span className="font-mono text-xs text-white">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4">
          <div className="w-full max-w-sm glass rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="font-bold text-white">니모닉 확인</h3>
            <p className="text-white/40 text-sm">PIN을 입력해야 니모닉을 복호화합니다</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setPinError(''); }}
              placeholder="PIN"
              className="input-dark w-full px-4 py-3 text-center text-xl tracking-widest"
              onKeyDown={(e) => e.key === 'Enter' && handleRevealMnemonic()}
              autoFocus
            />
            {pinError && <p className="text-accent-red text-xs">{pinError}</p>}
            <div className="flex gap-3">
              <button onClick={() => setShowPinModal(null)} className="flex-1 py-3 btn-secondary rounded-xl">취소</button>
              <button onClick={handleRevealMnemonic} disabled={!pin} className="flex-1 py-3 btn-primary rounded-xl">확인</button>
            </div>
          </div>
        </div>
      )}

      {/* Mnemonic Modal */}
      {showMnemonic && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-sm glass rounded-2xl p-5 flex flex-col gap-4 border border-accent-red/30">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-white">니모닉 (백업 구문)</h3>
              <button onClick={() => { setShowMnemonic(false); setMnemonic(''); }} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="glass rounded-xl p-3 border border-accent-red/20">
              <p className="text-accent-red text-xs">절대로 타인에게 공유하지 마세요. 사진 찍지 마세요.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {words.map((w, i) => (
                <div key={i} className="glass rounded-xl px-2 py-2 flex items-center gap-1.5">
                  <span className="text-primary/50 text-xs font-mono">{i + 1}</span>
                  <span className="text-white text-sm font-semibold">{w}</span>
                </div>
              ))}
            </div>
            <button onClick={() => copy(mnemonic)} className="w-full py-3 btn-secondary rounded-xl text-sm">
              {copied ? '&#10003; 복사됨' : '클립보드 복사'}
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
