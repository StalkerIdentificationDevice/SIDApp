import { View, StyleSheet, Text, Switch, Button, TouchableOpacity } from 'react-native';
import * as React from 'react';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import * as Linking from "expo-linking";
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';

// TaskManager.defineTask("get-shot", async () => {
//   console.log("running async function")
//   await fetch('http://raspberrypi.local:8000/shot', {method: "GET", headers: {"username": username}})
//   return BackgroundFetch.BackgroundFetchResult.NoData;
// });

export default function App() {
  const [isArmed, setArmed] = useState(true)
  const [contactName, setContactName] = useState("Brody")
  const [contactPhone, setContactPhone] = useState("+18502522527")
  const [username, setUsername] = useState("example_user")
  function switchCallback () {
    if(isArmed) {
      fetch('http://raspberrypi.local:8000/disarm', {method: "GET"}).then(() => {
        setArmed(false)
      }).catch((err) => {
        console.error(err);
      })
    }
    else {
      fetch('http://raspberrypi.local:8000/arm', {method: "GET"}).then(() => {
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

  function useInterval(callback, delay) {
    const savedCallback = useRef();
  
    // Remember the latest callback.
    useEffect(() => {
      savedCallback.current = callback;
    }, [callback]);
  
    // Set up the interval.
    useEffect(() => {
      function tick() {
        savedCallback.current();
      }
      if (delay !== null) {
        let id = setInterval(tick, delay);
        return () => clearInterval(id);
      }
    }, [delay]);
  }

  useInterval(() => {
    console.log("attempting callback")
    fetch('http://raspberrypi.local:8000/shot', {method: "GET", headers: {"username": username}}).then(() => {
      console.log("it worked!");
    }).catch((err) => {
      console.error(err);
    })
  }, 60000)

  // useEffect(() => {
  //   async function registerBackgroundFetchAsync() {
  //     console.log("registering async function");
  //     await BackgroundFetch.registerTaskAsync("get-shot", {
  //       minimumInterval: 5
  //     });
  //     const status = await BackgroundFetch.getStatusAsync();
  //     const isRegistered = await TaskManager.isTaskRegisteredAsync("get-shot");
      
  //     console.log("completed registering async function with status: " + status)
  //     console.log("is registered = " + isRegistered);
  //   }
  //   registerBackgroundFetchAsync().then(() => {
  //     console.log("it worked!")
  //   });
  // }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to SID</Text>
      <Text style={styles.body}>Live feed</Text>
      {isArmed ? <WebView style={styles.video} source={{uri: 'http://raspberrypi.local:8000/stream.mjpg'}}/> : <View style={styles.disarm}><Text style={styles.body}>The camera is turned off</Text></View>}
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
