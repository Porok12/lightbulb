import React, {useEffect, useState} from 'react';
import {FlatList, StyleSheet, TouchableOpacity, View} from 'react-native';
import {Button, Card, Text} from 'react-native-paper';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {BleManager, Device, State} from 'react-native-ble-plx';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {RootStackParamList} from './App';
import BLEDeviceHandler from './BLEDeviceHandler';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        gap: 4,
    },
    cardItem: {
        padding: 10,
        margin: 10,
    },
    cardContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    searchButton: {
        marginBottom: 20,
    },
    centerIcon: {
        textAlign: 'center',
        flexGrow: 1,
    },
});

const DisabledBluetoothNotice = () => (
    <>
        <Text variant="headlineMedium">
            <FontAwesome name="bluetooth" size={32}/>
            {' '}
            Bluetooth is disabled
        </Text>
    </>
);

const DeviceCard = ({device}: { device: Device }) => {
    const [services, setServices] = useState<string[]>([]);

    useEffect(() => {
        const fetchServices = async () => {
            try {
                await device.discoverAllServicesAndCharacteristics();
                const serviceList = await device.services();
                setServices(serviceList.map(s => s.uuid));
            } catch (e) {
                // Will fail if not connected
                setServices([]);
            }
        };

        fetchServices();
    }, [device]);

    return (
        <Card style={styles.cardItem}>
            <View style={styles.cardContent}>
                <View>
                    <Text variant="titleMedium">{device.name || 'Unknown Device'}</Text>
                    <Text variant="bodySmall">{device.id}</Text>
                </View>
                <FontAwesome name="bluetooth" size={24} color="gray"/>
            </View>
        </Card>
    );
};


const bleManager = new BleManager();

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'HomeScreen'>;

function HomeScreen({navigation}: HomeScreenProps) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [scanning, setScanning] = useState(false);
    const [bluetoothState, setBluetoothState] = useState<State | null>(null);

    useEffect(() => {
        BLEDeviceHandler.requestPermissions();
        checkBluetoothState();
    }, []);

    const checkBluetoothState = () => {
        bleManager.state().then(setBluetoothState);
        bleManager.onStateChange((newState) => setBluetoothState(newState), true);
    };

    const startScan = () => {
        if (bluetoothState !== State.PoweredOn) {
            return;
        }

        setDevices([]);
        setScanning(true);

        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.error('Scan Error:', error);
                setScanning(false);
                return;
            }

            if (device) {
                setDevices((prevDevices) => {
                    const exists = prevDevices.some((d) => d.id === device.id);
                    return exists ? prevDevices : [...prevDevices, device];
                });
            }
        });

        setTimeout(() => {
            bleManager.stopDeviceScan();
            setScanning(false);
        }, 8000);
    };

    return (
        <View style={styles.container}>
            <Text variant="titleLarge" style={{marginBottom: 20, textAlign: 'center'}}>
                Devices
            </Text>

            {bluetoothState === State.PoweredOff && (<DisabledBluetoothNotice/>)}

            {bluetoothState === State.PoweredOn && devices.length === 0 && (
                <Text style={styles.centerIcon}>
                    <FontAwesome name="inbox" size={128}/>
                </Text>
            )}

            {bluetoothState === State.PoweredOn && devices.length > 0 && (
                <>
                    <FlatList
                        data={devices}
                        keyExtractor={(item: Device) => item.id}
                        renderItem={({item}) => (
                            <TouchableOpacity key={item.id}
                                              onPress={() => navigation.navigate('DeviceScreen', {device: item})}>
                                <DeviceCard key={item.id} device={item}/>
                            </TouchableOpacity>
                        )}
                    />
                </>
            )}

            <Button mode="contained"
                    onPress={startScan}
                    loading={scanning}
                    disabled={scanning || bluetoothState !== State.PoweredOn}
                    style={styles.searchButton}>
                <Text adjustsFontSizeToFit>
                    <FontAwesome name="search" size={16}/>
                    {' '}
                    {scanning ? 'Scanning...' : 'Search Devices'}
                </Text>
            </Button>

        </View>
    );
}

export default HomeScreen;
