import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import ColorPicker, {BrightnessSlider, HueSlider, Panel1, Preview} from 'reanimated-color-picker';
import {BleManager, Device} from 'react-native-ble-plx';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from './App.tsx';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 4,
    },
    panelStyle: {
        borderRadius: 16,
        shadowColor: '#888',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sliderStyle: {
        borderRadius: 20,
        marginTop: 20,
        shadowColor: '#888',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
});

const bleManager = new BleManager();
const ESP32_SERVICE_UUID = 'f3b5e3a6-7fd5-4a0a-832f-63bb1e98e7f5';
const DEVICE_CHARACTERISTIC_UUID = 'a7e82db5-bbef-4f24-b451-37d60c6a30e2';

type DeviceScreenProps = NativeStackScreenProps<RootStackParamList, 'DeviceScreen'>;

const buildCommand = (rgbw: { r: number, g: number, b: number, w: number }) => {
    const {r, g, b, w} = rgbw;
    const rgbwArray = [r, g, b, w];
    const byteArray = new Uint8Array([0x01, ...rgbwArray]);
    return byteArray;
};

let debugCounter = 0;
const sendColorToDevice = async (device: Device, payload: Uint8Array) => {
    debugCounter++;
    try {
        console.log(`Sending RGBW bytes:`, payload);

        const connectedDevice = await bleManager.connectToDevice(device.id);
        await connectedDevice.discoverAllServicesAndCharacteristics();

        await connectedDevice.writeCharacteristicWithoutResponseForService(
            DEVICE_CHARACTERISTIC_UUID,
            DEVICE_CHARACTERISTIC_UUID,
            Buffer.from(payload).toString('base64'),
        );
    } catch (error) {
        console.error('Error sending color:', error);
    }
};

function DeviceScreen({route}: DeviceScreenProps) {
    const {device} = route.params;
    const [connected, setConnected] = useState<boolean | null>(null);
    const isLightBulb = device.serviceUUIDs?.includes(ESP32_SERVICE_UUID);

    const [rgbw, setRGBW] = useState({r: 255, g: 0, b: 0, w: 0});

    useEffect(() => {
        let subscription: any;

        const checkConnection = async () => {
            try {
                const connectedDevice = await bleManager.isDeviceConnected(device.id);
                setConnected(connectedDevice);
            } catch (error) {
                console.error('Error checking connection:', error);
                setConnected(false);
            }
        };

        subscription = bleManager.onDeviceDisconnected(device.id, () => {
            console.log('Device disconnected');
            setConnected(false);
        });

        checkConnection();

        return () => {
            subscription.remove();
        };
    }, [device.id]);

    useEffect(() => {
        const payload = buildCommand(rgbw);
        sendColorToDevice(device, payload);
    }, [device, rgbw]);

    const hexToRGB = (hex: string) => {
        let r = 0, g = 0, b = 0;
        if (hex.length === 7) {
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return {r, g, b};
    };

    const onSelectRGB = ({hex}: { hex: string }) => {
        const {r, g, b} = hexToRGB(hex);
        setRGBW(previous => ({...previous, r, g, b}));
    };

    const onSelectWhite = ({hex}: { hex: string }) => {
        const {r: w} = hexToRGB(hex);
        setRGBW(previous => ({...previous, w}));
    };

    return (
        <View style={styles.container}>
            <Text variant="titleLarge">{device.name || 'Unknown Device'}</Text>
            <Text variant="bodyMedium">{device.id}</Text>
            <Text variant="bodySmall">{isLightBulb ? 'Detected' : 'Unknown device'}</Text>
            <Text>Sent counter: {debugCounter}, payload: {buildCommand(rgbw)}</Text>

            <ColorPicker value="red" onComplete={onSelectRGB}>
                <Preview/>
                <Panel1 style={styles.panelStyle}/>
                <HueSlider style={styles.sliderStyle}/>
            </ColorPicker>

            <ColorPicker value="#FFF4E5" onComplete={onSelectWhite}>
                <Preview/>
                <BrightnessSlider style={styles.sliderStyle}/>
            </ColorPicker>
        </View>
    );
}

export default DeviceScreen;
