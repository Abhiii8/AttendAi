/**
 * High-Accuracy GPS Geolocation Utility
 * Samples multiple GPS readings to lock onto true satellite fixes
 * rather than coarse cached Wi-Fi or cellular IP estimates.
 */
export const getHighAccuracyCoordinates = (maxWaitMs = 3500) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject(new Error("GPS Geolocation is not supported by your browser."));
    }

    let bestPosition = null;
    let watchId = null;
    let timeoutId = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    timeoutId = setTimeout(() => {
      cleanup();
      if (bestPosition) {
        resolve(bestPosition);
      } else {
        // Fallback to single-shot request
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos),
          (err) => reject(new Error("Unable to obtain GPS fix: " + err.message)),
          {
            enableHighAccuracy: true,
            timeout: 6000,
            maximumAge: 0
          }
        );
      }
    }, maxWaitMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          // Keep reading with the lowest accuracy radius (highest precision)
          if (!bestPosition || pos.coords.accuracy < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          // If accuracy is within 15 meters, that's high-grade GPS satellite lock!
          if (pos.coords.accuracy <= 15) {
            cleanup();
            resolve(pos);
          }
        },
        (err) => {
          // Don't fail immediately, wait for better readings or fallback
          console.warn("GPS reading glitch:", err.message);
        },
        {
          enableHighAccuracy: true,
          timeout: maxWaitMs,
          maximumAge: 0
        }
      );
    } catch (e) {
      cleanup();
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    }
  });
};
