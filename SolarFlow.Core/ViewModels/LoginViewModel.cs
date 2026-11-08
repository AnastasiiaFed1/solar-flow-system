using System.Windows.Input;
using SolarFlow.Core.Services;

namespace SolarFlow.Core.ViewModels;

public class LoginViewModel : BaseViewModel
{
    private readonly IAuthService _authService;
    private string _email = string.Empty;
    private string _password = string.Empty;

    public string Email { get => _email; set { _email = value; OnPropertyChanged(); } }
    public string Password { get => _password; set { _password = value; OnPropertyChanged(); } }
    public ICommand LoginCommand { get; }

    public LoginViewModel(IAuthService authService)
    {
        _authService = authService;
        Title = "Вхід SolarFlow";
        LoginCommand = new Command(async () => await OnLogin());
    }

    // Змінено private на public для безперешкодного виклику в Unit-тестах
    public async Task OnLogin()
    {
        if (IsBusy) return;
        IsBusy = true;
        bool ok = await _authService.LoginAsync(Email, Password);
        IsBusy = false;

        // Перевіряємо Shell.Current на null, щоб у тестах без заповненого UI не виникав NullReferenceException
        if (Shell.Current != null)
        {
            if (ok)
                await Shell.Current.GoToAsync("//StationsPage");
            else
                await Shell.Current.DisplayAlert("Помилка", "Невірно введені дані", "OK");
        }
    }
}