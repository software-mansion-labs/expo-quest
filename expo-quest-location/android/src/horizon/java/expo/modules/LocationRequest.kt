package expo.modules.location

import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.location.LocationHelpers.Companion.mapPriorityToQuality
import android.location.LocationRequest as AndroidLocationRequest

data class LocationRequest(
  val interval: Long,
  val minUpdateIntervalMillis: Long,
  val maxUpdateDelayMillis: Long,
  val minUpdateDistanceMeters: Float,
  val priority: Int
) {
  /**
   * Transforms this LocationRequest into an android.location.LocationRequest using the builder.
   */
  @RequiresApi(Build.VERSION_CODES.S)
  fun toAndroidLocationRequest(): AndroidLocationRequest {
    return AndroidLocationRequest.Builder(interval)
      .setMinUpdateIntervalMillis(minUpdateIntervalMillis)
      .setMaxUpdateDelayMillis(maxUpdateDelayMillis)
      .setMinUpdateDistanceMeters(minUpdateDistanceMeters)
      .setQuality(mapPriorityToQuality(priority))
      .build()
  }
}
