
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiRequest } from './apiClient';

describe('REST API Client', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('РїРѕРІРµСЂС‚Р°С” JSON С–Р· РІС–РґРїРѕРІС–РґС– СЃРµСЂРІРµСЂР°', async () => {
    const data = [{ id: 1, name: 'РҐРѕР»РѕРґРёР»СЊРЅРёРє' }];

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => data,
    });

    vi.stubGlobal('fetch', fetchMock);

    const result = await apiRequest<typeof data>('/api/Appliances');

    expect(result).toEqual(data);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('РѕР±СЂРѕР±Р»СЏС” HTTP-РїРѕРјРёР»РєСѓ 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
      })
    );

    await expect(
      apiRequest('/api/Appliances/999')
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('РѕР±СЂРѕР±Р»СЏС” РІС–РґРїРѕРІС–РґСЊ 204 No Content', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 204,
      })
    );

    const result = await apiRequest<void>('/api/Appliances/1', {
      method: 'DELETE',
    });

    expect(result).toBeUndefined();
  });

  it('РѕР±СЂРѕР±Р»СЏС” РЅРµРґРѕСЃС‚СѓРїРЅС–СЃС‚СЊ СЃРµСЂРІРµСЂР°', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    );

    await expect(
      apiRequest('/api/Appliances')
    ).rejects.toThrow('РќРµ РІРґР°Р»РѕСЃСЏ РїС–РґРєР»СЋС‡РёС‚РёСЃСЏ РґРѕ СЃРµСЂРІРµСЂР°');
  });
});
