export const weatherFactors = { clear: 1, cloudy: 0.55, overcast: 0.25 } as const;

export interface SolarSettings {
  capacityKw: number;
  tilt: number;
  azimuth: number;
  weather: keyof typeof weatherFactors;
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;

// A representative day: sunrise at 06:00, sunset at 18:00 and solar noon at 12:00.
export function solarPowerAt(hour: number, settings: SolarSettings): number {
  if (hour <= 6 || hour >= 18) return 0;

  const phase = (hour - 6) / 12;
  const daylight = Math.sin(Math.PI * phase);
  const elevation = radians(60 * daylight);
  const tilt = radians(settings.tilt);
  const sunAzimuth = 90 + 180 * phase;
  const difference = radians(sunAzimuth - settings.azimuth);
  const incidence = Math.sin(elevation) * Math.cos(tilt)
    + Math.cos(elevation) * Math.sin(tilt) * Math.cos(difference);

  return settings.capacityKw * weatherFactors[settings.weather] * daylight * Math.max(0, incidence);
}

export function dailySolarProfile(settings: SolarSettings) {
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    powerKw: solarPowerAt(hour + 0.5, settings),
  }));
}
