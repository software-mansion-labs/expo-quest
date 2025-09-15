package expo.modules.location

import android.os.Build

// This class is a local copy of `expo.modules.core.utilities.VRUtilities` to eliminate the dependency on Expo SDK 54.
// TODO: In the future, move to use `expo.modules.core.utilities.VRUtilities` when possible.
class VRUtilities {
  companion object {
    const val HZOS_CAMERA_PERMISSION = "horizonos.permission.HEADSET_CAMERA"

    fun isQuest(): Boolean {
      return (Build.MANUFACTURER.equals("Oculus", ignoreCase = true) || Build.MANUFACTURER.equals("Meta", ignoreCase = true)) && Build.MODEL.contains("Quest")
    }
  }
}
