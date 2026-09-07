# expo-horizon-notifications

![expo-horizon-notifications](https://img.shields.io/npm/v/expo-horizon-notifications.svg)

A fork of [`expo-notifications`](https://github.com/expo/expo/tree/main/packages/expo-notifications) that provides two implementations:

- The default `expo-notifications` for Android and iOS platforms.
- A Meta Horizon–compatible implementation that uses the Meta's push notification service.

You can choose which implementation to use with the `quest` / `mobile` build variants. See [expo-horizon-core](../expo-horizon-core/README.md) for more details. This makes it compatible with Meta Horizon devices, while remaining a drop-in replacement for `expo-notifications` on Android and iOS.

## Prerequisites

- Expo SDK 57 or later (`expo` package version 57.0.15+)
- `expo-horizon-core` package installed. See [expo-horizon-core](../expo-horizon-core/README.md) for more details

## Usage

1. Install and configure the `expo-horizon-core` package:

```bash
npx expo install expo-horizon-core
```

For detailed setup steps and configuration options, refer to the [`expo-horizon-core` documentation](../expo-horizon-core/README.md).

> [!NOTE]
> For push notifications to work, you must set the correct `horizonAppId` in the `expo-horizon-core` configuration.

2. Install the package:

```bash
npx expo install expo-horizon-notifications

# and remove the old package:
npm uninstall expo-notifications
# or
yarn remove expo-notifications
```

3. Update your `app.json` / `app.config.js` to replace `expo-notifications` with `expo-horizon-notifications`.
4. Use the `questDebug` / `questRelease` build variants to run the app on Meta Quest devices. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.
5. Update your imports:

```js
// import * as Notifications from 'expo-notifications';
import * as Notifications from 'expo-horizon-notifications';
```

### Push Notifications

1. To enable push notifications, first set the `horizonAppId` in your `expo-horizon-core` configuration (see [expo-horizon-core](../expo-horizon-core/README.md) for more details).
2. Use `getDevicePushTokenAsync` to obtain the device's push token. The returned token will have a new type, `horizon`.
3. Send this push token to your server, which will use it to deliver push notifications to the device.
4. For additional details, refer to the official [Horizon OS documentation](https://developers.meta.com/horizon/documentation/android-apps/ps-user-notifications/).

## Behavior

- On Meta Quest devices → Uses the Meta Horizon–compatible push notification service.
- On standard Android devices → Falls back to the default `expo-notifications` behavior using Firebase Cloud Messaging.
- On iOS it should have no effect; behavior is always the same as `expo-notifications`.

> [!IMPORTANT]
> The `quest` build variants are intended specifically for Meta Quest devices. Using them on standard Android devices is not recommended, as certain features may be unsupported or behave differently.

## Additional features

You might need additional features like `isHorizonDevice` or `isHorizonBuild` to check if the device is a Meta Horizon device. See [expo-horizon-core](../expo-horizon-core/README.md) for more details.

## Features supported on Meta Horizon OS

| Function Name                                                                    | Horizon OS              | Notes                                                                                                         | Requirements   |
| -------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- | -------------- |
| `addPushTokenListener`                                                           | ✅ Supported (v0.0.11+) | Supported, but still in the testing phase.                                                                    | `horizonAppId` |
| `getDevicePushTokenAsync`                                                        | ✅ Supported (v0.0.11+) | Supported, but still in the testing phase.                                                                    | `horizonAppId` |
| `getExpoPushTokenAsync`                                                          | ❌ Not supported        | Currently, support for the Expo Push Service is not planned.                                                  |                |
| `addNotificationReceivedListener` <br> `addNotificationResponseReceivedListener` | ✅ Supported            |                                                                                                               |                |
| `addNotificationsDroppedListener` <br> `useLastNotificationResponse`             | ✅ Supported            |                                                                                                               |                |
| `setNotificationHandler`                                                         | ✅ Supported            |                                                                                                               |                |
| `registerTaskAsync` <br> `unregisterTaskAsync`                                   | ✅ Supported            |                                                                                                               |                |
| `getPermissionsAsync` <br> `requestPermissionsAsync`                             | ✅ Supported            |                                                                                                               |                |
| `getBadgeCountAsync` <br> `setBadgeCountAsync`                                   | ❌ Not supported        | The [underlying library](https://github.com/leolin310148/ShortcutBadger) does not support this functionality. |                |
| `cancelAllScheduledNotificationsAsync` <br> `cancelScheduledNotificationAsync`   | ✅ Supported            |                                                                                                               |                |
| `getAllScheduledNotificationsAsync`                                              | ✅ Supported            |                                                                                                               |                |
| `getNextTriggerDateAsync`                                                        | ✅ Supported            |                                                                                                               |                |
| `scheduleNotificationAsync`                                                      | ✅ Supported            |                                                                                                               |                |
| `dismissAllNotificationsAsync` <br> `dismissNotificationAsync`                   | ✅ Supported            |                                                                                                               |                |
| `getPresentedNotificationsAsync`                                                 | ✅ Supported            |                                                                                                               |                |
| Manage notification channels                                                     | 🔍 Not tested yet       |                                                                                                               |                |
| Manage notification categories (interactive notifications)                       | 🔍 Not tested yet       |                                                                                                               |                |
| `clearLastNotificationResponse` <br> `clearLastNotificationResponseAsync`        | ✅ Supported            |                                                                                                               |                |
| `getLastNotificationResponse` <br> `getLastNotificationResponseAsync`            | ✅ Supported            |                                                                                                               |                |
| `unregisterForNotificationsAsync`                                                | ❌ Not supported        |                                                                                                               |                |

## Version compatibility

Our goal is to align the version numbers of `expo-horizon-notifications` and `expo-notifications` for easier upgrades. However, since this fork is still under development, we are currently using a separate versioning scheme.

| `expo-horizon-notifications` | `expo-notifications` | Expo SDK Version |
| ---------------------------- | -------------------- | ---------------- |
| 57.0.2                       | 57.0.17              | 57               |
| 57.0.1                       | 57.0.13              | 57               |
| 57.0.0                       | 57.0.3               | 57               |
| 56.0.0                       | 56.0.18              | 56               |
| 55.0.1                       | 55.0.19              | 55               |
| 55.0.0                       | 55.0.10              | 55               |
| 0.0.9-0.0.11                 | 19.0.7               | 54               |

## Expo Horizon Notifications is created by Software Mansion

[![swm](https://logo.swmansion.com/logo?color=white&variant=desktop&width=150&tag=expo-horizon-notifications-github 'Software Mansion')](https://swmansion.com)

Since 2012 [Software Mansion](https://swmansion.com) is a software agency with
experience in building web and mobile apps. We are Core React Native
Contributors and experts in dealing with all kinds of React Native issues. We
can help you build your next dream product –
[Hire us](https://swmansion.com/contact/projects?utm_source=expo-horizon-notifications&utm_medium=readme).

Made by [@software-mansion](https://github.com/software-mansion) and
[community](https://github.com/software-mansion-labs/expo-horizon/graphs/contributors) 💛
