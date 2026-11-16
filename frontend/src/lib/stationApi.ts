import { apiRequest } from './apiClient';

export interface StationSummary {
  id: number;
  name: string;
  tiltAngle: number;
  azimuthAngle: number;
}

export function getStations(signal: AbortSignal) {
  return apiRequest<StationSummary[]>('/api/stations', { signal });
}
