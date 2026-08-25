import ExpoHorizon from 'expo-horizon-core';
import * as Location from 'expo-horizon-location';
import * as TaskManager from 'expo-task-manager';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section, SectionTitle } from '../components/Section';
import { GlobalStyles } from '../constants/styles';

const TestButton = ({
  title,
  onPress,
  color = '#007AFF',
  isButtonLoading,
}: {
  title: string;
  onPress: () => void;
  color?: string;
  isButtonLoading: boolean;
}) => {
  return (
    <TouchableOpacity
      style={[
        GlobalStyles.button,
        { backgroundColor: color },
        isButtonLoading && GlobalStyles.buttonDisabled,
      ]}
      onPress={onPress}
      disabled={isButtonLoading}>
      <View style={GlobalStyles.buttonContent}>
        {isButtonLoading && (
          <ActivityIndicator size="small" color="#fff" style={GlobalStyles.loadingIndicator} />
        )}
        <Text style={GlobalStyles.buttonText}>{isButtonLoading ? `${title}...` : title}</Text>
      </View>
    </TouchableOpacity>
  );
};
//eslint-disable-next-line  @typescript-eslint/no-explicit-any
const StatusText = ({ label, value }: { label: string; value: any }) => (
  <Text style={GlobalStyles.dataText}>
    <Text style={GlobalStyles.statusLabel}>{label}: </Text>
    <Text style={GlobalStyles.statusValue}>{String(value)}</Text>
  </Text>
);

// Surfaces failures consistently. Meta Quest feature limitations are shown as a friendly notice
// rather than an error, since they are expected platform behavior and not a crash.
function notifyFailure(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/Meta Quest|Quest build variant/i.test(message)) {
    Alert.alert('Not available on Meta Quest', message);
    return;
  }
  Alert.alert(`Could not ${action}`, message);
}
export default function LocationScreen() {
  const insets = useSafeAreaInsets();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [, setLastKnownLocation] = useState<Location.LocationObject | null>(null);
  const [heading, setHeading] = useState<Location.LocationHeadingObject | null>(null);
  const [, setProviderStatus] = useState<Location.LocationProviderStatus | null>(null);
  const [permissions, setPermissions] = useState<Location.LocationPermissionResponse | null>(null);
  const [backgroundPermissions, setBackgroundPermissions] =
    useState<Location.LocationPermissionResponse | null>(null);
  const [servicesEnabled, setServicesEnabled] = useState<boolean | null>(null);
  const [backgroundLocationAvailable, setBackgroundLocationAvailable] = useState<boolean | null>(
    null
  );
  const [locationUpdatesActive, setLocationUpdatesActive] = useState(false);
  const [geofencingActive, setGeofencingActive] = useState(false);
  const [geocodedAddress, setGeocodedAddress] = useState<Location.LocationGeocodedAddress[] | null>(
    null
  );
  const [geocodedLocation, setGeocodedLocation] = useState<
    Location.LocationGeocodedLocation[] | null
  >(null);
  const [locationSubscription, setLocationSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [headingSubscription, setHeadingSubscription] =
    useState<Location.LocationSubscription | null>(null);
  const [motionActivity, setMotionActivity] = useState<Location.MotionActivityObject | null>(null);
  const [motionPermissions, setMotionPermissions] = useState<Awaited<
    ReturnType<typeof Location.getMotionActivityPermissionsAsync>
  > | null>(null);
  const [motionSubscription, setMotionSubscription] =
    useState<Location.LocationSubscription | null>(null);

  // Loading states for async operations
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: boolean;
  }>({});

  // Helper function to set loading state
  const setLoading = (operation: string, isLoading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [operation]: isLoading }));
  };

  // Helper function to check if operation is loading
  const isLoading = (operation: string) => loadingStates[operation] || false;

  const setupTaskManager = useCallback(() => {
    // Define background tasks
    TaskManager.defineTask(
      'test-location-task',
      //eslint-disable-next-line  @typescript-eslint/no-explicit-any
      async ({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Location task error:', error);
          return;
        }
        console.log('Location task data:', data);
      }
    );

    TaskManager.defineTask(
      'test-geofencing-task',
      //eslint-disable-next-line  @typescript-eslint/no-explicit-any
      async ({ data, error }: { data: any; error: any }) => {
        if (error) {
          console.error('Geofencing task error:', error);
          return;
        }
        console.log('Geofencing task data:', data);
      }
    );
  }, []);

  const checkInitialStatus = useCallback(async () => {
    try {
      setLoading('checkInitialStatus', true);
      const status = await Location.getProviderStatusAsync();
      setProviderStatus(status);

      const services = await Location.hasServicesEnabledAsync();
      setServicesEnabled(services);

      const available = await Location.isBackgroundLocationAvailableAsync();
      setBackgroundLocationAvailable(available);

      const perms = await Location.getForegroundPermissionsAsync();
      setPermissions(perms);

      // Horizon does not support background permissions
      if (!ExpoHorizon.isHorizonDevice) {
        const bgPerms = await Location.getBackgroundPermissionsAsync();
        setBackgroundPermissions(bgPerms);
      }
    } catch (error) {
      console.error('Error checking initial status:', error);
    } finally {
      setLoading('checkInitialStatus', false);
    }
  }, []);

  const requestForegroundPermissions = useCallback(async () => {
    try {
      setLoading('requestForegroundPermissions', true);
      const result = await Location.requestForegroundPermissionsAsync();
      setPermissions(result);
      Alert.alert('Foreground Permissions', `Status: ${result.status}`);
    } catch (error) {
      notifyFailure('request foreground permissions', error);
    } finally {
      setLoading('requestForegroundPermissions', false);
    }
  }, []);

  const requestBackgroundPermissions = useCallback(async () => {
    try {
      setLoading('requestBackgroundPermissions', true);
      const result = await Location.requestBackgroundPermissionsAsync();
      setBackgroundPermissions(result);
      Alert.alert('Background Permissions', `Status: ${result.status}`);
    } catch (error) {
      notifyFailure('request background permissions', error);
    } finally {
      setLoading('requestBackgroundPermissions', false);
    }
  }, []);

  const getCurrentPosition = useCallback(async () => {
    try {
      setLoading('getCurrentPosition', true);

      // Check if location services are enabled
      const areServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!areServicesEnabled) {
        Alert.alert(
          'Location Services',
          'Location services are disabled. Please enable them in device settings.'
        );
        return;
      }

      // Check permissions
      const foregroundPermissions = await Location.getForegroundPermissionsAsync();
      if (foregroundPermissions.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Location permissions are required. Please grant them in settings.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 20000, // 20 second timeout for emulator
      });
      setLocation(position);
      Alert.alert(
        'Current Position',
        `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}\nAccuracy: ${position.coords.accuracy}m`
      );
    } catch (error) {
      console.error('Get current position error:', error);
      notifyFailure('get current position', error);
    } finally {
      setLoading('getCurrentPosition', false);
    }
  }, []);

  const getLastKnownPosition = useCallback(async () => {
    try {
      setLoading('getLastKnownPosition', true);
      const position = await Location.getLastKnownPositionAsync({
        maxAge: 60000, // 1 minute
        requiredAccuracy: 100, // 100 meters
      });
      setLastKnownLocation(position);
      if (position) {
        Alert.alert(
          'Last Known Position',
          `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
        );
      } else {
        Alert.alert('Last Known Position', 'No last known position available');
      }
    } catch (error) {
      notifyFailure('get last known position', error);
    } finally {
      setLoading('getLastKnownPosition', false);
    }
  }, []);

  const startLocationWatching = useCallback(async () => {
    try {
      setLoading('startLocationWatching', true);

      // Check if location services are enabled
      const areServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!areServicesEnabled) {
        Alert.alert(
          'Location Services',
          'Location services are disabled. Please enable them in device settings.'
        );
        return;
      }

      // Check permissions
      const foregroundPermissions = await Location.getForegroundPermissionsAsync();
      if (foregroundPermissions.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Location permissions are required. Please grant them in settings.'
        );
        return;
      }

      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000, // More frequent updates for emulator
          distanceInterval: 1, // Smaller distance interval
          mayShowUserSettingsDialog: true, // Allow user to adjust settings
        },
        (newLocation: Location.LocationObject) => {
          setLocation(newLocation);
          console.log('Location update:', newLocation);
        },
        (error: string) => {
          console.error('Location watch error:', error);
          notifyFailure('watch location', error);
        }
      );
      setLocationSubscription(subscription);
      setLocationUpdatesActive(true);
      Alert.alert(
        'Location Watching',
        'Started watching location updates\n\nMake sure location is enabled in emulator settings.'
      );
    } catch (error) {
      console.error('Location watching error:', error);
      notifyFailure('start location watching', error);
    } finally {
      setLoading('startLocationWatching', false);
    }
  }, []);

  const stopLocationWatching = useCallback(() => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
      setLocationUpdatesActive(false);
      Alert.alert('Location Watching', 'Stopped watching location updates');
    }
  }, [locationSubscription]);

  const getHeading = useCallback(async () => {
    try {
      setLoading('getHeading', true);
      const headingData = await Location.getHeadingAsync();
      setHeading(headingData);
      Alert.alert(
        'Heading',
        `True: ${headingData.trueHeading}°, Magnetic: ${headingData.magHeading}°`
      );
    } catch (error) {
      notifyFailure('get heading', error);
    } finally {
      setLoading('getHeading', false);
    }
  }, []);

  const startHeadingWatching = useCallback(async () => {
    try {
      setLoading('startHeadingWatching', true);
      const subscription = await Location.watchHeadingAsync(
        (newHeading: Location.LocationHeadingObject) => {
          setHeading(newHeading);
          console.log('Heading update:', newHeading);
        },
        (error: string) => {
          console.error('Heading watch error:', error);
        }
      );
      setHeadingSubscription(subscription);
      Alert.alert('Heading Watching', 'Started watching heading updates');
    } catch (error) {
      notifyFailure('start heading watching', error);
    } finally {
      setLoading('startHeadingWatching', false);
    }
  }, []);

  const stopHeadingWatching = useCallback(() => {
    if (headingSubscription) {
      headingSubscription.remove();
      setHeadingSubscription(null);
      Alert.alert('Heading Watching', 'Stopped watching heading updates');
    }
  }, [headingSubscription]);

  // Motion activity (new in SDK 56). On Quest the permission resolves denied and the watch rejects.
  const getMotionPermissions = useCallback(async () => {
    try {
      setLoading('getMotionPermissions', true);
      const result = await Location.getMotionActivityPermissionsAsync();
      setMotionPermissions(result);
      Alert.alert('Motion Activity Permissions', `Status: ${result.status}`);
    } catch (error) {
      notifyFailure('get motion activity permissions', error);
    } finally {
      setLoading('getMotionPermissions', false);
    }
  }, []);

  const requestMotionPermissions = useCallback(async () => {
    try {
      setLoading('requestMotionPermissions', true);
      const result = await Location.requestMotionActivityPermissionsAsync();
      setMotionPermissions(result);
      Alert.alert('Motion Activity Permissions', `Status: ${result.status}`);
    } catch (error) {
      notifyFailure('request motion activity permissions', error);
    } finally {
      setLoading('requestMotionPermissions', false);
    }
  }, []);

  const getMotionActivity = useCallback(async () => {
    try {
      setLoading('getMotionActivity', true);
      const activity = await Location.getMotionActivityAsync();
      setMotionActivity(activity);
      Alert.alert('Motion Activity', JSON.stringify(activity.activities, null, 2));
    } catch (error) {
      notifyFailure('get motion activity', error);
    } finally {
      setLoading('getMotionActivity', false);
    }
  }, []);

  const startMotionActivityWatching = useCallback(async () => {
    try {
      setLoading('startMotionActivityWatching', true);
      const subscription = await Location.watchMotionActivityAsync(
        (newActivity: Location.MotionActivityObject) => {
          setMotionActivity(newActivity);
          console.log('Motion activity update:', newActivity);
        },
        (error: string) => {
          console.error('Motion activity watch error:', error);
        }
      );
      setMotionSubscription(subscription);
      Alert.alert('Motion Activity Watching', 'Started watching motion activity updates');
    } catch (error) {
      notifyFailure('start motion activity watching', error);
    } finally {
      setLoading('startMotionActivityWatching', false);
    }
  }, []);

  const stopMotionActivityWatching = useCallback(() => {
    if (motionSubscription) {
      motionSubscription.remove();
      setMotionSubscription(null);
      Alert.alert('Motion Activity Watching', 'Stopped watching motion activity updates');
    }
  }, [motionSubscription]);

  const geocodeAddress = useCallback(async () => {
    try {
      setLoading('geocodeAddress', true);
      const locations = await Location.geocodeAsync('1600 Pennsylvania Avenue NW, Washington, DC');
      setGeocodedLocation(locations);
      if (locations.length > 0) {
        Alert.alert('Geocoding Result', `Found ${locations.length} location(s)`);
      } else {
        Alert.alert('Geocoding Result', 'No locations found');
      }
    } catch (error) {
      notifyFailure('geocode address', error);
    } finally {
      setLoading('geocodeAddress', false);
    }
  }, []);

  const reverseGeocodeLocation = useCallback(async () => {
    try {
      setLoading('reverseGeocodeLocation', true);
      const addresses = await Location.reverseGeocodeAsync({
        latitude: 38.8977,
        longitude: -77.0365,
      });
      setGeocodedAddress(addresses);
      if (addresses.length > 0) {
        Alert.alert('Reverse Geocoding Result', `Found ${addresses.length} address(es)`);
      } else {
        Alert.alert('Reverse Geocoding Result', 'No addresses found');
      }
    } catch (error) {
      notifyFailure('reverse geocode location', error);
    } finally {
      setLoading('reverseGeocodeLocation', false);
    }
  }, []);

  const startBackgroundLocationUpdates = useCallback(async () => {
    try {
      setLoading('startBackgroundLocationUpdates', true);

      // A foreground-service task only needs foreground location permission (not background), so it
      // registers on Android without "Allow all the time" and on Horizon where background location
      // is prohibited.
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissions Required', 'Foreground location permission is required.');
        return;
      }

      await Location.startLocationUpdatesAsync('test-location-task', {
        accuracy: Location.Accuracy.Balanced,
        activityType: Location.ActivityType.Fitness,
        showsBackgroundLocationIndicator: true,
        foregroundService: {
          notificationTitle: 'Location Tracking',
          notificationBody: 'Tracking your location in the background',
          notificationColor: '#FF0000',
        },
      });
      setLocationUpdatesActive(true);
      Alert.alert('Background Location', 'Started background location updates');
    } catch (error) {
      console.error('Background location error:', error);
      notifyFailure('start background location updates', error);
    } finally {
      setLoading('startBackgroundLocationUpdates', false);
    }
  }, []);

  const stopBackgroundLocationUpdates = useCallback(async () => {
    try {
      setLoading('stopBackgroundLocationUpdates', true);
      await Location.stopLocationUpdatesAsync('test-location-task');
      setLocationUpdatesActive(false);
      Alert.alert('Background Location', 'Stopped background location updates');
    } catch (error) {
      notifyFailure('stop background location updates', error);
    } finally {
      setLoading('stopBackgroundLocationUpdates', false);
    }
  }, []);

  const startGeofencing = useCallback(async () => {
    try {
      setLoading('startGeofencing', true);

      // Geofencing requires the background location permission, which the Meta Horizon Store
      // prohibits, so it cannot run on Quest.
      if (ExpoHorizon.isHorizonDevice) {
        Alert.alert('Geofencing', 'Geofencing is not supported on Meta Horizon devices.');
        return;
      }

      const bgPermissions = await Location.getBackgroundPermissionsAsync();
      if (bgPermissions.status !== 'granted') {
        Alert.alert(
          'Permissions Required',
          'Background location permission ("Allow all the time") is required for geofencing.'
        );
        return;
      }

      const regions: Location.LocationRegion[] = [
        {
          identifier: 'test-region-1',
          latitude: 38.8977,
          longitude: -77.0365,
          radius: 1000, // 1km
          notifyOnEnter: true,
          notifyOnExit: true,
        },
      ];
      await Location.startGeofencingAsync('test-geofencing-task', regions);
      setGeofencingActive(true);
      Alert.alert('Geofencing', 'Started geofencing with test region');
    } catch (error) {
      console.error('Geofencing error:', error);
      notifyFailure('start geofencing', error);
    } finally {
      setLoading('startGeofencing', false);
    }
  }, []);

  const stopGeofencing = useCallback(async () => {
    try {
      setLoading('stopGeofencing', true);
      await Location.stopGeofencingAsync('test-geofencing-task');
      setGeofencingActive(false);
      Alert.alert('Geofencing', 'Stopped geofencing');
    } catch (error) {
      notifyFailure('stop geofencing', error);
    } finally {
      setLoading('stopGeofencing', false);
    }
  }, []);

  const enableNetworkProvider = useCallback(async () => {
    if (Platform.OS === 'android') {
      try {
        setLoading('enableNetworkProvider', true);
        await Location.enableNetworkProviderAsync();
        Alert.alert('Network Provider', 'Network provider enabled');
      } catch (error) {
        notifyFailure('enable network provider', error);
      } finally {
        setLoading('enableNetworkProvider', false);
      }
    } else {
      Alert.alert('Network Provider', 'This method is only available on Android');
    }
  }, []);

  const checkLocationUpdatesStatus = useCallback(async () => {
    try {
      setLoading('checkLocationUpdatesStatus', true);
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('test-location-task');
      Alert.alert('Location Updates Status', `Active: ${hasStarted}`);
    } catch (error) {
      notifyFailure('check location updates status', error);
    } finally {
      setLoading('checkLocationUpdatesStatus', false);
    }
  }, []);

  const checkGeofencingStatus = useCallback(async () => {
    try {
      setLoading('checkGeofencingStatus', true);
      const hasStarted = await Location.hasStartedGeofencingAsync('test-geofencing-task');
      Alert.alert('Geofencing Status', `Active: ${hasStarted}`);
    } catch (error) {
      notifyFailure('check geofencing status', error);
    } finally {
      setLoading('checkGeofencingStatus', false);
    }
  }, []);

  useEffect(() => {
    checkInitialStatus();
    setupTaskManager();
  }, [checkInitialStatus, setupTaskManager]);

  return (
    <View style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingBottom: insets.bottom }]}>
        <Section title="Permissions">
          <TestButton
            title="Request Foreground Permissions"
            onPress={requestForegroundPermissions}
            isButtonLoading={isLoading('requestForegroundPermissions')}
          />
          <TestButton
            title="Request Background Permissions"
            onPress={requestBackgroundPermissions}
            isButtonLoading={isLoading('requestBackgroundPermissions')}
          />
          <StatusText label="Services Enabled" value={servicesEnabled} />
          <StatusText label="Foreground Permissions" value={permissions?.status} />
          <StatusText label="Background Permissions" value={backgroundPermissions?.status} />
        </Section>

        <Section title="Location">
          <TestButton
            title="Get Current Position"
            onPress={getCurrentPosition}
            isButtonLoading={isLoading('getCurrentPosition')}
          />
          <TestButton
            title="Get Last Known Position"
            onPress={getLastKnownPosition}
            isButtonLoading={isLoading('getLastKnownPosition')}
          />
          <TestButton
            title="Start Location Watching"
            onPress={startLocationWatching}
            isButtonLoading={isLoading('startLocationWatching')}
          />
          <TestButton
            title="Stop Location Watching"
            onPress={stopLocationWatching}
            color="#FF3B30"
            isButtonLoading={isLoading('stopLocationWatching')}
          />
          <SectionTitle title="Current Location" />
          <Text style={GlobalStyles.dataText}>
            Latitude: {location?.coords?.latitude || 'Unknown'}
          </Text>
          <Text style={GlobalStyles.dataText}>
            Longitude: {location?.coords?.longitude || 'Unknown'}
          </Text>
          <Text style={GlobalStyles.dataText}>
            Accuracy: {location?.coords?.accuracy || 'Unknown'}m
          </Text>
          <Text style={GlobalStyles.dataText}>
            Timestamp:{' '}
            {location?.timestamp ? new Date(location.timestamp).toLocaleString() : 'Unknown'}
          </Text>
          <StatusText label="Background Location Available" value={backgroundLocationAvailable} />
          <StatusText label="Location Updates Active" value={locationUpdatesActive} />
        </Section>

        <Section title="Heading">
          <TestButton
            title="Get Heading"
            onPress={getHeading}
            isButtonLoading={isLoading('getHeading')}
          />
          <TestButton
            title="Start Heading Watching"
            onPress={startHeadingWatching}
            isButtonLoading={isLoading('startHeadingWatching')}
          />
          <TestButton
            title="Stop Heading Watching"
            onPress={stopHeadingWatching}
            color="#FF3B30"
            isButtonLoading={isLoading('stopHeadingWatching')}
          />
          <SectionTitle title="Current Heading" />
          <Text style={GlobalStyles.dataText}>
            True Heading: {heading?.trueHeading || 'Unknown'}°
          </Text>
          <Text style={GlobalStyles.dataText}>
            Magnetic Heading: {heading?.magHeading || 'Unknown'}°
          </Text>
          <Text style={GlobalStyles.dataText}>Accuracy: {heading?.accuracy || 'Unknown'}</Text>
        </Section>

        <Section title="Motion Activity">
          <TestButton
            title="Get Motion Permissions"
            onPress={getMotionPermissions}
            isButtonLoading={isLoading('getMotionPermissions')}
          />
          <TestButton
            title="Request Motion Permissions"
            onPress={requestMotionPermissions}
            isButtonLoading={isLoading('requestMotionPermissions')}
          />
          <TestButton
            title="Get Motion Activity"
            onPress={getMotionActivity}
            isButtonLoading={isLoading('getMotionActivity')}
          />
          <TestButton
            title="Start Motion Activity Watching"
            onPress={startMotionActivityWatching}
            isButtonLoading={isLoading('startMotionActivityWatching')}
          />
          <TestButton
            title="Stop Motion Activity Watching"
            onPress={stopMotionActivityWatching}
            color="#FF3B30"
            isButtonLoading={isLoading('stopMotionActivityWatching')}
          />
          <SectionTitle title="Current Motion Activity" />
          <StatusText label="Motion Permissions" value={motionPermissions?.status} />
          <Text style={GlobalStyles.dataText}>
            Activities: {motionActivity ? JSON.stringify(motionActivity.activities) : 'Unknown'}
          </Text>
          <Text style={GlobalStyles.dataText}>
            Timestamp:{' '}
            {motionActivity?.timestamp
              ? new Date(motionActivity.timestamp).toLocaleString()
              : 'Unknown'}
          </Text>
        </Section>

        <Section title="Geocoding">
          <SectionTitle title="Geocoding" />
          <TestButton
            title="Geocode Address"
            onPress={geocodeAddress}
            isButtonLoading={isLoading('geocodeAddress')}
          />
          <TestButton
            title="Reverse Geocode Location"
            onPress={reverseGeocodeLocation}
            isButtonLoading={isLoading('reverseGeocodeLocation')}
          />
        </Section>

        <Section title="Geocoded Address">
          {geocodedAddress && geocodedAddress.length > 0 ? (
            geocodedAddress.map((address, index) => (
              <View key={index} style={GlobalStyles.infoBox}>
                <Text style={GlobalStyles.dataText}>Name: {address.name || 'N/A'}</Text>
                <Text style={GlobalStyles.dataText}>
                  Street: {address.street || ''} {address.streetNumber || ''}
                </Text>
                <Text style={GlobalStyles.dataText}>City: {address.city || 'N/A'}</Text>
                <Text style={GlobalStyles.dataText}>Region: {address.region || 'N/A'}</Text>
                <Text style={GlobalStyles.dataText}>Country: {address.country || 'N/A'}</Text>
              </View>
            ))
          ) : (
            <Text style={GlobalStyles.dataText}>No geocoded addresses available</Text>
          )}
        </Section>

        <Section title="Geocoded Location">
          <SectionTitle title="Geocoded Location" />
          {geocodedLocation && geocodedLocation.length > 0 ? (
            geocodedLocation.map((loc, index) => (
              <View key={index} style={GlobalStyles.infoBox}>
                <Text style={GlobalStyles.dataText}>Latitude: {loc.latitude}</Text>
                <Text style={GlobalStyles.dataText}>Longitude: {loc.longitude}</Text>
                <Text style={GlobalStyles.dataText}>Accuracy: {loc.accuracy || 'Unknown'}m</Text>
              </View>
            ))
          ) : (
            <Text style={GlobalStyles.dataText}>No geocoded locations available</Text>
          )}
        </Section>

        <Section title="Status">
          <StatusText label="Geofencing Active" value={geofencingActive} />
        </Section>

        <Section title="Background Services">
          <TestButton
            title="Start Background Location Updates"
            onPress={startBackgroundLocationUpdates}
            isButtonLoading={isLoading('startBackgroundLocationUpdates')}
          />
          <TestButton
            title="Stop Background Location Updates"
            onPress={stopBackgroundLocationUpdates}
            color="#FF3B30"
            isButtonLoading={isLoading('stopBackgroundLocationUpdates')}
          />
          <TestButton
            title="Start Geofencing"
            onPress={startGeofencing}
            isButtonLoading={isLoading('startGeofencing')}
          />
          <TestButton
            title="Stop Geofencing"
            onPress={stopGeofencing}
            color="#FF3B30"
            isButtonLoading={isLoading('stopGeofencing')}
          />
        </Section>

        <Section title="Utilities">
          <TestButton
            title="Enable Network Provider"
            onPress={enableNetworkProvider}
            isButtonLoading={isLoading('enableNetworkProvider')}
          />
          <TestButton
            title="Check Location Updates Status"
            onPress={checkLocationUpdatesStatus}
            isButtonLoading={isLoading('checkLocationUpdatesStatus')}
          />
          <TestButton
            title="Check Geofencing Status"
            onPress={checkGeofencingStatus}
            isButtonLoading={isLoading('checkGeofencingStatus')}
          />
        </Section>
      </ScrollView>
    </View>
  );
}
