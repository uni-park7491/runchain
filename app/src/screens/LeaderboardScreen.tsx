import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import { ContractService } from '@/services/ContractService';
import { formatAddress, formatUSDT } from '@/utils/formatting';

type Route = RouteProp<RootStackParamList, 'Leaderboard'>;

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { challengeId } = route.params;
  const { address } = useSelector((s: RootState) => s.wallet);
  const [entries, setEntries] = useState<any[]>([]);
  const [challenge, setChallenge] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const svc = new ContractService();
      const [info, participants] = await Promise.all([
        svc.getChallengeInfo(challengeId),
        svc.getParticipantList(challengeId),
      ]);
      setChallenge(info);
      const details = await Promise.all(
        participants.map(async (addr: string) => {
          const p = await svc.getParticipantInfo(challengeId, addr);
          return { address: addr, ...p };
        })
      );
      const sorted = details
        .filter(p => !p.disqualified && !p.withdrawn)
        .sort((a, b) => Number(b.totalKm) - Number(a.totalKm));
      setEntries(sorted);
    } catch {} finally {
      setLoading(false);
    }
  };

  const rankIcon = (i: number) => ['🥇', '🥈', '🥉'][i] ?? `${i + 1}`;
  const rankColor = (i: number) => [COLORS.gold, COLORS.silver, COLORS.bronze][i] ?? COLORS.textSecondary;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← 뒤로</Text>
      </TouchableOpacity>
      <Text style={styles.title}>🏆 리더보드</Text>
      {challenge && (
        <View style={styles.poolBadge}>
          <Text style={styles.poolText}>상금 풀: {formatUSDT(challenge.totalPool)} USDT</Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.address}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => {
            const isMe = item.address.toLowerCase() === address?.toLowerCase();
            const kmDisplay = (Number(item.totalKm) / 100).toFixed(2);
            return (
              <View style={[styles.row, isMe && styles.rowMe]}>
                <Text style={[styles.rank, { color: rankColor(index) }]}>
                  {rankIcon(index)}
                </Text>
                <View style={styles.info}>
                  <Text style={[styles.addr, isMe && styles.addrMe]}>
                    {formatAddress(item.address)}{isMe ? ' (나)' : ''}
                  </Text>
                  <Text style={styles.km}>{kmDisplay} km</Text>
                </View>
                {index < 3 && challenge && (
                  <Text style={styles.prize}>
                    +{formatUSDT(
                      challenge.totalPool * [0.5, 0.35, 0.15][index]
                    )} USDT
                  </Text>
                )}
                {index >= 3 && (
                  <Text style={styles.treasury}>국고</Text>
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.empty}>아직 기록이 없어요</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  back: { padding: 20, paddingTop: 56 },
  backText: { color: COLORS.primary, fontSize: 15 },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text, paddingHorizontal: 20, marginBottom: 12 },
  poolBadge: {
    marginHorizontal: 20, backgroundColor: '#0D2E1F',
    borderRadius: 10, padding: 10, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.primary, alignSelf: 'flex-start',
  },
  poolText: { color: COLORS.primary, fontSize: 14, fontWeight: '700' },
  list: { paddingHorizontal: 20, gap: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  rowMe: { borderColor: COLORS.primary, backgroundColor: '#0D2E1F' },
  rank: { fontSize: 22, width: 40, textAlign: 'center' },
  info: { flex: 1, marginLeft: 8 },
  addr: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  addrMe: { color: COLORS.primary },
  km: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  prize: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
  treasury: { fontSize: 12, color: COLORS.textSecondary },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});
