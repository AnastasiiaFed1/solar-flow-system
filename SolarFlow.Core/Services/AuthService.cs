using System.Net.Http.Json;

namespace SolarFlow.Core.Services;

public class AuthService : IAuthService
{
    private readonly HttpClient _httpClient;
    private const string AuthTokenKey = "auth_token";

    public AuthService(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> LoginAsync(string email, string password)
    {
        try
        {
            var response = await _httpClient.PostAsJsonAsync("api/auth/login", new { Email = email, Password = password });
            if (response.IsSuccessStatusCode)
            {
                var result = await response.Content.ReadFromJsonAsync<LoginResponse>();
                if (result?.Token != null)
                {
                    await SecureStorage.SetAsync(AuthTokenKey, result.Token);
                    return true;
                }
            }
        }
        catch (Exception ex)
        {
            System.Diagnostics.Debug.WriteLine($"Login error: {ex.Message}");
        }
        return false;
    }

    public async Task LogoutAsync()
    {
        SecureStorage.Remove(AuthTokenKey);
        await Task.CompletedTask;
    }

    public async Task<string?> GetTokenAsync()
    {
        return await SecureStorage.GetAsync(AuthTokenKey);
    }

    private class LoginResponse
    {
        public string Token { get; set; } = string.Empty;
    }
}