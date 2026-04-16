import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/config';
import { WeatherService, WeatherData } from '@/services/WeatherService';

export default function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDate(now.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }));
      setTime(now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const t = setInterval(update, 1000);
    new WeatherService().getCurrentWeather().then(setWeather).catch(() => {});
    return () => clearInterval(t);
  }, []);

  const advice = () => {
    if (!weather) return '';
    if (weather.temp < 0) return '❌ 매우 추울 날씨';
    if (weather.temp > 35) return '❌ 고온 주의';
    if (weather.windSpeed > 40) return '⚠️ 강풍 주의';
    if (weather.temp >= 10 && weather.temp <= 25) return '✅ 러닝하기 좋은 날씨';
    return '🏃 러닝 가능';
  };

  return (
    <View style={s.box}>
      <View style={s.row}>
        <Text style={s.date}>{date}</Text>
        <Text style={s.time}>{time}</Text>
      </View>
      {weather ? (
        <View style={s.row}>
          <View>
            <Text style={s.temp}>{weather.temp}°C</Text>
            <Text style={s.sub}>체감 {weather.feelsLike}°C · {weather.description}</Text>
          </View>
          <View style={s.details}>
            <Text style={s.detail}>💧 {weather.humidity}%</Text>
            <Text style={s.detail}>🌬️ {weather.windSpeed}km/h</Text>
          </View>
        </View>
      ) : (
        <Text style={s.sub}>날씨 로딩 중...</Text>
      )}
      {weather && <Text style={s.advice}>{advice()}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: COLORS.surface, borderRadius: 16,
    padding: 18, borderWidth: 1, borderColor: COLORS.border,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  date: { fontSize: 13, color: COLORS.textSecondary },
  time: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  temp: { fontSize: 34, fontWeight: '800', color: COLORS.text },
  sub: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  details: { gap: 4, alignItems: 'flex-end' },
  detail: { fontSize: 12, color: COLORS.textSecondary },
  advice: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
});
