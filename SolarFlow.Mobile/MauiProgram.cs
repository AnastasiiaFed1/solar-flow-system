using SolarFlow.Core.Services;
using SolarFlow.Core.ViewModels;
using SolarFlow.Mobile.Views;

namespace SolarFlow.Mobile;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder.UseMauiApp<App>();

        string baseUrl = DeviceInfo.Platform == DevicePlatform.Android
            ? "http://10.0.2.2:5000/"
            : "http://localhost:5000/";

        builder.Services.AddSingleton(new HttpClient { BaseAddress = new Uri(baseUrl) });
        builder.Services.AddSingleton<IAuthService, AuthService>();
        builder.Services.AddSingleton<IApiService, ApiService>();

        builder.Services.AddTransient<LoginViewModel>();
        builder.Services.AddTransient<StationDetailViewModel>();
        builder.Services.AddTransient<StationsViewModel>();

        builder.Services.AddTransient<LoginPage>();
        builder.Services.AddTransient<StationDetailPage>();

        return builder.Build();
    }
}