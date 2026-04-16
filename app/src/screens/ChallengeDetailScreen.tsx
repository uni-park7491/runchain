import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import { ContractService } from '@/services/ContractService';
import { formatUSDT, formatAddress, formatCountdown } from '@/utils/formatting';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ChallengeDetail'>;
type Route = RouteProp<RootStackParamList, 'ChallengeDetail'>;

export default function ChallengeDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { challengeId } = route.params;
  const { address } = useSelector((s: RootState) => s.wallet);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    loadChallenge();
  }, [challengeId]);

  const loadChallenge = async () => {
    try {
      const svc = new ContractService();
      const data = await svc.getChallengeInfo(challengeId);
      setChallenge(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!address) return;
    setJoining(true);
    try {
      const svc = new ContractService();
      await svc.joinChallenge(challengeId);
      Alert.alert('참가 완료', '참가비가 지불되었어요! 화이팅하세요 🏃');
      loadChallenge();
    } catch (e: any) {
      Alert.alert('오류', e.message || '참가에 실패했어요.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={styles.errText}>챌린지를 찾을 수 없어요</Text>
      </View>
    );
  }

  const statusLabel = ['모집 중', '진행 중', '종료', '취소'][challenge.status] || '-';
  const statusColor = [COLORS.primary, '#4A9EFF', COLORS.textSecondary, COLORS.error][challenge.status];

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
        <Text style={styles.name}>{challenge.name}</Text>
        <Text style={styles.pool}>{formatUSDT(challenge.totalPool)} USDT 풀</Text>
      </View>

      <View style={styles.statsRow}>
        {[
          ['참가비', `${formatUSDT(challenge.entryFee)} USDT`],
          ['참가자', `${challenge.participantCount}/30명`],
          ['남은 시간', formatCountdown(challenge.endTime)],
        ].map(([k, v]) => (
          <View key={k} style={styles.statCard}>
            <Text style={styles.statVal}>{v}</Text>
            <Text style={styles.statKey}>{k}</Text>
          </View>
        ))}
      </View>

      <View style={styles.prizeSection}>
        <Text style={styles.sectionTitle}>🏆 상금 구조</Text>
        {[
          ['🥇 1등', '50%', formatUSDT(challenge.totalPool * 0.5)],
          ['🥈 2등', '35%', formatUSDT(challenge.totalPool * 0.35)],
          ['🥉 3등', '15%', formatUSDT(challenge.totalPool * 0.15)],
        ].map(([rank, pct, amt]) => (
          <View key={rank} style={styles.prizeRow}>
            <Text style={styles.prizeRank}>{rank}</Text>
            <Text style={styles.prizePct}>{pct}</Text>
            <Text style={styles.prizeAmt}>{amt} USDT</Text>
          </View>
        ))}
      </View>

      {challenge.status === 0 && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.joinBtn, joining && styles.btnDisabled]}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.joinBtnText}>참가하기 ({formatUSDT(challenge.entryFee)} USDT)</Text>}
          </TouchableOpacity>
          <Text style={styles.hint}>참가 후 환불 불가. 기권 시 참가비는 국고로 적립됩니다.</Text>
        </View>
      )}

      {challenge.status === 1 && (
        <TouchableOpacity
          style={styles.runBtn}
          onPress={() => navigation.navigate('Running', { challengeId })}
        >
          <Text style={styles.runBtnText}>🏃 러닝 시작</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.lbBtn}
        onPress={() => navigation.navigate('Leaderboard', { challengeId })}
      >
        <Text style={styles.lbBtnText}>🏅 리더보드 보기</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  errText: { color: COLORS.textSecondary },
  back: { padding: 20, paddingTop: 56 },
  backText: { fontSize: 24, color: COLORS.text },
  header: { paddingHorizontal: 20, marginBottom: 24 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 10 },
  statusText: { fontSize: 12, fontWeight: '700' },
  name: { fontSize: 28, fontWeight: '800', color: COLORS.text, marginBottom: 6 },
  pool: { fontSize: 20, color: COLORS.primary, fontWeight: '700' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  statVal: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  statKey: { fontSize: 12, color: COLORS.textSecondary },
  prizeSection: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  prizeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  prizeRank: { flex: 1, fontSize: 15, color: COLORS.text },
  prizePct: { fontSize: 14, color: COLORS.textSecondary, marginRight: 12 },
  prizeAmt: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  actions: { paddingHorizontal: 20, marginBottom: 16 },
  joinBtn: {
    backgroundColor: COLORS.primary, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  joinBtnText: { fontSize: 17, fontWeight: '700', color: '#000' },
  hint: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 8 },
  runBtn: {
    marginHorizontal: 20, backgroundColor: '#1A3A2A',
    borderRadius: 14, paddingVertical: 16,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary, marginBottom: 12,
  },
  runBtnText: { fontSize: 17, fontWeight: '700', color: COLORS.primary },
  lbBtn: {
    marginHorizontal: 20, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', marginBottom: 40,
  },
  lbBtnText: { fontSize: 15, color: COLORS.textSecondary },
});
