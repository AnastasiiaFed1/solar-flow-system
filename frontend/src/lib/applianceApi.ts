
import { apiRequest } from './apiClient';

import type {
  Appliance,
  CreateAppliance,
  UpdateAppliance,
  ApplianceFilters,
} from '../types/appliance';

const ENDPOINT = '/api/Appliances';

// Отримати всі прилади з необов'язковими фільтрами
export function getAppliances(
  filters: ApplianceFilters = {}
): Promise<Appliance[]> {
  const params = new URLSearchParams();

  if (filters.minPower !== undefined) {
    params.set('minPower', String(filters.minPower));
  }

  if (filters.maxPower !== undefined) {
    params.set('maxPower', String(filters.maxPower));
  }

  if (filters.isActive !== undefined) {
    params.set('isActive', String(filters.isActive));
  }

  const query = params.toString();
  const url = query ? `${ENDPOINT}?${query}` : ENDPOINT;

  return apiRequest<Appliance[]>(url);
}

// Отримати прилад за ID
export function getApplianceById(id: number): Promise<Appliance> {
  return apiRequest<Appliance>(`${ENDPOINT}/${id}`);
}

// Створити новий прилад
export function createAppliance(
  data: CreateAppliance
): Promise<Appliance> {
  return apiRequest<Appliance>(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// Оновити наявний прилад
export function updateAppliance(
  id: number,
  data: UpdateAppliance
): Promise<Appliance> {
  return apiRequest<Appliance>(`${ENDPOINT}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Видалити прилад
export function deleteAppliance(id: number): Promise<void> {
  return apiRequest<void>(`${ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
}
