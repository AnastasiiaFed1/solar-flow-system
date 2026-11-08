namespace SolarFlow.Core.Services;

public interface IAuthService
{
    Task<bool> LoginAsync(string email, string password);
    Task LogoutAsync();
    Task<string?> GetTokenAsync();
}