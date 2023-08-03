import { View, StyleSheet, Text, Switch, ActivityIndicator, TouchableOpacity } from 'react-native';
import React from 'react';
import { WebView } from 'react-native-webview';
import { useState, useEffect, useRef } from 'react';
import * as Linking from "expo-linking";
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Colors } from 'react-native/Libraries/NewAppScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
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
  const { user, signOut } = useAuthenticator((context) => [context.user]);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [isLoading, setLoading] = useState(false)
  const notificationListener = useRef();
  const responseListener = useRef();
  var emergencyContactName = user != undefined && user.attributes != undefined && 'custom:emergency-contact' in user.attributes ? user.attributes['custom:emergency-contact'] : 'Emergency Contact'

  useEffect(() => {
    registerForPushNotificationsAsync().then(token => {
      setExpoPushToken(token);
    });

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);


  const switchCallback = () => {
    setLoading(true)
    if (isArmed) {
      fetch('http://raspberrypi.local:8000/disarm', { method: "GET" }).then(() => {
        setArmed(false);
      }).catch((err) => {
        alert('Failed to disarm. Please retry or restart device')
        console.error(err);
      }).finally(() => {
        setLoading(false)
      })
    }
    else {
      fetch('http://raspberrypi.local:8000/arm', { method: "GET", headers: { 'username': user.username, 'device_token': expoPushToken } }).then(() => {
        setArmed(true);
      }).catch((err) => {
        alert('Failed to arm. Please retry or restart device')
        console.error(err);
      }).finally(() => {
        setLoading(false)
      })
    }
  }

  const onCallPress = () => {
    Linking.openURL(`tel:${user.attributes['custom:emergency-number']}`).then(() => {
      console.log(`Successfully called ${user.attributes['custom:emergency-number']}`);
    }).catch((err) => {
      console.error(err);
    })
  }

  const onEmergencyCallPress = () => {
    Linking.openURL(`tel:911`).then(() => {
      console.log(`Successfully called 911`);
    }).catch((err) => {
      console.error(err);
    })
  }

  return (
    <View style={styles.container}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
        </View>
        <View style={{ flex: 3, justifyContent: 'space-around' }}>
          <Text style={styles.title}>S.I.D</Text>
        </View>
        <View style={{ flex: 1 }}>
          <TouchableOpacity style={styles.regular_button} onPress={signOut}>
            <Text style={{ textAlign: 'center' }}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.body}>Live feed</Text>
      <View style={styles.video}>
        {isArmed ?
          <WebView style={{ height: '100%' }} allowsFullscreenVideo={true} source={{ uri: 'http://raspberrypi.local:8000/stream.mjpg' }} /> :
          <View style={{ alignSelf: 'center', flex: 1, justifyContent: 'space-around' }}><Text style={styles.body}>The camera is turned off</Text></View>}
      </View>
      <View style={{flex:0.5, justifyContent: 'space-around'}}>
        {isLoading ? <ActivityIndicator style={{alignSelf: 'center'}} size={"large"} /> :
          <View>
            {isArmed ? <Text style={styles.body}>Armed</Text> : <Text style={styles.body}>Disarmed</Text>}
            <Switch style={styles.switch} trackColor={{ true: 'grey', false: 'grey' }} thumbColor={isArmed ? 'red' : '#005249'} ios_backgroundColor='grey'
              onValueChange={switchCallback} value={isArmed} />
          </View>}
      </View>
      <View style={{ flexDirection: 'row', flex: 0.75, justifyContent: 'space-around', marginTop: '5%' }}>
        <TouchableOpacity style={styles.call_button} onPress={onCallPress}>
          <Text style={styles.call_text}>Call {emergencyContactName}</Text>
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
    padding: 50,
    backgroundColor: 'black'
  },
  title: {
    fontSize: 30,
    alignSelf: 'center',
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'white'
  },
  body: {
    alignSelf: 'center',
    textAlign: 'center',
    color: 'white'
  },
  video: {
    flex: 4
  },
  switch: {
    alignSelf: 'center',
    transform: [{ scaleX: 1.5 }, { scaleY: 1.5 }],
    margin: 10
  },
  emergency_call_button: {
    borderRadius: '100%',
    backgroundColor: '#ce2029',
    alignSelf: 'center',
    borderColor: '#ce2029',
    flex: 1,
    height: '100%',
    justifyContent: 'space-around',
    marginLeft: '5%'
  },
  call_button: {
    borderRadius: '100%',
    backgroundColor: '#D8863B',
    alignSelf: 'center',
    borderColor: '#D8863B',
    flex: 1,
    height: '100%',
    justifyContent: 'space-around',
    marginRight: '5%'
  },
  call_text: {
    alignSelf: 'center',
    textAlign: 'center',
    fontSize: 25
  },
  regular_button: {
    borderRadius: '100%',
    backgroundColor: '#ADD8E6',
    alignSelf: 'center',
    borderColor: '#ADD8E6',
    justifyContent: 'space-around',
    borderWidth: '10%'
  },
});
