import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, ACTIVE_NETWORK, ACTIVE_CONTRACT } from '@/constants/config';
import { ContractService } from '@/services/ContractService';
import { formatUSDT } from '@/utils/formatting';

export default function TreasuryScreen() {
  const navigation = useNavigation();
  const [info, setInfo] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const svc = new ContractService();
      const [t, s] = await Promise.all([
        svc.getTreasuryInfo(),
        svc.getPlatformStats(),
      ]);
      setInfo(t);
      setStats(s);
    } catch {} finally {
      setLoading(false);
    }
  };

  const openBscscan = () => {
    if (ACTIVE_CONTRACT) {
      Linking.openURL(`${ACTIVE_NETWORK.explorer}/address/${ACTIVE_CONTRACT}`);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🏦 국고 현황</Text>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.mainCard}>
            <Text style={styles.mainLabel}>전체 국고 잔액</Text>
            <Text style={styles.mainVal}>{formatUSDT(info?.total ?? 0)} USDT</Text>
            <View style={[styles.bonusBadge, info?.bonusReady && styles.bonusBadgeOn]}>
              <Text style={[styles.bonusText, info?.bonusReady && styles.bonusTextOn]}>
                {info?.bonusReady ? '✅ 다음달 보너스 활성화' : '⏳ 누적 중 (20 USDT 미만)'}
              </Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[
              ['전체 챌린지', stats?.totalChallenges ?? 0, '개'],
              ['전체 참가', stats?.totalParticipations ?? 0, '를'],
              ['누적 상금', formatUSDT(stats?.totalDistributed ?? 0), 'USDT'],
            ].map(([k, v, u]) => (
              <View key={String(k)} style={styles.statCard}>
                <Text style={styles.statVal}>{v}{u}</Text>
                <Text style={styles.statKey}>{k}</Text>
              </View>
            ))}
          </View>

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>📜 국고 규칙</Text>
            {[
              '• 4등 이하 참가비 자동 적립',
              '• 기권 및 실격 시 참가비 적립',
              '• 2명 참가 시 잔여 15% 적립',
              '• 20 USDT 이상 시 다음 달 4~10등 0.5 USDT 보너스',
              '• 스마트컨트랙트가 자동 관리 — 누구도 인출 불가',
            ].map((r, i) => (
              <Text key={i} style={styles.rule}>{r}</Text>
            ))}
          </View>

          <TouchableOpacity style={styles.bscscanBtn} onPress={openBscscan}>
            <Text style={styles.bscscanText}>🔗 BSCScan에서 컨트랙트 확인</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { padding: 20, paddingTop: 56 },
  backText: { color: COLORS.primary, fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, paddingHorizontal: 20, marginBottom: 20 },
  mainCard: {
    margin: 20, backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  mainLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 8 },
  mainVal: { fontSize: 36, fontWeight: '800', color: COLORS.primary, marginBottom: 16 },
  bonusBadge: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6,
    backgroundColor: COLORS.border,
  },
  bonusBadgeOn: { backgroundColor: '#0D2E1F' },
  bonusText: { fontSize: 13, color: COLORS.textSecondary },
  bonusTextOn: { color: COLORS.primary, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  statVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  statKey: { fontSize: 11, color: COLORS.textSecondary },
  rulesBox: {
    margin: 20, backgroundColor: COLORS.surface, borderRadius: 14,
    padding: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  rulesTitle: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  rule: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 6, lineHeight: 20 },
  bscscanBtn: {
    marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginBottom: 40,
  },
  bscscanText: { color: COLORS.textSecondary, fontSize: 14 },
});
