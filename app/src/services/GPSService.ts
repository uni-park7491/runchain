import * as Location from 'expo-location';
import { CHALLENGE_RULES } from '@/constants/config';

export interface Coordinate {
  lat: number;
  lng: number;
  timestamp: number;
  speed: number; // m/s
}

export interface RunRecord {
  distanceKm: number;
  durationSec: number;
  paceSecPerKm: number;
  coordinates: Coordinate[];
  warnings: number;
}

export class GPSService {
  private subscription: Location.LocationSubscription | null = null;
  private coords: Coordinate[] = [];
  private startTime = 0;

  async requestPermission(): Promise<boolean> {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  }

  start(onUpdate: (record: RunRecord) => void): void {
    this.startTime = Date.now();
    this.coords = [];

    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,  // 2초마다
        distanceInterval: 5, // 5m 이상 이동 시
      },
      (loc) => {
        const coord: Coordinate = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          timestamp: loc.timestamp,
          speed: loc.coords.speed ?? 0,
        };
        this.coords.push(coord);
        const record = this.buildRecord();
        onUpdate(record);
      }
    ).then(sub => { this.subscription = sub; });
  }

  stop(): void {
    this.subscription?.remove();
    this.subscription = null;
  }

  private buildRecord(): RunRecord {
    const durationSec = (Date.now() - this.startTime) / 1000;
    const distanceKm = this.calcTotalDistance();
    const paceSecPerKm = distanceKm > 0 ? durationSec / distanceKm : 0;

    return {
      distanceKm,
      durationSec,
      paceSecPerKm,
      coordinates: [...this.coords],
      warnings: 0,
    };
  }

  private calcTotalDistance(): number {
    let total = 0;
    for (let i = 1; i < this.coords.length; i++) {
      total += this.haversine(
        this.coords[i - 1].lat, this.coords[i - 1].lng,
        this.coords[i].lat, this.coords[i].lng
      );
    }
    return total;
  }

  /** 두 좌표 간 거리 (km) */
  private haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number { return (deg * Math.PI) / 180; }
}
