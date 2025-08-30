export type TemperatureUnits = 'imperial' | 'metric';

const STORAGE_KEY = 'app-units';

export function getStoredUnits(): TemperatureUnits {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'imperial' || v === 'metric') return v;
  } catch {
    // ignore storage access errors (private mode, disabled storage, etc.)
  }
  return 'imperial';
}

export function setStoredUnits(units: TemperatureUnits) {
  try {
    localStorage.setItem(STORAGE_KEY, units);
    // simple broadcast for live widgets (optional to listen)
    window.dispatchEvent(
      new CustomEvent('units-changed', { detail: { units } })
    );
  } catch {
    // ignore storage write errors
  }
}

export function getTemperatureUnitParam(
  units: TemperatureUnits = getStoredUnits()
): 'fahrenheit' | 'celsius' {
  return units === 'metric' ? 'celsius' : 'fahrenheit';
}

export function getTemperatureSymbol(
  units: TemperatureUnits = getStoredUnits()
): '°F' | '°C' {
  return units === 'metric' ? '°C' : '°F';
}

// New unified measurement helpers (Aug 2025)

// Wind speed
export function getWindSpeedUnitParam(
  units: TemperatureUnits = getStoredUnits()
): 'mph' | 'kmh' {
  return units === 'metric' ? 'kmh' : 'mph';
}

export function getWindSpeedLabel(
  units: TemperatureUnits = getStoredUnits()
): 'mph' | 'km/h' {
  return units === 'metric' ? 'km/h' : 'mph';
}

// API parameter helper for precipitation units
export function getPrecipitationUnitParam(
  units: TemperatureUnits
): 'mm' | 'inch' {
  return units === 'metric' ? 'mm' : 'inch';
}

export function formatWindSpeed(
  speed: number,
  units: TemperatureUnits = getStoredUnits()
): string {
  // Values come from API in the unit requested via wind_speed_unit
  return `${Math.round(speed)} ${getWindSpeedLabel(units)}`;
}

// Visibility (Open-Meteo visibility is meters)
export function formatVisibility(
  meters: number,
  units: TemperatureUnits = getStoredUnits()
): string {
  if (!Number.isFinite(meters) || meters <= 0) return '—';
  if (units === 'metric') {
    const km = meters / 1000;
    return `${Math.round(km)} km`;
  }
  const miles = meters / 1609.34;
  const rounded = miles >= 10 ? Math.round(miles) : Math.round(miles * 10) / 10;
  return `${rounded} mi`;
}

// Precipitation (Open-Meteo daily.precipitation_sum is millimeters)
export function formatPrecipitation(
  millimeters: number,
  units: TemperatureUnits = getStoredUnits()
): string {
  if (!Number.isFinite(millimeters)) return '—';
  if (units === 'metric') return `${Math.round(millimeters)} mm`;
  const inches = millimeters / 25.4;
  const rounded =
    inches >= 10 ? Math.round(inches) : Math.round(inches * 10) / 10;
  return `${rounded} in`;
}

// Pressure (Open-Meteo surface_pressure is hPa)
export function formatPressure(
  hPa: number,
  units: TemperatureUnits = getStoredUnits()
): string {
  if (!Number.isFinite(hPa)) return '—';
  if (units === 'metric') return `${Math.round(hPa)} hPa`;
  const inHg = hPa * 0.02953;
  return `${(Math.round(inHg * 100) / 100).toFixed(2)} inHg`;
}

export function getUnitSystemName(
  units: TemperatureUnits = getStoredUnits()
): 'Imperial' | 'Metric' {
  return units === 'metric' ? 'Metric' : 'Imperial';
}

// Distance (input in kilometers)
export function formatDistance(
  km: number,
  units: TemperatureUnits = getStoredUnits()
): string {
  if (!Number.isFinite(km) || km <= 0) return '—';
  if (units === 'metric') {
    const rounded = km < 10 ? Math.round(km * 10) / 10 : Math.round(km);
    return `${rounded}${rounded < 10 && km < 10 && !Number.isInteger(rounded) ? '' : ''} km`;
  }
  const mi = km * 0.621371;
  const rounded = mi < 10 ? Math.round(mi * 10) / 10 : Math.round(mi);
  return `${rounded} mi`;
}
