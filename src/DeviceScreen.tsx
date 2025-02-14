import React, {useEffect, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import {Text} from 'react-native-paper';
import ColorPicker, {HueSlider, Panel2, Panel1, Preview, BrightnessSlider} from 'reanimated-color-picker';
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
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
    sliderStyle: {
        borderRadius: 20,
        marginTop: 20,

        shadowColor: '#888',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

        elevation: 5,
    },
});

const bleManager = new BleManager();

type DeviceScreenProps = NativeStackScreenProps<RootStackParamList, 'DeviceScreen'>;

const sendColorToDevice = async (device: Device, hex: string) => {
    try {
        const DEVICE_CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';
        //const rgbBytes = hexToRGBBytes(hex);
        const rgbBytes = [255, 0, 0, 0];
        const byteArray = new Uint8Array(rgbBytes); // Convert to Uint8Array

        console.log(`Sending color ${hex} as bytes:`, byteArray);

        // Connect to device if not already connected
        const connectedDevice = await bleManager.connectToDevice(device.id);
        await connectedDevice.discoverAllServicesAndCharacteristics();

        await connectedDevice.writeCharacteristicWithoutResponseForService(
            DEVICE_CHARACTERISTIC_UUID,
            DEVICE_CHARACTERISTIC_UUID,
            Buffer.from(byteArray).toString('base64'),
        );
    } catch (error) {
        console.error('Error sending color:', error);
    }
};

function DeviceScreen({route}: DeviceScreenProps) {
    const {device} = route.params;
    const [connected, setConnected] = useState<boolean | null>(null);

    useEffect(() => {
        let subscription: any;

        // Check initial connection status
        const checkConnection = async () => {
            try {
                const connectedDevice = await bleManager.isDeviceConnected(device.id);
                setConnected(connectedDevice);
            } catch (error) {
                console.error('Error checking connection:', error);
                setConnected(false);
            }
        };

        // Listen for device disconnection
        subscription = bleManager.onDeviceDisconnected(device.id, () => {
            console.log('Device disconnected');
            setConnected(false);
        });

        checkConnection(); // Initial check on component mount

        return () => {
            subscription.remove(); // Cleanup on unmount
        };
    }, [device.id]);

    const onSelectColor = ({hex}: { hex: string }) => {
        console.log(hex);
    };

    return (
        <View style={styles.container}>
            <Text variant="titleLarge">{device.name || 'Unknown Device'}</Text>
            <Text variant="bodyMedium">{device.id}</Text>
            <Text variant="bodySmall">Connected {connected}</Text>

            <ColorPicker value="red" onComplete={onSelectColor}>
                <Preview/>
                <Panel1 style={styles.panelStyle}/>
                <HueSlider style={styles.sliderStyle}/>
            </ColorPicker>
            <ColorPicker value="#FFF4E5" onComplete={onSelectColor}>
                <Preview/>
                <BrightnessSlider style={styles.sliderStyle} />
            </ColorPicker>
        </View>
    );
}

export default DeviceScreen;
