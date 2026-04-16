export type GPSPoint = {
  lat: number;
  lng: number;
  timestamp: number;
  accuracy?: number;
};

export const haversineDistance = (p1: GPSPoint, p2: GPSPoint): number => {
  const R = 6371000;
  const φ1 = (p1.lat * Math.PI) / 180;
  const φ2 = (p2.lat * Math.PI) / 180;
  const Δφ = ((p2.lat - p1.lat) * Math.PI) / 180;
  const Δλ = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const calculateTotalDistance = (points: GPSPoint[]): number => {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += haversineDistance(points[i - 1], points[i]);
  }
  return total;
};

export const calculatePace = (distanceM: number, durationSec: number): string => {
  if (distanceM < 10) return '--:--';
  const paceSecPerKm = durationSec / (distanceM / 1000);
  const mins = Math.floor(paceSecPerKm / 60);
  const secs = Math.floor(paceSecPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(2)}km`;
};

export const formatDuration = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export const detectGPSFraud = (
  points: GPSPoint[]
): { suspicious: boolean; reason?: string } => {
  for (let i = 1; i < points.length; i++) {
    const dist = haversineDistance(points[i - 1], points[i]);
    const timeDiff = (points[i].timestamp - points[i - 1].timestamp) / 1000;
    if (timeDiff <= 0) continue;
    const speed = dist / timeDiff;
    if (speed > 12) {
      return {
        suspicious: true,
        reason: `속도 이상 감지: ${(speed * 3.6).toFixed(1)} km/h`,
      };
    }
  }
  return { suspicious: false };
};

export class GPSTracker {
  private watchId: number | null = null;
  public points: GPSPoint[] = [];
  private onUpdate: (points: GPSPoint[], totalDistance: number) => void;

  constructor(onUpdate: (points: GPSPoint[], totalDistance: number) => void) {
    this.onUpdate = onUpdate;
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS를 지원하지 않는 브라우저입니다.'));
        return;
      }
      this.points = [];
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const point: GPSPoint = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now(),
            accuracy: pos.coords.accuracy,
          };
          this.points.push(point);
          this.onUpdate([...this.points], 0);
          this.watchId = navigator.geolocation.watchPosition(
            (p) => {
              const newPoint: GPSPoint = {
                lat: p.coords.latitude,
                lng: p.coords.longitude,
                timestamp: Date.now(),
                accuracy: p.coords.accuracy,
              };
              this.points.push(newPoint);
              this.onUpdate([...this.points], calculateTotalDistance(this.points));
            },
            (err) => console.error('GPS watch error:', err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
          resolve();
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  stop(): GPSPoint[] {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    return [...this.points];
  }

  getGPSHash(): string {
    const data = this.points
      .map((p) => `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${p.timestamp}`)
      .join('|');
    let hash = 5381;
    for (let i = 0; i < data.length; i++) {
      hash = (hash * 33) ^ data.charCodeAt(i);
    }
    return '0x' + Math.abs(hash >>> 0).toString(16).padStart(64, '0');
  }
}
