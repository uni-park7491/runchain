import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { COLORS, ACTIVE_NETWORK } from '@/constants/config';
import { WalletService } from '@/services/WalletService';
import { formatAddress, formatUSDT } from '@/utils/formatting';

export default function WalletScreen() {
  const { address } = useSelector((s: RootState) => s.wallet);
  const [usdtBalance, setUsdtBalance] = useState<string | null>(null);
  const [bnbBalance, setBnbBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBalances(); }, [address]);

  const loadBalances = async () => {
    if (!address) return;
    setLoading(true);
    try {
      const svc = new WalletService();
      const [usdt, bnb] = await Promise.all([
        svc.getUSDTBalance(address),
        svc.getBNBBalance(address),
      ]);
      setUsdtBalance(usdt);
      setBnbBalance(bnb);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Alert.alert('복사됨', '지갑 주소가 클립보드에 복사되었어요.');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>💰 내 지갑</Text>

      <View style={styles.addrCard}>
        <Text style={styles.addrLabel}>BNB Chain 주소</Text>
        <Text style={styles.addr}>{address ? formatAddress(address, 12) : '-'}</Text>
        <Text style={styles.network}>{ACTIVE_NETWORK.name}</Text>
        <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
          <Text style={styles.copyBtnText}>📋 주소 복사</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.balanceRow}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USDT</Text>
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.balanceVal}>{usdtBalance ?? '-'}</Text>}
          <Text style={styles.balanceUnit}>BEP-20</Text>
        </View>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>BNB</Text>
          {loading
            ? <ActivityIndicator color={COLORS.primary} />
            : <Text style={styles.balanceVal}>{bnbBalance ?? '-'}</Text>}
          <Text style={styles.balanceUnit}>가스비용</Text>
        </View>
      </View>

      <View style={styles.guideBox}>
        <Text style={styles.guideTitle}>📲 USDT 입금 방법</Text>
        <Text style={styles.guideText}>
          1. TokenPocket 또는 MetaMask 앱 실행{`\n`}
          2. BNB Chain(BSC) 네트워크 선택{`\n`}
          3. 위의 BNB Chain 주소로 USDT(BEP-20) 전송{`\n`}
          4. ERC-20 주소와 혼동 주의! 반드시 BEP-20으로 전송
        </Text>
      </View>

      <TouchableOpacity style={styles.refreshBtn} onPress={loadBalances}>
        <Text style={styles.refreshBtnText}>🔄 잔액 새로고침</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, padding: 20, paddingTop: 56 },
  addrCard: {
    margin: 20, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  addrLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 6 },
  addr: { fontSize: 15, color: COLORS.text, fontWeight: '600', marginBottom: 4 },
  network: { fontSize: 12, color: COLORS.primary, marginBottom: 14 },
  copyBtn: {
    backgroundColor: COLORS.background, borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.primary,
  },
  copyBtnText: { color: COLORS.primary, fontSize: 14, fontWeight: '600' },
  balanceRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  balanceCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  balanceLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  balanceVal: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 4 },
  balanceUnit: { fontSize: 11, color: COLORS.textSecondary },
  guideBox: {
    margin: 20, backgroundColor: '#0D1F2E', borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: '#1A4A6E',
  },
  guideTitle: { color: '#4A9EFF', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  guideText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 22 },
  refreshBtn: {
    marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginBottom: 40,
  },
  refreshBtnText: { color: COLORS.textSecondary, fontSize: 14 },
});
