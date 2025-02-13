import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { useTheme, Button } from 'react-native-paper';


function App(): React.JSX.Element {
  const theme = useTheme();

  return (
      <SafeAreaView style={{ backgroundColor: theme.colors.primary }}>
        <Text>Test2</Text>

        <Button theme={{ roundness: 3 }}>
          Press
        </Button>
      </SafeAreaView>
  );
}

export default App;
