import ExpoHorizon from 'expo-horizon-core';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Section } from '../components/Section';
import { TestProperty } from '../components/TestProperty';
import { GlobalStyles } from '../constants/styles';

export default function HorizonScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={GlobalStyles.screenContainer}>
      <ScrollView
        style={GlobalStyles.scrollView}
        contentContainerStyle={[GlobalStyles.scrollContent, { paddingBottom: insets.bottom }]}>
        <Section title="Horizon">
          <TestProperty title="Is Horizon Device" value={ExpoHorizon.isHorizonDevice.toString()} />
          <TestProperty title="Is Horizon Build" value={ExpoHorizon.isHorizonBuild.toString()} />
          <TestProperty
            title="Horizon App ID"
            value={ExpoHorizon.horizonAppId?.toString() || 'Not set'}
          />
        </Section>
      </ScrollView>
    </View>
  );
}
