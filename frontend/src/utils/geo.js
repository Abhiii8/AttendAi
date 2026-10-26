/**
 * Resilient High-Accuracy GPS Geolocation Utility
 * 
 * Strategy:
 * 1. Attempt high-accuracy GPS with watchPosition (seeking <= 20m satellite fix).
 * 2. If <= 20m is reached, resolve immediately.
 * 3. Cache the best reading seen so far.
 * 4. If high-accuracy takes too long (e.g. indoors, concrete walls, battery-saver mode),
 *    smoothly fall back to standard network/Wi-Fi positioning (enableHighAccuracy: false).
 * 5. Handle permission-denied vs timeout errors with user-friendly messages.
 */
export const getHighAccuracyCoordinates = (preferredWaitMs = 5000) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("Geolocation is not supported by your browser."));
    }

    let bestPosition = null;
    let watchId = null;
    let fallbackTimer = null;
    let isResolved = false;

    const cleanup = () => {
      if (watchId !== null) {
        try {
          navigator.geolocation.clearWatch(watchId);
        } catch (e) {
          // ignore
        }
        watchId = null;
      }
      if (fallbackTimer !== null) {
        clearTimeout(fallbackTimer);
        fallbackTimer = null;
      }
    };

    const finishSuccess = (pos) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      resolve(pos);
    };

    const finishError = (err) => {
      if (isResolved) return;
      isResolved = true;
      cleanup();
      
      let msg = "Unable to retrieve device location.";
      if (err) {
        if (err.code === 1) { // PERMISSION_DENIED
          msg = "Location permission denied. Please allow location access in your browser settings.";
        } else if (err.code === 2) { // POSITION_UNAVAILABLE
          msg = "Location unavailable. Please make sure Location/GPS is turned ON on your phone.";
        } else if (err.code === 3) { // TIMEOUT
          msg = "Location request timed out. Please ensure GPS/Location is enabled and try again.";
        } else if (err.message) {
          msg = err.message;
        }
      }
      reject(new Error(msg));
    };

    // Fallback runner: If satellite GPS is taking too long or times out
    const runStandardFallback = () => {
      if (bestPosition) {
        return finishSuccess(bestPosition);
      }

      // Try standard accuracy (cellular / Wi-Fi triangulation) with generous cache
      navigator.geolocation.getCurrentPosition(
        (pos) => finishSuccess(pos),
        (fallbackErr) => {
          if (bestPosition) {
            finishSuccess(bestPosition);
          } else {
            finishError(fallbackErr);
          }
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000 // Accept up to 1-minute cached fix
        }
      );
    };

    // Set safety timer: after preferredWaitMs, fallback to standard accuracy
    fallbackTimer = setTimeout(() => {
      if (bestPosition) {
        finishSuccess(bestPosition);
      } else {
        runStandardFallback();
      }
    }, preferredWaitMs);

    try {
      // Step 1: Start watchPosition with high accuracy
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          // Ideal satellite fix (accuracy <= 20 meters)
          if (pos.coords.accuracy <= 20) {
            finishSuccess(pos);
          }
        },
        (watchErr) => {
          // If permission was explicitly denied, fail immediately without waiting
          if (watchErr.code === 1) {
            finishError(watchErr);
          } else {
            console.warn("GPS watch glitch:", watchErr.message);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: preferredWaitMs + 3000,
          maximumAge: 15000 // Accept up to 15-second old fix to avoid cold-start freeze
        }
      );
    } catch (err) {
      runStandardFallback();
    }
  });
};
