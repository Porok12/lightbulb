import React from 'react';
import {View} from 'react-native';
import {Provider as PaperProvider, Text} from 'react-native-paper';
import ColorPicker, {Panel1, Preview} from 'reanimated-color-picker';

function DeviceScreen({route}) {
    const {device} = route.params;

    const onSelectColor = ({hex}) => {
        console.log(hex);
    };

    return (
        <PaperProvider>
            <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                <Text variant="titleLarge">Test</Text>
                <Text variant="bodyMedium">{device.name || 'Unknown Device'}</Text>
                <Text variant="bodySmall">{device.id}</Text>

                <ColorPicker style={{width: '70%'}} value="red" onComplete={onSelectColor}>
                    <Preview/>
                    <Panel1/>
                </ColorPicker>
            </View>
        </PaperProvider>
    );
}

export default DeviceScreen;
