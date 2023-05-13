import { useWindowDimensions, StyleSheet } from 'react-native';
import * as React from 'react';
import RenderHtml from 'react-native-render-html';

const source = {
  html: `
  <img src='http://172.20.10.4:8000/index.html' width="640" height="480"/>`
};

export default function App() {
  const { width } = useWindowDimensions();
  return (
    <RenderHtml source={source} contentWidth={width}/>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
