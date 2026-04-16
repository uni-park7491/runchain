import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { COLORS } from '@/constants/config';
import { ContractService } from '@/services/ContractService';
import { formatAddress, formatUSDT } from '@/utils/formatting';
import { lock } from '@/store/walletSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch();
  const { address } = useSelector((s: RootState) => s.wallet);
  const [stats, setStats] = useState<any>(null);
  const [challenges, setChallenges] = useState<any[]>([]);

  useEffect(() => { load(); }, [address]);

  const load = async () => {
    if (!address) return;
    try {
      const svc = new ContractService();
      const ids = await svc.getUserChallenges(address);
      const infos = await Promise.all(ids.map((id: number) => svc.getChallengeInfo(id)));
      setChallenges(infos);
    } catch {}
  };

  const handleLock = () => {
    Alert.alert('잠금', '앱을 잠그시겠어요?', [
      { text: '취소' },
      { text: '잠금', style: 'destructive', onPress: () => dispatch(lock()) },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>👤 프로필</Text>
        <TouchableOpacity onPress={handleLock}>
          <Text style={styles.lockBtn}>🔒 잠금</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.addrCard}>
        <Text style={styles.addrLabel}>BNB Chain 주소</Text>
        <Text style={styles.addr}>{address ? formatAddress(address, 16) : '-'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>나의 채린지 ({challenges.length})</Text>
        {challenges.length === 0 ? (
          <Text style={styles.empty}>아직 참가한 쳌린지가 없어요</Text>
        ) : (
          challenges.map((c, i) => (
            <View key={i} style={styles.challengeRow}>
              <View style={styles.challengeInfo}>
                <Text style={styles.challengeName}>{c.name}</Text>
                <Text style={styles.challengeSub}>
                  {['모집', '진행', '종료', '취소'][c.status]} · {formatUSDT(c.entryFee)} USDT
                </Text>
              </View>
              <Text style={styles.challengePool}>{formatUSDT(c.totalPool)} USDT</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 56,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  lockBtn: { fontSize: 14, color: COLORS.textSecondary },
  addrCard: {
    margin: 20, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  addrLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 4 },
  addr: { fontSize: 14, color: COLORS.text, fontWeight: '600' },
  section: { paddingHorizontal: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  empty: { color: COLORS.textSecondary, fontSize: 14 },
  challengeRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: COLORS.border,
  },
  challengeInfo: { flex: 1 },
  challengeName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  challengeSub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  challengePool: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
});
