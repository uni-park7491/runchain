// GPS 궤적 검증 로직
// 앱에서 수신한 GPS 데이터를 분석해 이상여부 판단

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number; // m/s
}

export interface ValidationResult {
  valid: boolean;
  distanceKm: number;
  warn: boolean;
  warnReason?: string;
  durationSec: number;
  avgPaceSecPerKm: number;
}

const MAX_SPEED_MS = 6.67;      // 24km/h → m/s (km당 2분 30초)
const GPS_JUMP_THRESHOLD_M = 100; // 1초당 100m 이상 점프 의심
const MIN_KM = 3;
const MAX_KM = 10;

export function validateGPSTrack(coords: Coordinate[]): ValidationResult {
  if (coords.length < 2) {
    return { valid: false, distanceKm: 0, warn: false, durationSec: 0, avgPaceSecPerKm: 0 };
  }

  let totalDistM = 0;
  let warn = false;
  let warnReason = '';
  let suspiciousCount = 0;

  for (let i = 1; i < coords.length; i++) {
    const prev = coords[i - 1];
    const curr = coords[i];
    const distM = haversineM(prev.lat, prev.lng, curr.lat, curr.lng);
    const timeSec = (curr.timestamp - prev.timestamp) / 1000;

    if (timeSec > 0 && timeSec <= 10) {
      const speedMs = distM / timeSec;

      // GPS 점프 체크
      if (distM > GPS_JUMP_THRESHOLD_M && timeSec <= 2) {
        suspiciousCount++;
        warnReason = `GPS 점프 감지: ${distM.toFixed(0)}m/${timeSec.toFixed(1)}s`;
      }

      // 속도 체크
      if (speedMs > MAX_SPEED_MS) {
        suspiciousCount++;
        warnReason = `과도 속도 감지: ${(speedMs * 3.6).toFixed(1)}km/h`;
      }
    }

    totalDistM += distM;
  }

  const distanceKm = Math.min(totalDistM / 1000, MAX_KM);
  const durationSec = (coords[coords.length - 1].timestamp - coords[0].timestamp) / 1000;
  const avgPaceSecPerKm = distanceKm > 0 ? durationSec / distanceKm : 0;

  if (suspiciousCount >= 3) {
    warn = true;
  }

  return {
    valid: distanceKm >= MIN_KM,
    distanceKm,
    warn,
    warnReason: warn ? warnReason : undefined,
    durationSec,
    avgPaceSecPerKm,
  };
}

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
