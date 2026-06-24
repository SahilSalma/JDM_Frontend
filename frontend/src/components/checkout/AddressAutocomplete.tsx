'use client';

import { useRef, useState, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode } from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { useGoogleMaps } from '@/components/providers/GoogleMapsProvider';
import { cn } from '@/lib/utils';

export interface ParsedAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parsed: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function extractComponent(
  components: google.maps.GeocoderAddressComponent[],
  type: string,
  form: 'long' | 'short' = 'long',
): string {
  const comp = components.find((c) => c.types.includes(type));
  return comp ? (form === 'short' ? comp.short_name : comp.long_name) : '';
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Start typing your address...',
  className,
  required,
}: AddressAutocompleteProps) {
  const { isLoaded } = useGoogleMaps();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    ready,
    suggestions: { status, data },
    setValue: setAutocompleteValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      componentRestrictions: { country: 'us' },
      types: ['address'],
    },
    debounce: 300,
    initOnMount: isLoaded,
  });

  const handleInput = (val: string) => {
    onChange(val);
    setAutocompleteValue(val);
    setShowSuggestions(true);
    setFocusedIndex(-1);
  };

  const handleSelect = async (description: string) => {
    setAutocompleteValue(description, false);
    onChange(description);
    clearSuggestions();
    setShowSuggestions(false);
    setFocusedIndex(-1);

    try {
      const results = await getGeocode({ address: description });
      const components = results[0].address_components;

      const streetNumber = extractComponent(components, 'street_number');
      const route = extractComponent(components, 'route');
      const address = streetNumber ? `${streetNumber} ${route}` : route;

      const city =
        extractComponent(components, 'locality') ||
        extractComponent(components, 'sublocality_level_1') ||
        extractComponent(components, 'administrative_area_level_2');

      const state = extractComponent(components, 'administrative_area_level_1', 'short');
      const zip = extractComponent(components, 'postal_code');

      onSelect({ address, city, state, zip });
    } catch {
      // Geocoding failed — the typed value remains; user fills manually
    }
  };

  // Reset focus index when suggestions change
  useEffect(() => {
    setFocusedIndex(-1);
  }, [data]);

  // Scroll focused element into view
  useEffect(() => {
    if (focusedIndex >= 0) {
      const el = document.querySelector(`[data-addr-item="${focusedIndex}"]`);
      if (el) {
        el.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // If Google Maps isn't loaded, just render a plain input
  if (!isLoaded || !ready) {
    return (
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        value={value}
        onChange={(e) => handleInput(e.target.value)}
        onFocus={() => data.length > 0 && setShowSuggestions(true)}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setShowSuggestions(false), 200);
        }}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
        onKeyDown={(e) => {
          if (showSuggestions && status === 'OK' && data.length > 0) {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setFocusedIndex((prev) => (prev + 1) % data.length);
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setFocusedIndex((prev) => (prev - 1 + data.length) % data.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              const targetIndex = focusedIndex >= 0 ? focusedIndex : 0;
              const targetSuggestion = data[targetIndex];
              if (targetSuggestion) {
                handleSelect(targetSuggestion.description);
              }
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setShowSuggestions(false);
              setFocusedIndex(-1);
            }
          }
        }}
      />
      {showSuggestions && status === 'OK' && data.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-lg font-sans">
          {data.map((suggestion, idx) => (
            <li
              key={suggestion.place_id}
              data-addr-item={idx}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(suggestion.description)}
              className={cn(
                'cursor-pointer rounded-sm px-3 py-2 text-sm text-foreground transition-colors',
                'hover:bg-accent hover:text-accent-foreground',
                idx === focusedIndex && 'bg-accent text-accent-foreground',
              )}
            >
              <span className="font-medium">
                {suggestion.structured_formatting.main_text}
              </span>
              <span className="ml-1 text-muted-foreground text-xs">
                {suggestion.structured_formatting.secondary_text}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
