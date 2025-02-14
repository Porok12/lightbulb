import React from 'react';
import {adaptNavigationTheme, MD3DarkTheme, MD3LightTheme, Provider as PaperProvider} from 'react-native-paper';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
    DarkTheme as NavigationDarkTheme,
    DefaultTheme as NavigationDefaultTheme,
    NavigationContainer,
} from '@react-navigation/native';
import type {Device} from 'react-native-ble-plx';
import HomeScreen from './HomeScreen.tsx';
import DeviceScreen from './DeviceScreen.tsx';

/**
 * https://reactnavigation.org/docs/typescript/?config=dynamic
 */
export type RootStackParamList = {
    HomeScreen: undefined;
    DeviceScreen: { device: Device };
};
const RootStack = createNativeStackNavigator<RootStackParamList>();


const {LightTheme, DarkTheme} = adaptNavigationTheme({
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
            <NavigationContainer theme={CombinedDarkTheme as any}>
                <RootStack.Navigator initialRouteName="HomeScreen">
                    <RootStack.Screen name="HomeScreen" component={HomeScreen}/>
                    <RootStack.Screen name="DeviceScreen" component={DeviceScreen}/>
                </RootStack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}
