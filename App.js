import { View, StyleSheet, Text, Switch, Button, TouchableOpacity } from 'react-native';
import * as React from 'react';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import * as Linking from "expo-linking"

export default function App() {
  const [isArmed, setArmed] = useState(true)
  const [contactName, setContactName] = useState("Brody")
  const [contactPhone, setContactPhone] = useState("+18502522527")
  function switchCallback () {
    if(isArmed) {
      fetch('http://172.20.10.4:8000/disarm', {method: "GET"}).then(() => {
        setArmed(false)
      }).catch((err) => {
        console.error(err);
      })
    }
    else {
      fetch('http://172.20.10.4:8000/arm', {method: "GET"}).then(() => {
        setArmed(true)
      }).catch((err) => {
        console.error(err);
      })
    }
  }
  function onCallPress() {
    Linking.openURL(`tel:${contactPhone}`).then(() => {
      console.log(`Successfully called ${contactPhone}`)
    }).catch((err) => {
      console.error(err)
    })
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SID</Text>
      <Text style={styles.body}>Live feed</Text>
      {isArmed ? <WebView style={styles.video} source={{uri: 'http://172.20.10.4:8000/stream.mjpg'}}/> : <View style={styles.disarm}><Text style={styles.body}>The camera is turned off</Text></View>}
      {isArmed ? <Text style={styles.body}>Armed</Text> : <Text style={styles.body}>Disarmed</Text>}
      <Switch style={styles.switch} onValueChange={switchCallback} value={isArmed}/>
      <TouchableOpacity style={styles.call_button} onPress={onCallPress}>
        <Text style={styles.call_text}>
        Call {contactName}
        </Text>
      </TouchableOpacity>
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
    alignSelf: 'center',
    textAlign: 'center'
  },
  video: {
    height: 640,
    width: 700,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  disarm: {
    height: 545,
    alignSelf: 'center',
    justifyContent: 'center',
  },
  switch: {
    alignSelf: 'center'
  },
  call_button: {
    borderRadius: 10,
    backgroundColor: 'red',
    alignSelf: 'center',
    borderWidth:5,
    borderColor: 'red',
    margin: 20
  },
  call_text: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 25
  }
});
