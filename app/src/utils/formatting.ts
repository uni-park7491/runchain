export function formatUSDT(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '0';
  return n % 1 === 0 ? n.toFixed(0) : n.toFixed(2);
}

export function formatAddress(address: string, chars = 8): string {
  if (!address) return '';
  const half = Math.floor(chars / 2);
  return `${address.slice(0, half + 2)}...${address.slice(-half)}`;
}

export function formatPace(secPerKm: number): string {
  if (!secPerKm || secPerKm <= 0) return "--'--\"";
  const min = Math.floor(secPerKm / 60);
  const sec = Math.floor(secPerKm % 60);
  return `${min}'${String(sec).padStart(2, '0')}"`;
}

export function formatDuration(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = Math.floor(totalSec % 60);
  if (h > 0) return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export function formatCountdown(endTimestamp: number): string {
  const diff = endTimestamp - Math.floor(Date.now() / 1000);
  if (diff <= 0) return '종료';
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  if (days > 0) return `${days}일 ${hours}시간`;
  return `${hours}시간 ${Math.floor((diff % 3600) / 60)}분`;
}

export function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
}
