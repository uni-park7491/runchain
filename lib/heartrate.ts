// Web Bluetooth Heart Rate Monitor
// 지원 기기: Polar H10, Garmin HRM-Pro, Wahoo TICKR 등 BLE HR 센서
// 미지원: Apple Watch (Web Bluetooth API 비지원)

const HR_SERVICE = 0x180d;
const HR_CHARACTERISTIC = 0x2a37;

export class HeartRateMonitor {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onHR: (bpm: number) => void;
  private onConnectionChange: (connected: boolean) => void;

  constructor(
    onHR: (bpm: number) => void,
    onConnectionChange: (connected: boolean) => void
  ) {
    this.onHR = onHR;
    this.onConnectionChange = onConnectionChange;
  }

  static isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
  }

  async connect(): Promise<boolean> {
    if (!HeartRateMonitor.isSupported()) return false;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: [HR_SERVICE] }],
      });
      this.device!.addEventListener('gattserverdisconnected', () => {
        this.onConnectionChange(false);
      });
      const server = await this.device!.gatt!.connect();
      const service = await server.getPrimaryService(HR_SERVICE);
      this.characteristic = await service.getCharacteristic(HR_CHARACTERISTIC);
      await this.characteristic.startNotifications();
      this.characteristic.addEventListener(
        'characteristicvaluechanged',
        this.handleValue.bind(this)
      );
      this.onConnectionChange(true);
      return true;
    } catch (err) {
      console.error('BLE HR 연결 실패:', err);
      return false;
    }
  }

  private handleValue(event: Event) {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value!;
    const flags = value.getUint8(0);
    const is16bit = flags & 0x01;
    const bpm = is16bit ? value.getUint16(1, true) : value.getUint8(1);
    this.onHR(bpm);
  }

  async disconnect() {
    if (this.characteristic) {
      try { await this.characteristic.stopNotifications(); } catch {}
    }
    if (this.device?.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.onConnectionChange(false);
  }
}
