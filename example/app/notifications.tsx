import * as Notifications from 'expo-horizon-notifications';
import React from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '../components/Section';
import { TestButton } from '../components/TestButton';
import { GlobalStyles } from '../constants/styles';
import BackgroundTaskSection from '../sections/notifications/background-task';
import NotificationResponseSection from '../sections/notifications/notification-response';

Notifications.setNotificationHandler({
  handleNotification: async () => {
    return {
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();

  const requestPermissions = async () => {
    const result = await Notifications.requestPermissionsAsync();
    console.log(result);
  };

  const getPermissions = async () => {
    const result = await Notifications.getPermissionsAsync();
    console.log(result);
  };

  const sendNotification = async () => {
    const result = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hello',
        body: 'World',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 2,
      },
    });
    console.log(result);
  };

  const getPushToken = async () => {
    try {
      const result = await Notifications.getDevicePushTokenAsync();
      const stringifiedResult = JSON.stringify(result, null, 2);
      Alert.alert('Push Token', stringifiedResult);
      console.log(stringifiedResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      Alert.alert('Could not get push token', message);
    }
  };

  return (
    <View style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingBottom: insets.bottom }]}>
        <Section title="Permissions">
          <TestButton title="Request Permissions" onPress={requestPermissions} />
          <TestButton title="Get Permissions" onPress={getPermissions} />
        </Section>
        <Section title="Local Notifications">
          <TestButton title="Send Notification" onPress={sendNotification} />
        </Section>
        <NotificationResponseSection />
        <BackgroundTaskSection />
        <Section title="Remote Notifications">
          <TestButton title="Get Push Token" onPress={getPushToken} />
        </Section>
      </ScrollView>
    </View>
  );
}
