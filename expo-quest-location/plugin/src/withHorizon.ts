import { ConfigPlugin, withGradleProperties } from '@expo/config-plugins';

// Global flag to prevent duplicate logs
let hasLoggedPluginExecution = false;

const withHorizon: ConfigPlugin = (config) => {
  // Add horizonEnabled=true to gradle.properties
  config = withGradleProperties(config, (config) => {
    // Check if horizonEnabled already exists
    const existingProperty = config.modResults.find(
      (item) => item.type === 'property' && item.key === 'horizonEnabled'
    );

    if (!existingProperty) {
      // Add the horizonEnabled property
      config.modResults.push({
        type: 'property',
        key: 'horizonEnabled',
        value: 'true',
      });

      if (!hasLoggedPluginExecution) {
        console.log('🌅 expo-quest-location: Added horizonEnabled=true to gradle.properties');
      }
    } else {
      console.log('🌅 expo-quest-location: horizonEnabled already exists in gradle.properties');
    }

    return config;
  });

  hasLoggedPluginExecution = true;
  return config;
};

export default withHorizon;
