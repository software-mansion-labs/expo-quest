package expo.modules.location

import android.content.Context
import android.location.Location
import android.location.LocationManager
import android.location.LocationRequest.QUALITY_BALANCED_POWER_ACCURACY
import android.location.LocationRequest.QUALITY_HIGH_ACCURACY
import android.location.LocationRequest.QUALITY_LOW_POWER
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse

class LocationHelpers(context: Context) {
  private val mLocationManager: LocationManager =
    context.getSystemService(Context.LOCATION_SERVICE) as LocationManager

  fun requestSingleLocation(locationRequest: LocationRequest, promise: Promise) {
    try {
      val provider = mapPriorityToProvider(locationRequest.priority)

      if (!mLocationManager.isProviderEnabled(provider)) {
        promise.reject(CurrentLocationIsUnavailableException())
        return
      }

      // Use getCurrentLocation for API 31+ (Android 12+)
      if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.S) {
        val cancellationSignal = android.os.CancellationSignal()
        val mainExecutor = java.util.concurrent.Executor { command ->
          android.os.Handler(android.os.Looper.getMainLooper()).post(command)
        }
        mLocationManager.getCurrentLocation(
          provider,
          locationRequest.toAndroidLocationRequest(),
          cancellationSignal,
          mainExecutor
        ) { location ->
          if (location == null) {
            promise.reject(CurrentLocationIsUnavailableException())
          } else {
            promise.resolve(LocationResponse(location))
          }
        }
      } else {
        // Fallback for older APIs
        val location = mLocationManager.getLastKnownLocation(provider)
        if (location == null) {
          promise.reject(CurrentLocationIsUnavailableException())
          return
        }
        promise.resolve(LocationResponse(location))
      }
    } catch (e: SecurityException) {
      promise.reject(LocationRequestRejectedException(e))
    }
  }

  fun requestContinuousUpdates(locationModule: LocationModule, locationRequest: LocationRequest, watchId: Int, promise: Promise) {
    locationModule.requestLocationUpdates(
      locationRequest,
      watchId,
      object : LocationRequestCallbacks {
        override fun onLocationChanged(location: Location) {
          locationModule.sendLocationResponse(watchId, LocationResponse(location))
        }

        override fun onRequestSuccess() {
          promise.resolve(null)
        }

        override fun onRequestFailed(cause: CodedException) {
          promise.reject(cause)
        }
      }
    )
  }

  companion object {

    internal fun prepareLocationRequest(options: LocationOptions): LocationRequest {
      val locationParams = mapOptionsToLocationParams(options)

      return LocationRequest(
        interval = locationParams.interval,
        minUpdateIntervalMillis = locationParams.interval,
        maxUpdateDelayMillis = locationParams.interval,
        minUpdateDistanceMeters = locationParams.distance,
        priority = mapAccuracyToPriority(options.accuracy)
      )
    }

    internal fun prepareCurrentLocationRequest(options: LocationOptions): LocationRequest {
      val locationParams = mapOptionsToLocationParams(options)

      return LocationRequest(
        interval = locationParams.interval,
        minUpdateIntervalMillis = locationParams.interval,
        maxUpdateDelayMillis = locationParams.interval,
        minUpdateDistanceMeters = locationParams.distance,
        priority = mapAccuracyToPriority(options.accuracy)
      )
    }

    private fun mapOptionsToLocationParams(options: LocationOptions): LocationParams {
      val accuracy = options.accuracy
      val locationParams = buildLocationParamsForAccuracy(accuracy)

      options.timeInterval?.let {
        locationParams.interval = it
      }
      options.distanceInterval?.let {
        locationParams.distance = it.toFloat()
      }

      return locationParams
    }

    private fun mapAccuracyToPriority(accuracy: Int): Int {
      return when (accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> LocationModule.ACCURACY_HIGHEST
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> LocationModule.ACCURACY_BALANCED
        LocationModule.ACCURACY_LOWEST -> LocationModule.ACCURACY_LOWEST
        else -> LocationModule.ACCURACY_BALANCED
      }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    internal fun mapAccuracyToQuality(accuracy: Int): Int {
      return when (accuracy) {
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> QUALITY_HIGH_ACCURACY
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> QUALITY_BALANCED_POWER_ACCURACY
        LocationModule.ACCURACY_LOWEST -> QUALITY_LOW_POWER
        else -> QUALITY_BALANCED_POWER_ACCURACY
      }
    }

    internal fun mapPriorityToProvider(priority: Int): String {
      return when (priority) {
        LocationModule.ACCURACY_HIGHEST -> if (VRUtilities.isQuest()) LocationManager.NETWORK_PROVIDER else LocationManager.GPS_PROVIDER
        LocationModule.ACCURACY_BALANCED -> LocationManager.NETWORK_PROVIDER
        LocationModule.ACCURACY_LOWEST -> LocationManager.PASSIVE_PROVIDER
        else -> if (VRUtilities.isQuest()) LocationManager.NETWORK_PROVIDER else LocationManager.GPS_PROVIDER
      }
    }

    @RequiresApi(Build.VERSION_CODES.S)
    internal fun mapPriorityToQuality(priority: Int): Int {
      return when (priority) {
        LocationModule.ACCURACY_HIGHEST -> QUALITY_HIGH_ACCURACY
        LocationModule.ACCURACY_BALANCED -> QUALITY_BALANCED_POWER_ACCURACY
        LocationModule.ACCURACY_LOWEST -> QUALITY_LOW_POWER
        else -> QUALITY_BALANCED_POWER_ACCURACY
      }
    }

    private fun buildLocationParamsForAccuracy(accuracy: Int): LocationParams {
      return when (accuracy) {
        LocationModule.ACCURACY_LOWEST -> LocationParams(accuracy = LocationAccuracy.LOWEST, distance = 3000f, interval = 10000)
        LocationModule.ACCURACY_LOW -> LocationParams(accuracy = LocationAccuracy.LOW, distance = 1000f, interval = 5000)
        LocationModule.ACCURACY_BALANCED -> LocationParams(accuracy = LocationAccuracy.MEDIUM, distance = 100f, interval = 3000)
        LocationModule.ACCURACY_HIGH -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 50f, interval = 2000)
        LocationModule.ACCURACY_HIGHEST -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 25f, interval = 1000)
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION -> LocationParams(accuracy = LocationAccuracy.HIGH, distance = 0f, interval = 500)
        else -> LocationParams(accuracy = LocationAccuracy.MEDIUM, distance = 100f, interval = 3000)
      }
    }

    fun isAnyProviderAvailable(context: Context?): Boolean {
      val locationManager = context?.getSystemService(Context.LOCATION_SERVICE) as? LocationManager
        ?: return false
      return locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) || locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)
    }
  }
}

/**
 * A singleton that keeps information about whether the app is in the foreground or not.
 * This is a simple solution for passing current foreground information from the LocationModule to LocationTaskConsumer.
 */
object AppForegroundedSingleton {
  var isForegrounded = false
}
