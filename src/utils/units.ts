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
