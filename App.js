import { View, StyleSheet, Text, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import * as React from 'react';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import * as Linking from "expo-linking";
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// >>New - Configuring Auth Module
Amplify.configure(awsconfig);

export default AuthenticatedApp;

function AuthenticatedApp() {
  return (
    <Authenticator.Provider>
      <Authenticator
        components={{
          SignUp: ({ fields, ...props }) => (
            <Authenticator.SignUp
              {...props}
              fields={[
                ...fields,
                {
                  name: 'custom:emergency-contact',
                  label: 'Emergency Contact Name',
                  type: 'custom',
                  placeholder: 'Enter your contact name',
                },
                {
                  name: 'custom:emergency-number',
                  label: 'Emergency Contact Phone Number',
                  type: 'custom',
                  placeholder: 'Enter your contact number',
                },
              ]}
            />
          ),
        }}
      >
        <App />
      </Authenticator>
    </Authenticator.Provider>
  );
}

function App() {
  const [isArmed, setArmed] = useState(false);
  const { user, signOut } = useAuthenticator();
  const [expoPushToken, setExpoPushToken] = useState('');
  // const [notification, setNotification] = useState(false);
  const [isLoading, setLoading] = useState(false);
  // const notificationListener = useRef();
  // const responseListener = useRef();

  // useEffect(() => {
  //   registerForPushNotificationsAsync().then(token => {
  //     setExpoPushToken(token);
  //   });

  //   notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
  //     setNotification(notification);
  //   });

  //   responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
  //     console.log(response);
  //   });

  //   return () => {
  //     Notifications.removeNotificationSubscription(notificationListener.current);
  //     Notifications.removeNotificationSubscription(responseListener.current);
  //   };
  // }, []);


  function switchCallback() {
    setLoading(true)
    if (isArmed) {
      fetch('http://raspberrypi.local:8000/disarm', { method: "GET" }).then(() => {
        setArmed(false)
      }).catch((err) => {
        console.error(err);
      })
    }
    else {
      fetch('http://raspberrypi.local:8000/arm', { method: "GET", headers: {'username': user.username, 'device_token': expoPushToken} }).then(() => {
        setArmed(true)
      }).catch((err) => {
        console.error(err);
      })
    }
    setLoading(false)
  }

  function onCallPress() {
    Linking.openURL(`tel:${user.attributes['custom:emergency-number']}`).then(() => {
      console.log(`Successfully called ${user.attributes['custom:emergency-number']}`)
    }).catch((err) => {
      console.error(err)
    })
  }

  function onEmergencyCallPress() {
    Linking.openURL(`tel:911`).then(() => {
      console.log(`Successfully called 911`)
    }).catch((err) => {
      console.error(err)
    })
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.regular_button} onPress={signOut}>
        <Text style={styles.body}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Welcome to SID</Text>
      <Text style={styles.body}>Live feed</Text>
      {isArmed ? <WebView style={styles.video} source={{ uri: 'http://raspberrypi.local:8000/stream.mjpg' }} /> : <View style={styles.disarm}><Text style={styles.body}>The camera is turned off</Text></View>}
      {isLoading ? <ActivityIndicator/> : 
      <View>
        {isArmed ? <Text style={styles.body}>Armed</Text> : <Text style={styles.body}>Disarmed</Text>}
        <Switch style={styles.switch} onValueChange={switchCallback} value={isArmed} />
      </View>
      }
      <View style={{flexDirection: 'row', alignSelf: "center", alignContent: "space-around"}}>
      <TouchableOpacity style={styles.call_button} onPress={onCallPress}>
        <Text style={styles.call_text}>Call {user.attributes['custom:emergency-contact']}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.emergency_call_button} onPress={onEmergencyCallPress}>
        <Text style={styles.call_text}>Call 911</Text>
      </TouchableOpacity>
      </View>
      
    </View>
  );
}

async function registerForPushNotificationsAsync() {
  let token;
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log(token);
  } else {
    alert('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 50,
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
  emergency_call_button: {
    borderRadius: 10,
    backgroundColor: '#ce2029',
    alignSelf: 'center',
    borderWidth: 5,
    borderColor: '#ce2029',
    margin: 20
  },
  call_button: {
    borderRadius: 10,
    backgroundColor: '#FF5F15',
    alignSelf: 'center',
    borderWidth: 5,
    borderColor: '#FF5F15',
    margin: 20
  },
  call_text: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 25
  },
  regular_button: {
    borderRadius: 10,
    backgroundColor: '#ADD8E6',
    alignSelf: 'center',
    borderWidth: 5,
    borderColor: '#ADD8E6',
    position: 'absolute',
    right: 10
  },
});
