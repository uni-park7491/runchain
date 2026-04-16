import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput,
  TouchableOpacity, Alert, ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/navigation/AppNavigator';
import { COLORS } from '@/constants/config';
import { savePassword } from '@/utils/encryption';

type Nav = NativeStackNavigationProp<RootStackParamList, 'SetPassword'>;

function getStrength(pw: string): { level: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-z0-9]/i.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (score <= 1) return { level: 1, label: '약함', color: '#FF3B30' };
  if (score <= 3) return { level: 2, label: '보통', color: '#FF9500' };
  return { level: 3, label: '강함', color: '#00E5A0' };
}

export default function SetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const strength = getStrength(pw);

  const isValid =
    pw.length >= 8 &&
    /[a-z]/i.test(pw) &&
    /[0-9]/.test(pw) &&
    pw === confirm;

  const handleSet = async () => {
    if (!isValid) return;
    try {
      await savePassword(pw);
      navigation.navigate('BiometricSetup');
    } catch {
      Alert.alert('오류', '비밀번호 저장 중 문제가 발생했습니다.');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>🔐 보안 비밀번호 설정</Text>
      <Text style={styles.subtitle}>
        지갑 접근 및 거래 승인 시 사용됩니다.{`\n`}
        영문 + 숫자 조합 8자 이상
      </Text>

      <View style={styles.inputWrap}>
        <TextInput
          style={styles.input}
          placeholder="비밀번호 입력"
          placeholderTextColor="#555"
          secureTextEntry={!showPw}
          value={pw}
          onChangeText={setPw}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eye}>
          <Text style={styles.eyeText}>{showPw ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      {pw.length > 0 && (
        <View style={styles.strengthRow}>
          {[1, 2, 3].map(i => (
            <View
              key={i}
              style={[
                styles.strengthBar,
                i <= strength.level && { backgroundColor: strength.color }
              ]}
            />
          ))}
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            {strength.label}
          </Text>
        </View>
      )}

      <TextInput
        style={[styles.input, { marginTop: 12 }]}
        placeholder="비밀번호 확인"
        placeholderTextColor="#555"
        secureTextEntry={!showPw}
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="none"
      />
      {confirm.length > 0 && pw !== confirm && (
        <Text style={styles.mismatch}>비밀번호가 일치하지 않습니다</Text>
      )}

      <View style={styles.rules}>
        {[
          { ok: pw.length >= 8, text: '8자 이상' },
          { ok: /[a-z]/i.test(pw), text: '영문 포함' },
          { ok: /[0-9]/.test(pw), text: '숫자 포함' },
        ].map((r, i) => (
          <Text key={i} style={[styles.rule, r.ok && styles.ruleOk]}>
            {r.ok ? '✅' : '○'} {r.text}
          </Text>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, !isValid && styles.btnDisabled]}
        onPress={handleSet}
        disabled={!isValid}
      >
        <Text style={styles.btnText}>비밀번호 설정</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.text, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22, marginBottom: 28 },
  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  eye: { position: 'absolute', right: 16, top: 14 },
  eyeText: { fontSize: 20 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6 },
  strengthBar: {
    flex: 1, height: 4, borderRadius: 2, backgroundColor: '#333',
  },
  strengthLabel: { fontSize: 12, fontWeight: '600', minWidth: 30 },
  mismatch: { color: COLORS.error, fontSize: 12, marginTop: 6 },
  rules: { flexDirection: 'row', gap: 12, marginVertical: 20 },
  rule: { fontSize: 12, color: '#555' },
  ruleOk: { color: COLORS.primary },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.3 },
  btnText: { fontSize: 17, fontWeight: '700', color: '#000' },
});
