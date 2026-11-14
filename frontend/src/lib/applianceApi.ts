
import { apiRequest } from './apiClient';

import type {
  Appliance,
  CreateAppliance,
  UpdateAppliance,
  ApplianceFilters,
} from '../types/appliance';

const ENDPOINT = '/api/Appliances';

// РћС‚СЂРёРјР°С‚Рё РІСЃС– РїСЂРёР»Р°РґРё Р· РЅРµРѕР±РѕРІ'СЏР·РєРѕРІРёРјРё С„С–Р»СЊС‚СЂР°РјРё
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

// РћС‚СЂРёРјР°С‚Рё РїСЂРёР»Р°Рґ Р·Р° ID
export function getApplianceById(id: number): Promise<Appliance> {
  return apiRequest<Appliance>(`${ENDPOINT}/${id}`);
}

// РЎС‚РІРѕСЂРёС‚Рё РЅРѕРІРёР№ РїСЂРёР»Р°Рґ
export function createAppliance(
  data: CreateAppliance
): Promise<Appliance> {
  return apiRequest<Appliance>(ENDPOINT, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// РћРЅРѕРІРёС‚Рё РЅР°СЏРІРЅРёР№ РїСЂРёР»Р°Рґ
export function updateAppliance(
  id: number,
  data: UpdateAppliance
): Promise<Appliance> {
  return apiRequest<Appliance>(`${ENDPOINT}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// Р’РёРґР°Р»РёС‚Рё РїСЂРёР»Р°Рґ
export function deleteAppliance(id: number): Promise<void> {
  return apiRequest<void>(`${ENDPOINT}/${id}`, {
    method: 'DELETE',
  });
}
