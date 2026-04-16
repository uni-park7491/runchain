import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, Platform, AppState
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS, CHALLENGE_RULES } from '@/constants/config';
import { GPSService, RunRecord } from '@/services/GPSService';
import { PaceValidator } from '@/services/PaceValidator';
import { formatPace, formatDuration } from '@/utils/formatting';

type Route = RouteProp<RootStackParamList, 'Running'>;

export default function RunningScreen() {
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { challengeId } = route.params;

  const [isRunning, setIsRunning] = useState(false);
  const [record, setRecord] = useState<RunRecord>({
    distanceKm: 0, durationSec: 0, paceSecPerKm: 0,
    coordinates: [], warnings: 0,
  });
  const [warning, setWarning] = useState<string | null>(null);
  const gpsRef = useRef<GPSService | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    return () => {
      gpsRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStart = async () => {
    const gps = new GPSService();
    const granted = await gps.requestPermission();
    if (!granted) {
      Alert.alert('권한 필요', 'GPS 위치 권한을 허용해주세요.');
      return;
    }
    gpsRef.current = gps;
    gps.start((updated) => {
      const check = PaceValidator.check(updated);
      if (check.warn) {
        setWarning(check.message);
        setRecord(r => ({ ...updated, warnings: r.warnings + 1 }));
        if (updated.warnings + 1 >= CHALLENGE_RULES.MAX_WARNINGS) {
          handleDisqualify();
        }
      } else {
        setWarning(null);
        setRecord(updated);
      }
    });
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    setIsRunning(true);
  };

  const handleStop = () => {
    gpsRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRunning(false);
  };

  const handleFinish = () => {
    handleStop();
    if (record.distanceKm < CHALLENGE_RULES.MIN_KM_PER_DAY) {
      Alert.alert(
        '거리 부족',
        `최소 ${CHALLENGE_RULES.MIN_KM_PER_DAY}km 이상이어야 기록이 인정됩니다. (현재: ${record.distanceKm.toFixed(2)}km)`,
        [{ text: '확인', onPress: () => navigation.goBack() }]
      );
      return;
    }
    Alert.alert(
      '러닝 완료!',
      `오늘 ${Math.min(record.distanceKm, CHALLENGE_RULES.MAX_KM_PER_DAY).toFixed(2)}km 기록됨\n기록이 검증 후 반영됩니다.`,
      [{ text: '확인', onPress: () => navigation.goBack() }]
    );
  };

  const handleDisqualify = () => {
    handleStop();
    Alert.alert(
      '⚠️ 자동 실격',
      '비정상 페이스 경고 3회로 자동 실격 처리됩니다. 참가비는 국고로 적립됩니다.',
      [{ text: '확인', onPress: () => navigation.goBack() }]
    );
  };

  const cappedKm = Math.min(record.distanceKm, CHALLENGE_RULES.MAX_KM_PER_DAY);
  const progressPct = Math.min(cappedKm / CHALLENGE_RULES.MAX_KM_PER_DAY, 1);

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← 나가기</Text>
      </TouchableOpacity>

      {warning && (
        <View style={styles.warnBox}>
          <Text style={styles.warnText}>⚠️ {warning}</Text>
          <Text style={styles.warnCount}>경고 {record.warnings}/{CHALLENGE_RULES.MAX_WARNINGS}</Text>
        </View>
      )}

      <View style={styles.mainStats}>
        <Text style={styles.distance}>{cappedKm.toFixed(2)}</Text>
        <Text style={styles.distanceUnit}>km</Text>
        <Text style={styles.maxNote}>일일 최대 10km</Text>
      </View>

      <View style={styles.subStats}>
        {[
          ['페이스', formatPace(record.paceSecPerKm)],
          ['시간', formatDuration(elapsed)],
          ['경고', `${record.warnings}/${CHALLENGE_RULES.MAX_WARNINGS}`],
        ].map(([k, v]) => (
          <View key={k} style={styles.subStatCard}>
            <Text style={styles.subStatVal}>{v}</Text>
            <Text style={styles.subStatKey}>{k}</Text>
          </View>
        ))}
      </View>

      <View style={styles.progressWrap}>
        <View style={styles.progressBg}>
          <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
        </View>
        <Text style={styles.progressText}>{(progressPct * 100).toFixed(0)}% (최대 10km 기준)</Text>
      </View>

      <View style={styles.btnRow}>
        {!isRunning ? (
          <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
            <Text style={styles.startBtnText}>🏃 러닝 시작</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnText}>⏸ 일시정지</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
              <Text style={styles.finishBtnText}>✅ 완료</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  back: { paddingTop: 32, paddingBottom: 8 },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
  warnBox: {
    backgroundColor: '#2A1500', borderRadius: 12,
    padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.warning,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  warnText: { color: COLORS.warning, fontSize: 13, flex: 1 },
  warnCount: { color: COLORS.warning, fontSize: 13, fontWeight: '700' },
  mainStats: { alignItems: 'center', marginVertical: 32 },
  distance: { fontSize: 80, fontWeight: '800', color: COLORS.primary },
  distanceUnit: { fontSize: 24, color: COLORS.textSecondary, marginTop: -8 },
  maxNote: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  subStats: { flexDirection: 'row', gap: 10, marginBottom: 28 },
  subStatCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: 12,
    padding: 14, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  subStatVal: { fontSize: 18, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  subStatKey: { fontSize: 12, color: COLORS.textSecondary },
  progressWrap: { marginBottom: 32 },
  progressBg: { height: 8, backgroundColor: COLORS.surface, borderRadius: 4, marginBottom: 6 },
  progressFill: { height: 8, backgroundColor: COLORS.primary, borderRadius: 4 },
  progressText: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  btnRow: { flexDirection: 'row', gap: 12 },
  startBtn: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
  },
  startBtnText: { fontSize: 18, fontWeight: '700', color: '#000' },
  stopBtn: {
    flex: 1, backgroundColor: COLORS.surface,
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center', borderWidth: 1, borderColor: COLORS.border,
  },
  stopBtnText: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  finishBtn: {
    flex: 1, backgroundColor: COLORS.primary,
    borderRadius: 14, paddingVertical: 18, alignItems: 'center',
  },
  finishBtnText: { fontSize: 16, fontWeight: '700', color: '#000' },
});
