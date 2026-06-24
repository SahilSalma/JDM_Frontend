'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

interface GoogleMapsContextValue {
  isLoaded: boolean;
}

const GoogleMapsContext = createContext<GoogleMapsContextValue>({ isLoaded: false });

export function useGoogleMaps() {
  return useContext(GoogleMapsContext);
}

let loaderPromise: Promise<void> | null = null;

export function GoogleMapsProvider({ children }: { children: ReactNode }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (!loaderPromise) {
      setOptions({ key: apiKey, libraries: ['places'] });
      loaderPromise = importLibrary('places').then(() => {});
    }

    loaderPromise
      .then(() => setIsLoaded(true))
      .catch(() => {
        // Google Maps failed to load — fall back to manual input
      });
  }, []);

  return (
    <GoogleMapsContext.Provider value={{ isLoaded }}>
      {children}
    </GoogleMapsContext.Provider>
  );
}
