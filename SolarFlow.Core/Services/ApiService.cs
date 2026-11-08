using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using SolarFlow.Core.Models;

namespace SolarFlow.Core.Services;

public class ApiService : IApiService
{
    private readonly HttpClient _httpClient;
    private readonly IAuthService _authService;

    public ApiService(HttpClient httpClient, IAuthService authService)
    {
        _httpClient = httpClient;
        _authService = authService;
    }

    public async Task<List<SolarStationModel>> GetStationsAsync()
    {
        // Edge Case 1: Перевірка інтернет-з'єднання (Offline mode)
        if (Connectivity.Current.NetworkAccess != NetworkAccess.Internet)
        {
            throw new InvalidOperationException("Відсутнє підключення до мережі Інтернет.");
        }

        // Edge Case 2: Обробка відсутності токена авторизації
        var token = await _authService.GetTokenAsync();
        if (string.IsNullOrEmpty(token))
        {
            throw new UnauthorizedAccessException("Користувач не авторизований.");
        }

        _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        try
        {
            var response = await _httpClient.GetAsync("api/stations");

            // Edge Case 3: Обробка 404/500 помилок сервера без аварійного завершення
            if (response.StatusCode == HttpStatusCode.NotFound) return new List<SolarStationModel>();
            if (!response.IsSuccessStatusCode) throw new HttpRequestException($"Помилка сервера: {response.StatusCode}");

            var data = await response.Content.ReadFromJsonAsync<List<SolarStationModel>>();

            // Edge Case 4: Обробка порожніх/некоректних даних
            return data ?? new List<SolarStationModel>();
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"API Exception: {ex.Message}");
            throw;
        }
    }

    // Edge Case 5: Межові значення та валідація потужності приладу (0 < Power <= 50000 Вт)
    public bool ValidateAppliancePower(double powerWatts)
    {
        if (double.IsNaN(powerWatts) || double.IsInfinity(powerWatts)) return false;
        return powerWatts > 0 && powerWatts <= 50000;
    }

    public async Task<List<ApplianceModel>> GetAppliancesAsync()
    {
        var token = await _authService.GetTokenAsync();
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        return await _httpClient.GetFromJsonAsync<List<ApplianceModel>>("api/appliances") ?? new();
    }
}