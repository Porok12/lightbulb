import React, { useState, useEffect } from "react";
import { View, FlatList, PermissionsAndroid, Platform, TouchableOpacity } from "react-native";
import { Provider as PaperProvider, Button, Text, Card } from "react-native-paper";
import { BleManager, Device, State } from "react-native-ble-plx";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import {
    NavigationContainer,
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
import {
    MD3DarkTheme,
    MD3LightTheme,
    adaptNavigationTheme,
} from 'react-native-paper';
import ColorPicker, { Panel1, Swatches, Preview, OpacitySlider, HueSlider } from "reanimated-color-picker";

const bleManager = new BleManager();
const Stack = createNativeStackNavigator();

// 🔹 Home Screen (BLE Scanner)
function HomeScreen({ navigation }) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [scanning, setScanning] = useState(false);
    const [bluetoothState, setBluetoothState] = useState<State | null>(null);

    useEffect(() => {
        requestPermissions();
        checkBluetoothState();
    }, []);

    // Request Bluetooth permissions (Android only)
    const requestPermissions = async () => {
        if (Platform.OS === "android") {
            await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
            ]);
        }
    };

    // Check if Bluetooth is ON or OFF
    const checkBluetoothState = () => {
        bleManager.state().then(setBluetoothState);
        bleManager.onStateChange((newState) => setBluetoothState(newState), true);
    };

    // Start scanning for BLE devices
    const startScan = () => {
        if (bluetoothState !== State.PoweredOn) return;

        setDevices([]);
        setScanning(true);

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error("Scan Error:", error);
                setScanning(false);
                return;
            }

            if (device && device.name) {
                setDevices((prevDevices) => {
                    const exists = prevDevices.some((d) => d.id === device.id);
                    return exists ? prevDevices : [...prevDevices, device];
                });
            }
        });

        // Stop scanning after 5 seconds
        setTimeout(() => {
            bleManager.stopDeviceScan();
            setScanning(false);
        }, 5000);
    };

    return (
        <PaperProvider>
            <View style={{ flex: 1, padding: 20 }}>
                <Text variant="titleLarge" style={{ marginBottom: 20, textAlign: "center" }}>
                    Bluetooth Devices
                </Text>

                {bluetoothState === State.PoweredOff ? (
                    <Text style={{ textAlign: "center", color: "red", marginBottom: 20 }}>
                        ❌ Bluetooth is OFF. Please turn it on.
                    </Text>
                ) : (
                    <>
                        <Button mode="contained" onPress={startScan} loading={scanning} style={{ marginBottom: 20 }}>
                            {scanning ? "Scanning..." : "Refresh Devices"}
                        </Button>

                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => navigation.navigate("Device", { device: item })}>
                                    <Card style={{ marginBottom: 10 }}>
                                        <Card.Content>
                                            <Text variant="titleMedium">{item.name || "Unknown Device"}</Text>
                                            <Text variant="bodySmall">{item.id}</Text>
                                        </Card.Content>
                                    </Card>
                                </TouchableOpacity>
                            )}
                        />
                    </>
                )}
            </View>
        </PaperProvider>
    );
}

// 🔹 Device Screen (Opens when a device is clicked)
function DeviceScreen({ route }) {
    const { device } = route.params;

    const onSelectColor = ({ hex }) => {
        console.log(hex);
    };

    return (
        <PaperProvider>
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center"}}>
                <Text variant="titleLarge">Test</Text>
                <Text variant="bodyMedium">{device.name || "Unknown Device"}</Text>
                <Text variant="bodySmall">{device.id}</Text>

                <ColorPicker style={{ width: '70%' }} value='red' onComplete={onSelectColor}>
                    <Preview />
                    <Panel1 />
                </ColorPicker>
            </View>
        </PaperProvider>
    );
}

const { LightTheme, DarkTheme } = adaptNavigationTheme({
    reactNavigationLight: NavigationDefaultTheme,
    reactNavigationDark: NavigationDarkTheme,
});

const CombinedDefaultTheme = {
    ...MD3LightTheme,
    ...LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        ...LightTheme.colors,
    },
};
const CombinedDarkTheme = {
    ...MD3DarkTheme,
    ...DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        ...DarkTheme.colors,
    },
};

export default function App() {
    return (
        <PaperProvider theme={CombinedDarkTheme}>
            <NavigationContainer theme={CombinedDarkTheme}>
                <Stack.Navigator initialRouteName="Home">
                    <Stack.Screen name="Home" component={HomeScreen} />
                    <Stack.Screen name="Device" component={DeviceScreen} />
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}
