package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.location.LocationProvider
import android.os.Looper
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.GeofencingException
import expo.modules.location.LocationHelpers
import expo.modules.location.records.GeofencingRegionState
import expo.modules.location.LocationModule
import java.util.UUID

class GeofencingTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mLocationManager: LocationManager? = null
  private var mLocationListener: LocationListener? = null
  private var mRegions: MutableMap<String, PersistableBundle> = HashMap()
  private var mCurrentLocation: Location? = null

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "geofencing"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startGeofencing()
  }

  override fun didUnregister() {
    stopGeofencing()
    mTask = null
    mPendingIntent = null
    mLocationManager = null
    mLocationListener = null
    mRegions.clear()
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)
    stopGeofencing()
    startGeofencing()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    // This method is called when the service receives a broadcast
    // For our custom geofencing implementation, we handle location updates
    // through the LocationListener in startGeofencing()
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val task = mTask ?: return false

    val data = taskManagerUtils.extractDataFromJobParams(params)
    for (item in data) {
      val bundle = Bundle()
      val region = Bundle()
      region.putAll(item.getPersistableBundle("region"))
      bundle.putInt("eventType", item.getInt("eventType"))
      bundle.putBundle("region", region)

      task.execute(bundle, null) { jobService.jobFinished(params, false) }
    }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  //endregion
  //region helpers
  private fun startGeofencing() {
    val context = context ?: run {
      Log.w(TAG, "The context has been abandoned")
      return
    }

    if (!LocationHelpers.isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available")
      return
    }

    mLocationManager = context.getSystemService(Context.LOCATION_SERVICE) as LocationManager
    mRegions = HashMap()

    // Create regions from task options.
    val options = mTask?.options
      ?: throw GeofencingException("Task is null, can't start geofencing")
    val regions: List<HashMap<String, Any>> = (options["regions"] as ArrayList<*>).filterIsInstance<HashMap<String, Any>>()

    for (region in regions) {
      val regionIdentifier = region["identifier"] as? String ?: UUID.randomUUID().toString()
      
      // Make a bundle for the region to remember its attributes.
      mRegions[regionIdentifier] = bundleFromRegion(regionIdentifier, region)
    }

    // Start location monitoring
    startLocationMonitoring()
  }

  private fun stopGeofencing() {
    mLocationListener?.let { listener ->
      mLocationManager?.removeUpdates(listener)
    }
    mLocationListener = null
    mLocationManager = null
  }

  private fun startLocationMonitoring() {
    val locationManager = mLocationManager ?: return
    
    mLocationListener = object : LocationListener {
      override fun onLocationChanged(location: Location) {
        mCurrentLocation = location
        checkGeofenceTransitions(location)
      }

      override fun onProviderEnabled(provider: String) {
        // Provider enabled
      }

      override fun onProviderDisabled(provider: String) {
        // Provider disabled
      }

      override fun onStatusChanged(provider: String, status: Int, extras: Bundle) {
        // Status changed
      }
    }

    try {
      // Use GPS provider for better accuracy
      if (locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.GPS_PROVIDER,
          5000L, // 5 seconds
          10f,   // 10 meters
          mLocationListener!!,
          Looper.getMainLooper()
        )
      } else if (locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER)) {
        locationManager.requestLocationUpdates(
          LocationManager.NETWORK_PROVIDER,
          10000L, // 10 seconds
          50f,    // 50 meters
          mLocationListener!!,
          Looper.getMainLooper()
        )
      }
    } catch (e: SecurityException) {
      Log.w(TAG, "Location monitoring request has been rejected.", e)
    }
  }

  private fun checkGeofenceTransitions(location: Location) {
    for ((regionId, regionBundle) in mRegions) {
      val latitude = regionBundle.getDouble("latitude")
      val longitude = regionBundle.getDouble("longitude")
      val radius = regionBundle.getDouble("radius")
      val notifyOnEnter = regionBundle.getBoolean("notifyOnEnter", true)
      val notifyOnExit = regionBundle.getBoolean("notifyOnExit", true)
      val currentState = regionBundle.getInt("state", GeofencingRegionState.UNKNOWN.ordinal)

      val distance = calculateDistance(location.latitude, location.longitude, latitude, longitude)
      val isInside = distance <= radius

      val newState = if (isInside) GeofencingRegionState.INSIDE else GeofencingRegionState.OUTSIDE

      // Check for transitions
      if (currentState != newState.ordinal) {
        when {
          isInside && notifyOnEnter && currentState == GeofencingRegionState.OUTSIDE.ordinal -> {
            // ENTER transition
            triggerGeofenceEvent(regionId, regionBundle, GeofencingRegionState.INSIDE, LocationModule.GEOFENCING_EVENT_ENTER)
          }
          !isInside && notifyOnExit && currentState == GeofencingRegionState.INSIDE.ordinal -> {
            // EXIT transition
            triggerGeofenceEvent(regionId, regionBundle, GeofencingRegionState.OUTSIDE, LocationModule.GEOFENCING_EVENT_EXIT)
          }
        }

        // Update the region state
        regionBundle.putInt("state", newState.ordinal)
      }
    }
  }

  private fun triggerGeofenceEvent(regionId: String, regionBundle: PersistableBundle, newState: GeofencingRegionState, eventType: Int) {
    val data = PersistableBundle()
    data.putInt("eventType", eventType)
    data.putPersistableBundle("region", regionBundle)
    
    val context = context.applicationContext
    taskManagerUtils.scheduleJob(context, mTask, listOf(data))
  }

  private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Float {
    val results = FloatArray(1)
    Location.distanceBetween(lat1, lon1, lat2, lon2, results)
    return results[0]
  }

  private fun preparePendingIntent(): PendingIntent {
    return taskManagerUtils.createTaskIntent(context, mTask)
  }

  private fun getParamAsDouble(param: Any?, errorMessage: String): Double {
    return when (param) {
      is Double -> param
      is Float -> param.toDouble()
      is Int -> param.toDouble()
      is Long -> param.toDouble()
      is String -> param.toDoubleOrNull()
      else -> null
    } ?: throw GeofencingException(errorMessage)
  }



  private fun bundleFromRegion(identifier: String, region: Map<String, Any>): PersistableBundle {
    return PersistableBundle().apply {
      val radius = getParamAsDouble(region["radius"], "Region: radius: `${region["radius"]}` can't be cast to Double")
      val longitude = getParamAsDouble(region["longitude"], "Region: longitude: `${region["longitude"]}` can't be cast to Double")
      val latitude = getParamAsDouble(region["latitude"], "Region: latitude: `${region["latitude"]}` can't be cast to Double")
      val notifyOnEnter = region["notifyOnEnter"] as? Boolean ?: true
      val notifyOnExit = region["notifyOnExit"] as? Boolean ?: true
      
      putString("identifier", identifier)
      putDouble("radius", radius)
      putDouble("latitude", latitude)
      putDouble("longitude", longitude)
      putBoolean("notifyOnEnter", notifyOnEnter)
      putBoolean("notifyOnExit", notifyOnExit)
      putInt("state", GeofencingRegionState.UNKNOWN.ordinal)
    }
  }



  companion object {
    private const val TAG = "GeofencingTaskConsumer"

    //endregion
  }
}
