import { useEffect, useState } from 'react';

import {
  canUseBrowserGeolocation,
  getCurrentCoordinates,
  reverseGeocodeCoordinates,
} from './geolocation';
import {
  getNearYouCoords,
  getNearYouRadiusMiles,
  NEAR_YOU_COORDS_KEY,
  NEAR_YOU_ENABLED_KEY,
  setNearYouRadiusMiles,
} from './locationPrefs';

const NEAR_YOU_NAME_KEY = 'outgoing.nearYou.locationName';

export function useNearYou() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    return localStorage.getItem(NEAR_YOU_ENABLED_KEY) === 'true';
  });

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(() => {
    return getNearYouCoords();
  });

  const [locationName, setLocationName] = useState<string>(() => {
    return localStorage.getItem(NEAR_YOU_NAME_KEY) || '';
  });
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [radiusMiles, setRadiusMilesState] = useState<number>(() =>
    getNearYouRadiusMiles(),
  );

  // 1. Mount-only auto-detection
  useEffect(() => {
    // If already enabled from localStorage, the enabled-sync hook will handle it.
    if (enabled) return;

    // Try auto-enabling if possible (won't prompt if denied)
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(newCoords);
          setEnabled(true);
          localStorage.setItem(NEAR_YOU_ENABLED_KEY, 'true');
          localStorage.setItem(NEAR_YOU_COORDS_KEY, JSON.stringify(newCoords));
        },
        () => {
          // ignore error silently on auto-load
        },
      );
    }
  }, []); // Run ONLY on mount

  // 2. Sync location name when enabled
  useEffect(() => {
    if (enabled && !locationName) {
      const storedCoords = getNearYouCoords();
      if (storedCoords) {
        setCoords(storedCoords);
        reverseGeocodeCoordinates(storedCoords.lat, storedCoords.lng).then((res) => {
          if (res) {
            const parts = res.displayAddress?.split(', ') || [];
            const cityState =
              parts.length >= 3 ? `${parts[0]}, ${parts[2]}` : res.venueName;
            const resolvedName = cityState || 'Near You';
            setLocationName(resolvedName);
            localStorage.setItem(NEAR_YOU_NAME_KEY, resolvedName);
          } else {
            setLocationName('Near You');
            localStorage.setItem(NEAR_YOU_NAME_KEY, 'Near You');
          }
        });
      }
    }
  }, [enabled, locationName]);

  const toggleLocation = async () => {
    if (enabled) {
      setEnabled(false);
      localStorage.setItem(NEAR_YOU_ENABLED_KEY, 'false');
      localStorage.removeItem(NEAR_YOU_COORDS_KEY);
      localStorage.removeItem(NEAR_YOU_NAME_KEY);
      setCoords(null);
      setLocationName('');
      window.dispatchEvent(new Event('nearYouChanged'));
      return;
    }

    if (!canUseBrowserGeolocation()) {
      alert('Could not use geolocation in this environment.');
      return;
    }

    setIsDetecting(true);
    setLocationName('Locating...');

    try {
      const { latitude, longitude } = await getCurrentCoordinates();
      const newCoords = { lat: latitude, lng: longitude };

      localStorage.setItem(NEAR_YOU_ENABLED_KEY, 'true');
      localStorage.setItem(NEAR_YOU_COORDS_KEY, JSON.stringify(newCoords));

      setCoords(newCoords);
      setEnabled(true);
      window.dispatchEvent(new Event('nearYouChanged'));

      const res = await reverseGeocodeCoordinates(latitude, longitude);
      if (res) {
        const parts = res.displayAddress?.split(', ') || [];
        const cityState =
          parts.length >= 3 ? `${parts[0]}, ${parts[2]}` : res.venueName;
        const resolvedName = cityState || 'Near You';
        setLocationName(resolvedName);
        localStorage.setItem(NEAR_YOU_NAME_KEY, resolvedName);
      } else {
        setLocationName('Near You');
        localStorage.setItem(NEAR_YOU_NAME_KEY, 'Near You');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      setLocationName('');
    } finally {
      setIsDetecting(false);
    }
  };

  const setRadiusMiles = (miles: number) => {
    const value = Math.min(500, Math.max(1, Math.round(miles)));
    setNearYouRadiusMiles(value);
    setRadiusMilesState(value);
    window.dispatchEvent(new Event('nearYouChanged'));
  };

  return {
    enabled,
    coords,
    locationName,
    isDetecting,
    radiusMiles,
    setRadiusMiles,
    toggleLocation,
  };
}
