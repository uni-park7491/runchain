import { CHALLENGE_RULES } from '@/constants/config';
import { RunRecord, Coordinate } from './GPSService';

interface ValidationResult {
  warn: boolean;
  message: string;
}

export class PaceValidator {
  /**
   * 현재 러닝 기록을 검사해서 이상 여부 반환
   * 경고 조건:
   *  1. 순간 속도 > 24 km/h (km당 2분 30초 이하)
   *  2. GPS 점프: 1초 간 100m 이상 이동
   */
  static check(record: RunRecord): ValidationResult {
    const coords = record.coordinates;
    if (coords.length < 2) return { warn: false, message: '' };

    const latest = coords[coords.length - 1];
    const prev = coords[coords.length - 2];

    // 1. 순간 속도 체크 (m/s → km/h)
    const speedKmh = (latest.speed ?? 0) * 3.6;
    if (speedKmh > CHALLENGE_RULES.MAX_PACE_KMH) {
      return {
        warn: true,
        message: `비정상 속도 감지: ${speedKmh.toFixed(1)} km/h (최대 ${CHALLENGE_RULES.MAX_PACE_KMH} km/h)`,
      };
    }

    // 2. GPS 점프 체크
    const timeDiffSec = (latest.timestamp - prev.timestamp) / 1000;
    if (timeDiffSec > 0 && timeDiffSec <= 5) {
      const distM = PaceValidator.haversineM(
        prev.lat, prev.lng, latest.lat, latest.lng
      );
      const mps = distM / timeDiffSec;
      if (mps > CHALLENGE_RULES.GPS_JUMP_THRESHOLD_M) {
        return {
          warn: true,
          message: `GPS 위치 점프 감지: ${distM.toFixed(0)}m / ${timeDiffSec.toFixed(1)}초`,
        };
      }
    }

    return { warn: false, message: '' };
  }

  private static haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
