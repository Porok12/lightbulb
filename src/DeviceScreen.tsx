import React, {useEffect, useState} from 'react';
import {StyleSheet, useWindowDimensions, View} from 'react-native';
import {Button, Text, useTheme} from 'react-native-paper';
import ColorPicker, {
    BrightnessSlider,
    HSLSaturationSlider,
    HueSlider,
    LuminanceSlider,
    Panel2,
    Preview,
} from 'reanimated-color-picker';
import {Device} from 'react-native-ble-plx';
import {Route, SceneRendererProps, TabBar, TabView} from 'react-native-tab-view';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from './App.tsx';
import BLEDeviceHandler, {services} from './BLEDeviceHandler.ts';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'space-between',
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

let debugCounter = 0;
let errorCounter = 0;
let errorMsg: string = '';

const routes = [
    {key: 'info', title: 'Info'},
    {key: 'color', title: 'Color'},
    {key: 'debug', title: 'Debug'},
];

type InfoRouteProps = {
    device: Device;
    connected: boolean;
    onConnect?: () => void;
    onConnected?: () => void;
};

const InfoRoute = (props: InfoRouteProps) => {
    const {device, connected, onConnect, onConnected} = props;

    const [loading, setLoading] = useState(false);
    const [firmwareVersion, setFirmwareVersion] = useState<string | null>(null);
    const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

    useEffect(() => {
        if (connected) {
            BLEDeviceHandler.readFirmwareVersion().then(version => setFirmwareVersion(version));
            BLEDeviceHandler.readBatteryLevel().then(level => setBatteryLevel(level));
        }
    }, [connected]);

    const handleConnect = () => {
        const onSuccessful = () => {
            // onConnect?.();
        };
        const onError = (error: any) => {
            errorMsg = `HandleConnect: ${error}`;
        };
        setLoading(true);
        BLEDeviceHandler.connectToDevice(device, onSuccessful)
            .then(() => {
                onConnected?.();
            })
            .catch(error => {
                errorMsg = `ConnectToDevice: ${error}`;
            })
            .finally(() => {
                setLoading(false);
            });
    };

    return (
        <View style={styles.container}>
            <View>
                <Text variant="titleLarge">{device.name || 'Unknown Device'}</Text>
                <Text variant="bodyMedium">{device.id}</Text>
                <Text variant="bodySmall">Connection status: {connected ? 'Connected' : 'Disconnected'}</Text>

                <Text variant="titleLarge" style={{marginTop: 10}}>Services</Text>
                {device.serviceUUIDs?.includes(services.deviceInfo.serviceUUID) && (
                    <>
                        <Text variant="titleSmall">Device Info</Text>
                        <Text variant="bodyMedium">Firmware version: {firmwareVersion}</Text>
                    </>
                )}
                {device.serviceUUIDs?.includes(services.battery.serviceUUID) && (
                    <>
                        <Text variant="titleSmall">Battery</Text>
                        <Text variant="bodyMedium">Level: {batteryLevel}</Text>
                    </>
                )}
                {device.serviceUUIDs?.includes(services.light.serviceUUID) && (
                    <>
                        <Text variant="titleSmall">Light</Text>
                        <Text variant="bodyMedium">---</Text>
                    </>
                )}
                <Text variant="bodyMedium">Others</Text>
                <Text variant="bodySmall">{JSON.stringify(device.serviceUUIDs)}</Text>
            </View>

            <Button mode="contained"
                    onPress={handleConnect}
                    loading={loading}
                    disabled={connected}
                    style={{alignSelf: 'stretch', marginTop: 20}}>
                <Text adjustsFontSizeToFit>
                    Connect
                </Text>
            </Button>
        </View>
    );
};

type ColorRouteProps = {
    device: Device;
}

const ColorRoute = ({device}: ColorRouteProps) => {
    const [rgbw, setRGBW] = useState({r: 255, g: 0, b: 0, w: 0});
    useEffect(() => {
        const onSuccess = () => {
            debugCounter++;
        };
        const onError = (error: any) => {
            errorCounter++;
            errorMsg = `WriteColor: ${error}`;
        };
        BLEDeviceHandler.writeLightColor(rgbw, onSuccess, onError)
            .then(() => {
            })
            .catch(error => {
            });
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
            <Text variant="bodyMedium">{JSON.stringify(rgbw)}</Text>

            <ColorPicker value="red" onComplete={onSelectRGB}>
                <Preview/>
                <Panel2 style={styles.panelStyle}/>
                <HueSlider style={styles.sliderStyle}/>
                <HSLSaturationSlider style={styles.sliderStyle}/>
                <LuminanceSlider style={styles.sliderStyle}/>
            </ColorPicker>

            <ColorPicker value="#FFF4E5" onComplete={onSelectWhite}>
                <Preview/>
                <BrightnessSlider style={styles.sliderStyle}/>
            </ColorPicker>
        </View>
    );
};


type DebugRouteProps = {
    device: Device;
}

const DebugRoute = ({device}: DebugRouteProps) => {

    useEffect(() => {
    }, [debugCounter, errorCounter, errorMsg]);

    return (
        <View style={styles.container}>
            <Text variant="titleLarge">Sent counter: {debugCounter}, error: {errorCounter}</Text>
            <Text variant="bodyLarge">{errorMsg}</Text>
        </View>
    );
};

type DeviceScreenProps = NativeStackScreenProps<RootStackParamList, 'DeviceScreen'>;

function DeviceScreen({route}: DeviceScreenProps) {
    const {device} = route.params;
    const [connected, setConnected] = useState<boolean>(false);
    const handleConnected = () => setConnected(true);

    const layout = useWindowDimensions();
    const [index, setIndex] = React.useState(0);
    const {colors} = useTheme();

    useEffect(() => {
        let subscription: any;

        const checkConnection = async () => {
            try {
                const connectedDevice = await BLEDeviceHandler.isDeviceConnected(device.id);
                setConnected(connectedDevice);
            } catch (error) {
                console.error('Error checking connection:', error);
                setConnected(false);
            }
        };

        subscription = BLEDeviceHandler.onDeviceDisconnected(device.id, () => {
            console.log('Device disconnected');
            setConnected(false);
        });

        checkConnection();

        return () => {
            subscription.remove();
        };
    }, [device.id]);

    const renderScene = (props: SceneRendererProps & { route: Route }) => {
        switch (props.route.key) {
            case 'info':
                return <InfoRoute device={device}
                                  connected={connected}
                                  onConnected={handleConnected}
                />;
            case 'color':
                return <ColorRoute device={device}/>;
            case 'debug':
                return <DebugRoute device={device}/>;
            default:
                return null;
        }
    };

    return (
        <TabView
            navigationState={{index, routes}}
            renderScene={renderScene}
            onIndexChange={setIndex}
            initialLayout={{width: layout.width}}
            swipeEnabled={false}
            renderTabBar={props => (
                <TabBar
                    {...props}
                    style={{backgroundColor: colors.primary}}
                    indicatorStyle={{backgroundColor: colors.outline}}
                    activeColor={colors.onPrimary}
                    inactiveColor={colors.onSurface}
                />
            )}
        />
    );
}

export default DeviceScreen;
