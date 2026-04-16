import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import ChallengeCard from '@/components/ChallengeCard';
import { fetchAllChallenges } from '@/services/ChallengeService';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export default function ChallengeListScreen() {
  const navigation = useNavigation<Nav>();
  const [challenges, setChallenges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'open' | 'active'>('open');

  const load = async () => {
    try {
      const data = await fetchAllChallenges();
      setChallenges(data);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const filtered = challenges.filter(c =>
    tab === 'open' ? c.status === 0 : c.status === 1
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>챌린지</Text>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => navigation.navigate('CreateChallenge')}
        >
          <Text style={styles.createBtnText}>+ 만들기</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['open', 'active'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'open' ? '모집 중' : '진행 중'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          renderItem={({ item }) => (
            <ChallengeCard
              challenge={item}
              onPress={() => navigation.navigate('ChallengeDetail', { challengeId: item.id })}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>챌린지가 없어요</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: 20, paddingTop: 56,
  },
  title: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  createBtn: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  tabs: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: COLORS.border,
  },
  tabActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 14 },
  tabTextActive: { color: '#000', fontWeight: '700' },
  list: { padding: 20, gap: 12 },
  empty: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 40 },
});
