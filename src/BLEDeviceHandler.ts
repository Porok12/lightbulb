import {BleManager, Device} from 'react-native-ble-plx';
import {PermissionsAndroid, Platform} from 'react-native';
import {Buffer} from 'buffer';

const DEVICE_INFO_SERVICE_UUID = '0000180A-0000-1000-8000-00805F9B34FB'; // Device Info
const FIRMWARE_VERSION_UUID = '00002A26-0000-1000-8000-00805F9B34FB'; // Firmware Version
const BATTERY_SERVICE_UUID = '0000180F-0000-1000-8000-00805F9B34FB'; // Battery Service
const BATTERY_CHARACTERISTIC_UUID = '00002A19-0000-1000-8000-00805F9B34FB'; // Battery Level
const LIGHT_SERVICE_UUID = '12345678-1234-5678-1234-56789abcdef0'; // Light Service
const LIGHT_CHARACTERISTIC_UUID = 'abcdef01-1234-5678-1234-56789abcdef0'; // Light Color

const COMMAND_SET_COLOR = 0x01;
const COMMAND_SET_COLOROS = 0x02;
const COMMAND_DISABLE_BLE = 0x03;

export const services = {
    deviceInfo: {
        serviceUUID: DEVICE_INFO_SERVICE_UUID,
        characteristics: [
            FIRMWARE_VERSION_UUID,
        ],
    },
    battery: {
        serviceUUID: BATTERY_SERVICE_UUID,
        characteristics: [
            BATTERY_CHARACTERISTIC_UUID,
        ],
    },
    light: {
        serviceUUID: LIGHT_SERVICE_UUID,
        characteristics: [
            LIGHT_CHARACTERISTIC_UUID,
        ],
    },
};

type RGBW = {
    r: number;
    g: number;
    b: number;
    w: number;
}

const buildCommand = (rgbw: RGBW): Uint8Array => {
    const {r, g, b, w} = rgbw;
    const rgbwArray = [r, g, b, w];
    return new Uint8Array([COMMAND_SET_COLOR, ...rgbwArray]);
};

class BLEDeviceHandler {
    private bleManager: BleManager;
    private connectedDevice: Device | null = null;
    private isConnected: boolean = false;

    constructor() {
        this.bleManager = new BleManager();
    }

    async requestPermissions() {
        if (Platform.OS === 'android') {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
        }
    }

    // TODO: use this
    async scanForDevices(onDeviceFound: (device: Device) => void) {
        this.bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Scan Error:", error);
                return;
            }

            if (device) {
                console.log(`📡 Found ESP32 Device: ${device.name}`);
                onDeviceFound(device);
                this.bleManager.stopDeviceScan();
            }
        });

        setTimeout(() => this.bleManager.stopDeviceScan(), 10000);
    }

    async connectToDevice(
        device: Device,
        onSuccessful?: () => void,
        onError?: (error: any) => void,
    ) {
        try {
            const connectedDevice = await this.bleManager.connectToDevice(device.id);
            await connectedDevice.discoverAllServicesAndCharacteristics();
            this.connectedDevice = connectedDevice;
            this.isConnected = await this.bleManager.isDeviceConnected(device.id);
            onSuccessful?.();
            console.log('✅ Connected to ESP32:', connectedDevice.name);
        } catch (error) {
            onError?.(error);
            console.error('❌ Connection Error:', error);
        }
    }

    async readBatteryLevel(): Promise<number | null> {
        if (!this.connectedDevice) {
            return null;
        }

        try {
            const characteristic = await this.connectedDevice.readCharacteristicForService(
                BATTERY_SERVICE_UUID,
                BATTERY_CHARACTERISTIC_UUID,
            );
            //const batteryLevel = parseInt(characteristic.value ?? '0', 16);
            const batteryLevel = Buffer.from(characteristic.value ?? '0', 'base64')[0];
            console.log(`🔋 Battery Level: ${batteryLevel}%`);
            return batteryLevel;
        } catch (error) {
            console.error('❌ Battery Read Error:', error);
            return null;
        }
    }

    async readFirmwareVersion(): Promise<string | null> {
        if (!this.connectedDevice) {
            return null;
        }

        try {
            const characteristic = await this.connectedDevice.readCharacteristicForService(
                DEVICE_INFO_SERVICE_UUID,
                FIRMWARE_VERSION_UUID,
            );
            const base64Value = characteristic.value ?? "";
            const firmwareVersion = Buffer.from(base64Value, "base64").toString("utf8");
            console.log(`ℹ️ Firmware Version: ${firmwareVersion}`);
            return firmwareVersion;
        } catch (error) {
            console.error('❌ Firmware Read Error:', error);
            return null;
        }
    }

    async writeLightColor(
        rgbw: RGBW,
        onSuccessful: () => void,
        onError: (error: any) => void,
    ) {
        if (!this.connectedDevice) {
            return;
        }

        const payload = buildCommand(rgbw);
        const base64Value = Buffer.from(payload).toString('base64');

        try {
            await this.connectedDevice.writeCharacteristicWithoutResponseForService(
                LIGHT_SERVICE_UUID,
                LIGHT_CHARACTERISTIC_UUID,
                base64Value,
            );
            onSuccessful();
        } catch (error) {
            onError(error);
            console.error('❌ Light Color Write Error:', error);
        }
    }

    async isDeviceConnected(id: string) {
        return await this.bleManager.isDeviceConnected(id);
    }

    onDeviceDisconnected(id: string, listener: () => void) {
        return this.bleManager.onDeviceDisconnected(id, listener);
    }

    async disconnect() {
        if (this.connectedDevice) {
            await this.bleManager.cancelDeviceConnection(this.connectedDevice.id);
            this.connectedDevice = null;
            console.log('🔌 Disconnected from ESP32');
        }
    }
}

export default new BLEDeviceHandler();
