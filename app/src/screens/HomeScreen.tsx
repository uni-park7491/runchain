import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import WeatherWidget from '@/components/WeatherWidget';
import ChallengeCard from '@/components/ChallengeCard';
import { fetchActiveChallenges } from '@/services/ChallengeService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { address } = useSelector((s: RootState) => s.wallet);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await fetchActiveChallenges(address || '');
      setChallenges(data);
    } catch {}
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>RunChain</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Treasury')}>
          <Text style={styles.treasuryBtn}>🏦 국고</Text>
        </TouchableOpacity>
      </View>

      <WeatherWidget />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>내 진행 중인 챌린지</Text>
        {challenges.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>참가 중인 챌린지가 없어요</Text>
            <TouchableOpacity
              style={styles.joinBtn}
              onPress={() => navigation.navigate('Main', { screen: 'Challenges' } as any)}
            >
              <Text style={styles.joinBtnText}>챌린지 찾아보기</Text>
            </TouchableOpacity>
          </View>
        ) : (
          challenges.map(c => (
            <ChallengeCard
              key={c.id}
              challenge={c}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: c.id })}
            />
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
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.primary },
  treasuryBtn: { fontSize: 14, color: COLORS.textSecondary },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 16 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 16 },
  joinBtn: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  joinBtnText: { color: '#000', fontWeight: '700' },
});
