import { View, StyleSheet, Button, useWindowDimensions, Text } from 'react-native';
import * as React from 'react';
import RenderHtml from 'react-native-render-html';
import { WebView } from 'react-native-webview';

const source = {
  html: `
  <body>
<h1>Stalker Identification Device</h1>
<img src="http://172.20.10.4:8000/stream.mjpg" width="640" height="480">
</body>`
};

export default function App() {
  const { width } = useWindowDimensions();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SID</Text>
      <Text style={styles.body}>Live feed</Text>
      <WebView source={{uri: 'http://172.20.10.4:8000/stream.mjpg'}}/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 50,
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 'bold',
    margin: 10
  },
  body: {
    alignSelf: 'center'
  }
});
