import React, {useEffect, useState} from "react";
import {FlatList, PermissionsAndroid, Platform, TouchableOpacity, View} from "react-native";
import {Button, Card, Provider as PaperProvider, Text} from "react-native-paper";
import {BleManager, Device, State} from "react-native-ble-plx";


const bleManager = new BleManager();

function HomeScreen({navigation}) {
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
            <View style={{flex: 1, padding: 20}}>
                <Text variant="titleLarge" style={{marginBottom: 20, textAlign: "center"}}>
                    Bluetooth Devices
                </Text>

                {bluetoothState === State.PoweredOff ? (
                    <Text style={{textAlign: "center", color: "red", marginBottom: 20}}>
                        ❌ Bluetooth is OFF. Please turn it on.
                    </Text>
                ) : (
                    <>
                        <Button mode="contained" onPress={startScan} loading={scanning} style={{marginBottom: 20}}>
                            {scanning ? "Scanning..." : "Refresh Devices"}
                        </Button>

                        <FlatList
                            data={devices}
                            keyExtractor={(item) => item.id}
                            renderItem={({item}) => (
                                <TouchableOpacity onPress={() => navigation.navigate("Device", {device: item})}>
                                    <Card style={{marginBottom: 10}}>
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

export default HomeScreen;