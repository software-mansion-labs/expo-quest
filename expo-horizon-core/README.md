![Expo Horizon Core logo](https://raw.githubusercontent.com/software-mansion-labs/expo-horizon/refs/heads/main/expo-horizon-core/docs/images/cover_image.png)

![expo-horizon-core](https://img.shields.io/npm/v/expo-horizon-core.svg)

A comprehensive Expo module for building Android applications for Meta Quest devices. This package streamlines Horizon development by automatically configuring your project with the necessary build flavors, manifest settings, and providing runtime utilities to detect and interact with Horizon devices.

## Features

- 🎮 **Automatic Horizon Configuration** - Config plugin that sets up your Android project for Meta Horizon OS compliance
- 📱 **Build Flavors** - Automatically generates Horizon-specific build variants alongside your standard Android builds
- ✅ **Manifest Alignment** - Ensures your AndroidManifest meets [Meta Horizon requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest)
- 🔍 **Runtime Detection** - JavaScript constants to detect Horizon devices and builds at runtime
- 🛠️ **Native Module Support** - Access Horizon app ID from custom native modules
- ⚙️ **Flexible Configuration** - Customize panel sizing, device support, and VR features

## Installation

Install the package in your Expo project:

```bash
npm install expo-horizon-core
# or
yarn add expo-horizon-core
```

## Prerequisites

- Expo SDK 57 or later (`expo` package version 57.0.15+)
- Android development environment configured
- Meta Quest developer account (for publishing)

## Useful resources

- [Meta Quest Developer Hub](https://developers.meta.com/horizon/documentation/android-apps/meta-quest-developer-hub) - Essential for Meta Quest development; offers features such as video casting, device storage access, and app management.

## Quick Start

1. **Add the plugin to your Expo config** (`app.json` or `app.config.js`):

```json
{
  "expo": {
    "plugins": [
      [
        "expo-horizon-core",
        {
          "horizonAppId": "your-horizon-app-id",
          "supportedDevices": "quest2|quest3|quest3s"
        }
      ]
    ]
  }
}
```

2. **Rebuild your project** to apply the configuration:

```bash
npx expo prebuild --clean
```

3. **Use the runtime API** in your code:

```typescript
import ExpoHorizon from 'expo-horizon-core';

if (ExpoHorizon.isHorizonDevice) {
  // Horizon-specific UI or features
}
```

4. Migrate libraries to Meta Quest–compatible forks

| Library              | Quest-Compatible Fork                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `expo-location`      | [`expo-horizon-location`](https://github.com/software-mansion-labs/expo-horizon/tree/main/expo-horizon-location)           |
| `expo-notifications` | [`expo-horizon-notifications`](https://github.com/software-mansion-labs/expo-horizon/tree/main/expo-horizon-notifications) |

## Configuration

### Config Plugin

The config plugin automatically configures your Android project for Meta Horizon by:

- Adding a `quest` build flavor to `build.gradle`
- Creating a Horizon-specific `AndroidManifest.xml` with required permissions and features
- Configuring panel dimensions and supported devices
- Setting up VR headtracking features

### Plugin Options

Add the plugin to your `app.json` or `app.config.[js|ts]`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-horizon-core",
        {
          "horizonAppId": "your-horizon-app-id",
          "defaultHeight": "640dp",
          "defaultWidth": "1024dp",
          "supportedDevices": "quest2|quest3|quest3s",
          "disableVrHeadtracking": false,
          "allowBackup": false
        }
      ]
    ]
  }
}
```

#### Available Options

| Option                  | Type      | Required | Default   | Description                                                                                                                                                                                                                      |
| ----------------------- | --------- | -------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `horizonAppId`          | `string`  | No       | `""`      | Your Meta Horizon application ID. Used by other libraries (like `expo-horizon-notifications`) to identify your app.                                                                                                              |
| `defaultHeight`         | `string`  | No       | Not added | Default panel height in dp (e.g., `"640dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                                                                                    |
| `defaultWidth`          | `string`  | No       | Not added | Default panel width in dp (e.g., `"1024dp"`). See [Panel Sizing](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)                                                                                    |
| `supportedDevices`      | `string`  | Yes      | None      | Pipe-separated list of supported Quest devices: `"quest2\|quest3\|quest3s"`. See [Mobile Manifest](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)                                                       |
| `disableVrHeadtracking` | `boolean` | No       | `false`   | Set to `true` to disable VR headtracking feature. By default, adds `android.hardware.vr.headtracking` to AndroidManifest.                                                                                                        |
| `allowBackup`           | `boolean` | No       | `false`   | Set to `true` in the Quest build to enable Android's `allowBackup` feature. The default value is `false` which removes the "allowBackup=true" warning in the Meta Horizon Store. This does not affect your mobile build variant. |

> **Meta Horizon Store Recommendation for `allowBackup`:**
>
> If the application is storing sensitive information on the device, it is recommended to disable backups by setting `allowBackup="false"` in your application's AndroidManifest.

### Configuration Examples

```json
{
  "plugins": [
    [
      "expo-horizon-core",
      {
        "horizonAppId": "1234567890",
        "defaultHeight": "800dp",
        "defaultWidth": "1280dp",
        "supportedDevices": "quest2|quest3|quest3s",
        "disableVrHeadtracking": false
      }
    ]
  ]
}
```

> **Setting default dimensions:**
>
> If your app renders with black bars after setting `defaultWidth` or `defaultHeight`, ensure the orientation value in your `app.config.ts` is set correctly to match the specified dimensions. For more information, refer to the official (expo documentation)[https://docs.expo.dev/versions/latest/sdk/screen-orientation/]

## Building and Running

The config plugin automatically creates two build flavors for your Android project:

- **`mobile`** - Standard Android build for phones and tablets
- **`quest`** - Build prepared for Horizon OS devices with VR-specific manifest and configuration

### Build Variants

Each flavor has debug and release variants:

| Variant         | Description                                   |
| --------------- | --------------------------------------------- |
| `mobileDebug`   | Debug build for standard Android devices      |
| `mobileRelease` | Production build for standard Android devices |
| `questDebug`    | Debug build for Meta Horizon OS devices       |
| `questRelease`  | Production build for Meta Horizon OS devices  |

### Running on Different Platforms

#### Run on Standard Android (Mobile)

```bash
npx expo run:android --variant mobileDebug
```

#### Run on Meta Horizon devices

```bash
npx expo run:android --variant questDebug
```

### Package.json Scripts

For convenience, add these scripts to your `package.json`:

```json
{
  "scripts": {
    "android": "expo run:android --variant mobileDebug",
    "quest": "expo run:android --variant questDebug",
    "android:release": "expo run:android --variant mobileRelease",
    "quest:release": "expo run:android --variant questRelease"
  }
}
```

Then run with:

```bash
# Development
npm run android    # Run mobile build
npm run quest      # Run Quest build

# Production
npm run android:release
npm run quest:release
```

### Important Notes

- **Always use the Quest variant** when deploying to Meta Horizon OS devices
- **Quest builds include** Horizon-specific AndroidManifest settings and permissions
- **Mobile builds** will not have Horizon-specific configurations
- Use `npx expo prebuild --clean` after changing plugin configuration to regenerate build files

## Usage

### JavaScript/TypeScript API

The module provides runtime constants and utilities to help you build Horizon-aware applications.

#### API Reference

| Property          | Type             | Description                                                                     |
| ----------------- | ---------------- | ------------------------------------------------------------------------------- |
| `isHorizonDevice` | `boolean`        | Returns `true` if the app is running on a physical Horizon device.              |
| `isHorizonBuild`  | `boolean`        | Returns `true` if the app was built with the Quest build flavor.                |
| `horizonAppId`    | `string \| null` | The Horizon App ID configured via the config plugin. Returns `null` if not set. |

#### Basic Usage

```typescript
import ExpoHorizon from 'expo-horizon-core';

// Check if running on a Horizon device
if (ExpoHorizon.isHorizonDevice) {
  console.log('Running on Meta Horizon OS!');
}

// Check if this is a Horizon build
if (ExpoHorizon.isHorizonBuild) {
  console.log('This is a Horizon build variant');
}

// Access the Horizon App ID
const appId = ExpoHorizon.horizonAppId;
console.log('Horizon App ID:', appId ?? 'Not configured');
```

### Usage in Custom Native Modules

#### Accessing Horizon App ID in Android

To access the Horizon App ID from your custom Expo modules written in Kotlin, follow these steps:

1. Add the configuration field to your `build.gradle`:

```gradle
// The `horizonAppId` property is added by the expo-horizon-core config plugin.
def horizonAppIdConfigField = "\"${project.findProperty('horizonAppId') ?: ''}\""

android {
  defaultConfig {
    buildConfigField "String", "META_HORIZON_APP_ID", horizonAppIdConfigField
  }
}
```

2. Access the Horizon App ID in your native module code:

```kotlin
val horizonAppId = BuildConfig.META_HORIZON_APP_ID
```

Now, `horizonAppId` will contain the value of your Horizon App ID as defined in your build configuration.

## Version compatibility

| `expo-horizon-core` | Expo SDK Version |
| ------------------- | ---------------- |
| 57.0.1              | 57               |
| 57.0.0              | 57               |
| 56.0.0              | 56               |
| 55.0.0-55.0.1       | 55               |
| 1.0.7               | 54               |

## Resources

- [Meta Horizon Mobile App Development](https://developers.meta.com/horizon/documentation/android-apps/mobile-overview)
- [Panel Sizing Guidelines](https://developers.meta.com/horizon/documentation/android-apps/panel-sizing)
- [Publishing Requirements](https://developers.meta.com/horizon/resources/publish-mobile-manifest/)
- [Expo Config Plugins](https://docs.expo.dev/config-plugins/introduction/)

## Contributing

Contributions are very welcome! Please refer to the guidelines described in the [contributing guide](https://github.com/software-mansion-labs/expo-horizon/blob/main/CONTRIBUTING.md).

## Expo Horizon Core is created by Software Mansion

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=expo-horizon-core-github 'Software Mansion')](https://swmansion.com)

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with
experience in building web and mobile apps. We are Core React Native
Contributors and experts in dealing with all kinds of React Native issues. We
can help you build your next dream product –
[Hire us](https://swmansion.com/contact/projects?utm_source=expo-horizon-core&utm_medium=readme).

Made by [@software-mansion](https://github.com/software-mansion) and
[community](https://github.com/software-mansion-labs/expo-horizon/graphs/contributors) 💛
