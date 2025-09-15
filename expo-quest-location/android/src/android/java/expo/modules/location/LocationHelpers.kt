package expo.modules.location

import android.content.Context
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.CurrentLocationRequest
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.Granularity
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.location.records.LocationOptions
import expo.modules.location.records.LocationResponse

class LocationHelpers(context: Context) {
  private val mLocationProvider: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(context)

  fun requestSingleLocation(locationProvider: FusedLocationProviderClient, locationRequest: CurrentLocationRequest, promise: Promise) {
    try {
      locationProvider.getCurrentLocation(locationRequest, null)
        .addOnSuccessListener { location: Location? ->
          if (location == null) {
            promise.reject(CurrentLocationIsUnavailableException())
            return@addOnSuccessListener
          }

          promise.resolve(LocationResponse(location))
        }
        .addOnFailureListener {
          promise.reject(LocationRequestRejectedException(it))
        }
        .addOnCanceledListener {
          promise.reject(LocationRequestCancelledException())
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

      return LocationRequest.Builder(locationParams.interval)
        .setMinUpdateIntervalMillis(locationParams.interval)
        .setMaxUpdateDelayMillis(locationParams.interval)
        .setMinUpdateDistanceMeters(locationParams.distance)
        .setPriority(mapAccuracyToPriority(options.accuracy))
        .build()
    }

    internal fun prepareCurrentLocationRequest(options: LocationOptions): CurrentLocationRequest {
      val locationParams = mapOptionsToLocationParams(options)

      return CurrentLocationRequest.Builder().apply {
        setGranularity(Granularity.GRANULARITY_PERMISSION_LEVEL)
        setPriority(mapAccuracyToPriority(options.accuracy))
        setMaxUpdateAgeMillis(locationParams.interval)
      }.build()
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
        LocationModule.ACCURACY_BEST_FOR_NAVIGATION, LocationModule.ACCURACY_HIGHEST, LocationModule.ACCURACY_HIGH -> Priority.PRIORITY_HIGH_ACCURACY
        LocationModule.ACCURACY_BALANCED, LocationModule.ACCURACY_LOW -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
        LocationModule.ACCURACY_LOWEST -> Priority.PRIORITY_LOW_POWER
        else -> Priority.PRIORITY_BALANCED_POWER_ACCURACY
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
