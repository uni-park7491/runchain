import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '@/constants/config';
import { formatUSDT, formatCountdown } from '@/utils/formatting';

interface Props {
  challenge: { id: number; name: string; entryFee: number; totalPool: number; participantCount: number; status: number; endTime: number; };
  onPress: () => void;
}

export default function ChallengeCard({ challenge, onPress }: Props) {
  const labels = ['모집 중', '진행 중', '종료', '취소'];
  const colors = [COLORS.primary, '#4A9EFF', COLORS.textSecondary, COLORS.error];
  const sc = colors[challenge.status];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.8}>
      <View style={s.top}>
        <View style={[s.badge, { backgroundColor: sc + '22' }]}>
          <Text style={[s.badgeText, { color: sc }]}>{labels[challenge.status]}</Text>
        </View>
        <Text style={s.timer}>{formatCountdown(challenge.endTime)}</Text>
      </View>
      <Text style={s.name} numberOfLines={1}>{challenge.name}</Text>
      <View style={s.row}>
        {[
          ['콈 풀', `${formatUSDT(challenge.totalPool)} USDT`],
          ['참가비', `${formatUSDT(challenge.entryFee)} USDT`],
          ['인원', `${challenge.participantCount}/30`],
        ].map(([k, v]) => (
          <View key={k}>
            <Text style={s.infoKey}>{k}</Text>
            <Text style={s.infoVal}>{v}</Text>
          </View>
        ))}
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  timer: { fontSize: 12, color: COLORS.textSecondary },
  name: { fontSize: 17, fontWeight: '700', color: COLORS.text, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  infoKey: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  infoVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});
