using System.Net.Http.Headers;
using System.Net.Http.Json;
using SolarFlow.Mobile.Models;

namespace SolarFlow.Mobile.Services;

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
        var token = await _authService.GetTokenAsync();
        if (!string.IsNullOrEmpty(token))
        {
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        }
        return await _httpClient.GetFromJsonAsync<List<SolarStationModel>>("api/stations") ?? new();
    }
}